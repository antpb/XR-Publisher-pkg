import { create } from 'zustand';

const usePrimitiveGeneratorStore = create((set, get) => ({
    isGeneratorVisible: false,
    focusPosition: null,
    fixedMenuPosition: null,
    isGenerating: false,
    generationProgress: 0,
    generationStatus: '',
    generationPosition: null,

    openGenerator: (position, fixedPosition) => {
        set({
            isGeneratorVisible: true,
            focusPosition: position,
            fixedMenuPosition: fixedPosition
        });
    },

    closeGenerator: () => {
        set({
            isGeneratorVisible: false,
            focusPosition: null,
            fixedMenuPosition: null
        });
        if (window.primitiveGeneratorTarget) {
            delete window.primitiveGeneratorTarget;
        }
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    },

    startGeneration: (position) => {
        set({
            isGenerating: true,
            generationProgress: 0,
            generationStatus: 'Starting generation...',
            generationPosition: position
        });
    },

    updateProgress: (progress, status, position) => {
        const state = get();
        if (state.generationProgress !== progress || state.generationStatus !== status) {
            set({
                generationProgress: progress,
                generationStatus: status,
                ...(position ? { generationPosition: position } : {})
            });
        }
    },

    completeGeneration: () => {
        set({
            isGenerating: false,
            generationProgress: 100,
            generationStatus: 'Generation complete!'
        });
        setTimeout(() => {
            set({
                generationPosition: null,
                generationProgress: 0,
                generationStatus: ''
            });
            if (window.primitiveGeneratorTarget) {
                delete window.primitiveGeneratorTarget;
            }
        }, 2000);
    },

    failGeneration: () => {
        set({
            isGenerating: false,
            generationProgress: 0,
            generationStatus: 'Generation failed'
        });
        setTimeout(() => {
            set({
                generationPosition: null,
                generationStatus: ''
            });
            if (window.primitiveGeneratorTarget) {
                delete window.primitiveGeneratorTarget;
            }
        }, 3000);
    }
}));

export default usePrimitiveGeneratorStore;

