/**
 * Natural idle animation system — per-instance port of the Player
 * controller's human-like idle (Player.jsx `naturalIdleState` /
 * `setupNaturalIdleSystem` / `updateNaturalIdleAnimation`), so remote
 * Participants idle the same way the local player does instead of looping
 * the raw idle clip.
 *
 * Two layers from the SAME idle clip:
 *  1. breathing — continuously looping at low weight (subtle motion),
 *  2. pose — timeScale 0, its `.time` scrubbed between random poses in the
 *     middle 60% of the clip with distance-adaptive easing, micro speed
 *     variation, jitter skipping, and natural pauses.
 *
 * The algorithm is copied verbatim from Player.jsx (which keeps its own
 * module-level copy for now — the local player is single-instance).
 */
import type { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import { LoopRepeat } from 'three';

export interface NaturalIdleState {
	targetTime: number;
	currentTime: number;
	transitionSpeed: number;
	nextTransitionIn: number;
	transitionTimer: number;
	isTransitioning: boolean;
	animationDuration: number;
	preferredRange: { min: number; max: number };
	baseSpeed: number;
	currentSpeed: number;
	speedVariation: number;
	microAdjustmentTimer: number;
	nextMicroAdjustment: number;
	previousTime: number;
	blendFactor: number;
	transitionDuration: number;
	transitionElapsed: number;
	shortMovementSkips: number;
	closenessThreshold: number;
	breathingAction: AnimationAction | null;
	poseAction: AnimationAction | null;
	breathingWeight: number;
	poseWeight: number;
	enabled: boolean;
}

export function createNaturalIdleState(): NaturalIdleState {
	return {
		targetTime: 0,
		currentTime: 0,
		transitionSpeed: 1.2,
		nextTransitionIn: 1.5 + Math.random() * 2,
		transitionTimer: 0,
		isTransitioning: false,
		animationDuration: 0,
		preferredRange: { min: 0, max: 0 },
		baseSpeed: 1.2,
		currentSpeed: 1.2,
		speedVariation: 0,
		microAdjustmentTimer: 0,
		nextMicroAdjustment: 0.5 + Math.random() * 1.5,
		previousTime: 0,
		blendFactor: 0,
		transitionDuration: 0,
		transitionElapsed: 0,
		shortMovementSkips: 0,
		closenessThreshold: 0.08,
		breathingAction: null,
		poseAction: null,
		breathingWeight: 0.15,
		poseWeight: 0.85,
		enabled: false,
	};
}

/**
 * Split an idle clip into the breathing + frozen-pose layers.
 * `idleAction` becomes the pose layer — its weight can keep being driven by
 * whatever animation state machine already owns it; the breathing layer is
 * meant to FOLLOW that weight at breathingWeight/poseWeight ratio (see
 * followBreathingWeight).
 */
export function setupNaturalIdleSystem(
	state: NaturalIdleState,
	animationClip: AnimationClip,
	idleAction: AnimationAction,
	mixer: AnimationMixer,
): void {
	if (!animationClip || !idleAction || !mixer) return;

	// 1. Breathing layer — continuously playing at low weight.
	const breathingAction = mixer.clipAction(animationClip.clone());
	breathingAction.setLoop(LoopRepeat, Infinity);
	breathingAction.weight = state.breathingWeight;
	breathingAction.play();
	state.breathingAction = breathingAction;

	// 2. Pose layer — frozen poses at high weight (the existing idle action).
	idleAction.setLoop(LoopRepeat, Infinity);
	idleAction.weight = state.poseWeight;
	idleAction.timeScale = 0; // frozen — time is scrubbed manually
	state.poseAction = idleAction;

	state.animationDuration = animationClip.duration;

	// Preferred range: middle 60% of the animation (more natural poses).
	const middleStart = animationClip.duration * 0.2;
	const middleEnd = animationClip.duration * 0.8;
	state.preferredRange = { min: middleStart, max: middleEnd };

	const initialTime = middleStart + Math.random() * (middleEnd - middleStart);
	state.targetTime = initialTime;
	state.currentTime = initialTime;
	idleAction.time = initialTime;

	state.enabled = true;
}

/** Advance the pose scrubbing — call once per rendered frame while idling. */
export function updateNaturalIdleAnimation(state: NaturalIdleState, delta: number): void {
	if (!state.enabled || !state.poseAction) return;

	state.microAdjustmentTimer += delta;
	state.transitionElapsed += delta;

	// Dynamic speed variations for organic feel.
	if (state.microAdjustmentTimer >= state.nextMicroAdjustment) {
		state.speedVariation = 0.8 + Math.random() * 1.0;
		state.currentSpeed = state.baseSpeed * state.speedVariation;
		state.microAdjustmentTimer = 0;
		state.nextMicroAdjustment = 0.3 + Math.random() * 2.0;
	}

	// Start new transition if not currently transitioning.
	if (!state.isTransitioning) {
		const { min, max } = state.preferredRange;
		const rangeSize = max - min;

		state.previousTime = state.currentTime;

		// Center bias for more natural, less predictable movement.
		let newTarget: number;
		const centerBias = 0.3;
		if (Math.random() < centerBias) {
			const centerStart = min + rangeSize * 0.35;
			const centerEnd = min + rangeSize * 0.65;
			newTarget = centerStart + Math.random() * (centerEnd - centerStart);
		} else {
			newTarget = min + Math.random() * rangeSize;
		}
		newTarget = Math.max(min, Math.min(max, newTarget));

		// Jitter prevention: skip too-short movements (up to two in a row).
		const distance = Math.abs(newTarget - state.currentTime);
		const normalizedDistance = distance / rangeSize;
		if (normalizedDistance < state.closenessThreshold && state.shortMovementSkips < 2) {
			state.shortMovementSkips++;
			state.transitionElapsed = -(0.1 + Math.random() * 0.3);
			return;
		}
		if (normalizedDistance >= state.closenessThreshold) {
			state.shortMovementSkips = 0;
		}

		state.transitionDuration = (distance / state.currentSpeed) + 1.0;
		state.transitionDuration = Math.max(0.8, Math.min(state.transitionDuration, 4.0));

		state.targetTime = newTarget;
		state.blendFactor = 0;
		state.transitionElapsed = 0;
		state.isTransitioning = true;
	}

	// Smooth blending between poses.
	if (state.isTransitioning) {
		const progress = Math.min(state.transitionElapsed / state.transitionDuration, 1);

		const totalDistance = Math.abs(state.targetTime - state.previousTime);
		const rangeSize = state.preferredRange.max - state.preferredRange.min;
		const normalizedDistance = totalDistance / rangeSize;

		// Distance-adaptive easing for natural flow.
		let easedProgress: number;
		if (normalizedDistance < 0.1) {
			easedProgress = progress * progress * (3 - 2 * progress);
		} else if (normalizedDistance < 0.3) {
			const gentleProgress = progress * progress * (3 - 2 * progress);
			const sineProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
			const blendFactor = (normalizedDistance - 0.1) / 0.2;
			easedProgress = gentleProgress * (1 - blendFactor) + sineProgress * blendFactor;
		} else {
			easedProgress = (Math.sin((progress - 0.5) * Math.PI) + 1) / 2;
		}

		// Subtle organic variation on top of the easing.
		const organicVariation = Math.sin(state.transitionElapsed * 3) * 0.01;
		const finalProgress = Math.max(0, Math.min(1, easedProgress + organicVariation));

		state.blendFactor = finalProgress;
		state.currentTime = state.previousTime + (state.targetTime - state.previousTime) * state.blendFactor;

		const completionThreshold = Math.max(0.92, 1 - normalizedDistance * 0.05);
		if (progress >= completionThreshold) {
			state.currentTime = state.targetTime;
			state.blendFactor = 1;
			state.isTransitioning = false;
			// Brief pause at the target for natural rhythm.
			const pauseDuration = Math.max(0.1, normalizedDistance * 0.8);
			state.transitionElapsed = -(0.2 + Math.random() * pauseDuration);
		}

		const { min, max } = state.preferredRange;
		state.currentTime = Math.max(min, Math.min(max, state.currentTime));
	}

	if (state.poseAction) {
		state.poseAction.time = state.currentTime;
	}
}

/**
 * Keep the breathing layer's weight following the pose layer at the
 * breathing/pose ratio. Call once per frame right before mixer.update() —
 * the pose layer's weight stays owned by the existing animation state
 * machine (transitions, swim/fly/riding scaling), and the breathing layer
 * tracks it, so idle fades in/out as one unit. three's AnimationMixer
 * normalizes by cumulative weight, so pose:breathing lands at the intended
 * 0.85:0.15 proportion whenever idle is active.
 */
export function followBreathingWeight(state: NaturalIdleState): void {
	if (!state.enabled || !state.poseAction || !state.breathingAction) return;
	const poseWeight = state.poseAction.getEffectiveWeight();
	state.breathingAction.setEffectiveWeight(
		poseWeight * (state.breathingWeight / state.poseWeight),
	);
}
