import { create } from 'zustand';
import * as THREE from 'three';

interface SkyColors {
  sky: THREE.Color;
  horizon: THREE.Color;
  mid: THREE.Color;
}

type TimePhase = 'night' | 'dawn' | 'sunrise' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'dusk';

interface ProceduralSkyState {
  currentTime: number;
  currentPhase: TimePhase;
  skyColors: SkyColors;
  timeCycleDuration: number;
  isAnimating: boolean;
  /** When non-null, ProceduralSky FORCES this hour for the sun/sky/moonlight
   *  (overriding the day cycle) — this is what `setTimeOfDay(hour, true)` sets so
   *  the actual lighting (not just the darkness term) follows the forced time. */
  timeOverride: number | null;

  setCurrentTime: (time: number) => void;
  setSkyColors: (colors: SkyColors) => void;
  setTimeCycleDuration: (duration: number) => void;
  setPhase: (phase: TimePhase) => void;
  setTimeOverride: (time: number | null) => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  calculateSkyColors: (time: number) => SkyColors;
}

const TIME_PHASES: { phase: TimePhase; start: number; end: number }[] = [
  { phase: 'night', start: 0, end: 5 },
  { phase: 'dawn', start: 5, end: 6.5 },
  { phase: 'sunrise', start: 6.5, end: 8 },
  { phase: 'morning', start: 8, end: 11 },
  { phase: 'midday', start: 11, end: 14 },
  { phase: 'afternoon', start: 14, end: 17 },
  { phase: 'evening', start: 17, end: 19 },
  { phase: 'dusk', start: 19, end: 21 },
  { phase: 'night', start: 21, end: 24 },
];

const getTimePhase = (time: number): TimePhase => {
  for (const { phase, start, end } of TIME_PHASES) {
    if (time >= start && time < end) {
      return phase;
    }
  }
  return 'night';
};

const PHASE_COLORS: Record<TimePhase, SkyColors> = {
  night: {
    sky: new THREE.Color('#0B0B3B'),
    horizon: new THREE.Color('#1A1A4D'),
    mid: new THREE.Color('#151545')
  },
  dawn: {
    sky: new THREE.Color('#1a1a4a'),
    horizon: new THREE.Color('#3d2645'),
    mid: new THREE.Color('#2a2050')
  },
  sunrise: {
    sky: new THREE.Color('#FFB6C1'),
    horizon: new THREE.Color('#FFDAB9'),
    mid: new THREE.Color('#FFC8DD')
  },
  // Daytime palette is deliberately deeper/more saturated than the
  // original pastels — the sky dome fills half the screen and the fog
  // color derives from these, so washed-pastel sky/horizon values made
  // the entire daytime world read as white-out. Horizon keeps a warm
  // cast but stays well off white.
  morning: {
    sky: new THREE.Color('#4290C2'),
    horizon: new THREE.Color('#C7B58D'),
    mid: new THREE.Color('#5FA6D3')
  },
  midday: {
    sky: new THREE.Color('#3486C6'),
    horizon: new THREE.Color('#CBB68C'),
    mid: new THREE.Color('#549ED4')
  },
  afternoon: {
    sky: new THREE.Color('#3577AC'),
    horizon: new THREE.Color('#C7A06A'),
    mid: new THREE.Color('#5290BC')
  },
  // Evening/dusk are deliberately DIMMER than afternoon — the sun is low
  // (sets at 20.5) and the terrain darkness ramp runs 18.5→20.5, so the
  // sky and fog must descend with it. The old palette kept daylight-bright
  // peach until the night flip at 21: a dim, long-shadowed world sat under
  // a bright sky with near-white fog for hours of game time.
  evening: {
    sky: new THREE.Color('#9F7C57'),
    horizon: new THREE.Color('#CC9F70'),
    mid: new THREE.Color('#B28D74')
  },
  dusk: {
    sky: new THREE.Color('#4E3550'),
    horizon: new THREE.Color('#A85B45'),
    mid: new THREE.Color('#6B4655')
  }
};

const getPhaseProgress = (time: number, phase: TimePhase): number => {
  const phaseData = TIME_PHASES.find(p => p.phase === phase && time >= p.start && time < p.end);
  if (!phaseData) return 0;
  return (time - phaseData.start) / (phaseData.end - phaseData.start);
};

const getNextPhase = (phase: TimePhase): TimePhase => {
  const order: TimePhase[] = ['night', 'dawn', 'sunrise', 'morning', 'midday', 'afternoon', 'evening', 'dusk'];
  const idx = order.indexOf(phase);
  return order[(idx + 1) % order.length];
};

const calculateSkyColorsFromTime = (currentTime: number): SkyColors => {
  const phase = getTimePhase(currentTime);
  const progress = getPhaseProgress(currentTime, phase);
  const currentColors = PHASE_COLORS[phase];
  const nextColors = PHASE_COLORS[getNextPhase(phase)];
  
  const blendFactor = Math.pow(progress, 0.8);
  
  return {
    sky: currentColors.sky.clone().lerp(nextColors.sky, blendFactor * 0.3),
    horizon: currentColors.horizon.clone().lerp(nextColors.horizon, blendFactor * 0.3),
    mid: currentColors.mid.clone().lerp(nextColors.mid, blendFactor * 0.3)
  };
};

const useProceduralSkyStore = create<ProceduralSkyState>((set, get) => ({
  currentTime: 12,
  currentPhase: 'midday',
  skyColors: PHASE_COLORS.midday,
  timeCycleDuration: 0,
  isAnimating: false,
  timeOverride: null,

  setTimeOverride: (time: number | null) => set({ timeOverride: time }),

  setCurrentTime: (time: number) => {
    const newPhase = getTimePhase(time);
    const oldPhase = get().currentPhase;
    
    if (newPhase !== oldPhase) {
      const newColors = calculateSkyColorsFromTime(time);
      set({ currentTime: time, currentPhase: newPhase, skyColors: newColors });
    } else {
      set({ currentTime: time });
    }
  },
  
  setSkyColors: (colors: SkyColors) => set({ skyColors: colors }),
  
  setTimeCycleDuration: (duration: number) => set({ timeCycleDuration: duration }),
  
  setPhase: (phase: TimePhase) => set({ currentPhase: phase, skyColors: PHASE_COLORS[phase] }),
  
  startAnimation: () => set({ isAnimating: true }),
  
  stopAnimation: () => set({ isAnimating: false }),
  
  calculateSkyColors: calculateSkyColorsFromTime
}));

export default useProceduralSkyStore;
export { calculateSkyColorsFromTime, getTimePhase, PHASE_COLORS, TIME_PHASES };
export type { SkyColors, ProceduralSkyState, TimePhase };
