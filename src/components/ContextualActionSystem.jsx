import { Box, DoorOpen, DoorClosed, Lock, LockOpen, Settings, Eye, Play, Pause, RotateCcw, Volume2, VolumeX, Grab, Move } from '@react-three/uikit-lucide';

/**
 * Contextual Action System
 * 
 * This system detects what object/area the cursor is focused on and provides
 * context-specific actions in the radial menu.
 * 
 * Architecture:
 * 1. Object Detection: Identify what the cursor is pointing at
 * 2. Context Resolution: Determine what type of object it is
 * 3. Action Provider: Return appropriate actions for that context
 * 4. State Management: Handle object state (open/closed, locked/unlocked, etc.)
 */

// Global context registry for object types and their actions
const contextRegistry = new Map();

// Event system for context changes
const contextEvents = new EventTarget();

/**
 * Register a context type with its available actions
 */
export const registerContextType = (contextType, contextConfig) => {
    contextRegistry.set(contextType, contextConfig);
};

/**
 * Context Detection - examines the focused object and returns context information
 */
export const detectObjectContext = (intersectedObject, hitPoint) => {
    if (!intersectedObject) {
        return { type: 'world', object: null, actions: [] };
    }

    // Check object userData for context information
    const userData = intersectedObject.userData || {};
    
    // Method 1: Direct context type in userData
    if (userData.contextType) {
        return {
            type: userData.contextType,
            object: intersectedObject,
            state: userData.state || {},
            position: hitPoint,
            actions: getContextActions(userData.contextType, userData.state)
        };
    }

    // Method 2: Infer from object name/type
    const objectName = intersectedObject.name?.toLowerCase() || '';
    
    if (objectName.includes('chest') || objectName.includes('box')) {
        return {
            type: 'container',
            object: intersectedObject,
            state: userData.state || { open: false, locked: false },
            position: hitPoint,
            actions: getContextActions('container', userData.state)
        };
    }
    
    if (objectName.includes('door')) {
        return {
            type: 'door',
            object: intersectedObject,
            state: userData.state || { open: false, locked: false },
            position: hitPoint,
            actions: getContextActions('door', userData.state)
        };
    }

    if (objectName.includes('switch') || objectName.includes('button')) {
        return {
            type: 'switch',
            object: intersectedObject,
            state: userData.state || { active: false },
            position: hitPoint,
            actions: getContextActions('switch', userData.state)
        };
    }

    // Method 3: Detect audio objects by checking for audio-related properties
    let audioObject = null;
    const checkAudio = (obj) => {
        if (obj.userData?.audioSource || obj.userData?.hasAudio || obj.userData?.audio) return obj;
        if (obj.children) {
            for (const child of obj.children) {
                const found = checkAudio(child);
                if (found) return found;
            }
        }
        return null;
    };
    audioObject = checkAudio(intersectedObject);

    if (!audioObject) {
        let current = intersectedObject;
        while (current) {
            if (current.userData?.audioSource || current.userData?.hasAudio || current.userData?.audio) {
                audioObject = current;
                break;
            }
            current = current.parent;
        }
    }

    if (audioObject) {
        const audioState = audioObject.userData?.state || { playing: false, muted: false, volume: 1 };
        return {
            type: 'audio_object',
            object: audioObject,
            state: audioState,
            position: hitPoint,
            actions: getContextActions('audio_object', audioState)
        };
    }

    // Method 4: Detect model objects with animations or interactive capabilities
    let modelObject = null;
    const checkModel = (obj) => {
        if (obj.userData?.animationMixer || obj.userData?.animationActions || obj.userData?.modelType) return obj;
        return null;
    };
    modelObject = checkModel(intersectedObject);

    if (!modelObject) {
        let current = intersectedObject;
        while (current) {
            if (current.userData?.animationMixer || current.userData?.animationActions || current.userData?.modelType) {
                modelObject = current;
                break;
            }
            current = current.parent;
        }
    }

    if (modelObject) {
        const modelState = modelObject.userData?.state || {
            hasAnimations: !!(modelObject.userData?.animationActions && Object.keys(modelObject.userData.animationActions).length > 0),
            animating: false,
            grabbable: !!modelObject.userData?.grabbable,
            grabbed: false
        };
        return {
            type: 'model_object',
            object: modelObject,
            state: modelState,
            position: hitPoint,
            actions: getContextActions('model_object', modelState)
        };
    }

    // Method 5: Check for generic interaction capability
    if (userData.interactable) {
        return {
            type: 'generic',
            object: intersectedObject,
            state: userData.state || {},
            position: hitPoint,
            actions: getContextActions('generic', userData.state)
        };
    }

    // Default: world context (no specific object)
    return {
        type: 'world',
        object: null,
        state: {},
        position: hitPoint,
        actions: []
    };
};

/**
 * Get actions for a specific context type and state
 */
export const getContextActions = (contextType, objectState = {}) => {
    const contextConfig = contextRegistry.get(contextType);
    if (!contextConfig) {
        return [];
    }

    // Filter actions based on current state
    return contextConfig.actions.filter(action => {
        if (action.condition) {
            return action.condition(objectState);
        }
        return true;
    }).map(action => ({
        ...action,
        enabled: action.enabledCondition ? action.enabledCondition(objectState) : true
    }));
};

/**
 * Execute a context action on an object
 */
export const executeContextAction = (actionId, context) => {
    const { type, object, state, position } = context;
    const contextConfig = contextRegistry.get(type);
    
    if (!contextConfig) {
        console.warn('No context config for type:', type);
        return;
    }

    const action = contextConfig.actions.find(a => a.id === actionId);
    if (!action) {
        console.warn('Action not found:', actionId, 'for context:', type);
        return;
    }

    if (action.execute) {
        try {
            // Execute the action with full context
            const result = action.execute(object, state, position);
            
            // Update object state if action returns new state
            if (result && typeof result === 'object') {
                if (object && object.userData) {
                    object.userData.state = { ...state, ...result };
                }
                
                // Dispatch state change event
                contextEvents.dispatchEvent(new CustomEvent('contextStateChanged', {
                    detail: { object, oldState: state, newState: { ...state, ...result } }
                }));
            }
            
            // Context action executed
            return result;
        } catch (error) {
            console.error('Error executing context action:', error);
        }
    }
};

/**
 * Listen for context state changes
 */
export const onContextStateChange = (callback) => {
    contextEvents.addEventListener('contextStateChanged', callback);
    return () => contextEvents.removeEventListener('contextStateChanged', callback);
};

// Pre-defined context types with their actions
export const CONTEXT_TYPES = {
    CONTAINER: 'container',
    DOOR: 'door',
    SWITCH: 'switch',
    ANIMATED_MODEL: 'animated_model',
    AUDIO_OBJECT: 'audio_object',
    MODEL_OBJECT: 'model_object',
    GENERIC: 'generic',
    WORLD: 'world'
};

/**
 * Initialize default context types
 */
export const initializeDefaultContexts = () => {
    // Container context (treasure chest, box, etc.)
    registerContextType(CONTEXT_TYPES.CONTAINER, {
        name: 'Container',
        description: 'Containers like chests and boxes',
        actions: [
            {
                id: 'open',
                label: 'Open',
                icon: Box,
                description: 'Open the container',
                color: '#10b981',
                condition: (state) => !state.open,
                enabledCondition: (state) => !state.locked,
                execute: (object, state) => {
                    return { open: true };
                }
            },
            {
                id: 'close',
                label: 'Close',
                icon: Box,
                description: 'Close the container',
                color: '#ef4444',
                condition: (state) => state.open,
                execute: (object, state) => {
                    return { open: false };
                }
            },
            {
                id: 'unlock',
                label: 'Unlock',
                icon: LockOpen,
                description: 'Unlock the container',
                color: '#f59e0b',
                condition: (state) => state.locked,
                execute: (object, state) => {
                    return { locked: false };
                }
            },
            {
                id: 'inspect',
                label: 'Inspect',
                icon: Eye,
                description: 'Examine the container',
                color: '#6366f1',
                execute: (object, state, position) => {
                    alert(`Container: ${object.name}\nOpen: ${state.open}\nLocked: ${state.locked}`);
                }
            }
        ]
    });

    // Door context
    registerContextType(CONTEXT_TYPES.DOOR, {
        name: 'Door',
        description: 'Doors and gates',
        actions: [
            {
                id: 'open',
                label: 'Open',
                icon: DoorOpen,
                description: 'Open the door',
                color: '#10b981',
                condition: (state) => !state.open,
                enabledCondition: (state) => !state.locked,
                execute: (object, state) => {
                    return { open: true };
                }
            },
            {
                id: 'close',
                label: 'Close',
                icon: DoorClosed,
                description: 'Close the door',
                color: '#ef4444',
                condition: (state) => state.open,
                execute: (object, state) => {
                    return { open: false };
                }
            },
            {
                id: 'unlock',
                label: 'Unlock',
                icon: LockOpen,
                description: 'Unlock the door',
                color: '#f59e0b',
                condition: (state) => state.locked,
                execute: (object, state) => {
                    return { locked: false };
                }
            }
        ]
    });

    // Switch/Button context
    registerContextType(CONTEXT_TYPES.SWITCH, {
        name: 'Switch',
        description: 'Switches and buttons',
        actions: [
            {
                id: 'activate',
                label: 'Activate',
                icon: Settings,
                description: 'Activate the switch',
                color: '#10b981',
                condition: (state) => !state.active,
                execute: (object, state) => {
                    return { active: true };
                }
            },
            {
                id: 'deactivate',
                label: 'Deactivate',
                icon: Settings,
                description: 'Deactivate the switch',
                color: '#ef4444',
                condition: (state) => state.active,
                execute: (object, state) => {
                    return { active: false };
                }
            }
        ]
    });

    // Animated model context
    registerContextType(CONTEXT_TYPES.ANIMATED_MODEL, {
        name: 'Animated Model',
        description: 'Model with controllable animations',
        actions: [
            {
                id: 'toggle_idle',
                label: 'Toggle Idle',
                icon: Play,
                description: 'Start/stop idle animation',
                color: '#10b981',
                execute: (object, state, position) => {
                    
                    // Find the animation mixer and idle action
                    if (object.userData.animationMixer && object.userData.animationActions) {
                        const idleAction = object.userData.animationActions['idle_00'];
                        if (idleAction) {
                            if (state.idleActive) {
                                idleAction.stop();
                                return { idleActive: false };
                            } else {
                                idleAction.play();
                                return { idleActive: true };
                            }
                        }
                    }
                    
                    // Fallback: just log and toggle state
                    const newState = !state.idleActive;
                    return { idleActive: newState };
                }
            },
            {
                id: 'toggle_hover',
                label: 'Toggle Hover',
                icon: RotateCcw,
                description: 'Start/stop hover animation',
                color: '#8b5cf6',
                execute: (object, state, position) => {
                    
                    // Find the animation mixer and hover action
                    if (object.userData.animationMixer && object.userData.animationActions) {
                        const hoverAction = object.userData.animationActions['hover_00'];
                        if (hoverAction) {
                            if (state.hoverActive) {
                                hoverAction.stop();
                                return { hoverActive: false };
                            } else {
                                hoverAction.play();
                                return { hoverActive: true };
                            }
                        }
                    }
                    
                    // Fallback: just log and toggle state
                    const newState = !state.hoverActive;
                    return { hoverActive: newState };
                }
            },
            {
                id: 'inspect_animations',
                label: 'Inspect',
                icon: Eye,
                description: 'Show animation information',
                color: '#6366f1',
                execute: (object, state, position) => {
                    const availableAnimations = state.availableAnimations || ['No animations found'];
                    const activeAnimations = [];
                    if (state.idleActive) activeAnimations.push('idle_00');
                    if (state.hoverActive) activeAnimations.push('hover_00');
                    
                    alert(`Animation Info for ${object.name}:\n\nAvailable: ${availableAnimations.join(', ')}\nActive: ${activeAnimations.length > 0 ? activeAnimations.join(', ') : 'None'}\n\nIdle: ${state.idleActive ? 'ON' : 'OFF'}\nHover: ${state.hoverActive ? 'ON' : 'OFF'}`);
                }
            }
        ]
    });

    registerContextType(CONTEXT_TYPES.AUDIO_OBJECT, {
        name: 'Audio',
        description: 'Audio source object',
        actions: [
            {
                id: 'play_audio',
                label: 'Play',
                icon: Play,
                description: 'Play audio',
                color: '#10b981',
                condition: (state) => !state.playing,
                execute: (object, state) => {
                    let audioSource = object.userData?.audioSource;
                    if (!audioSource) {
                        object.traverse((child) => {
                            if (child.userData?.audioSource) {
                                audioSource = child.userData.audioSource;
                            }
                        });
                    }
                    if (audioSource && typeof audioSource.play === 'function') {
                        audioSource.play();
                    }
                    window.dispatchEvent(new CustomEvent('objectAudioPlay', {
                        detail: { object, name: object.name }
                    }));
                    return { playing: true };
                }
            },
            {
                id: 'pause_audio',
                label: 'Pause',
                icon: Pause,
                description: 'Pause audio',
                color: '#f59e0b',
                condition: (state) => state.playing,
                execute: (object, state) => {
                    let audioSource = object.userData?.audioSource;
                    if (!audioSource) {
                        object.traverse((child) => {
                            if (child.userData?.audioSource) {
                                audioSource = child.userData.audioSource;
                            }
                        });
                    }
                    if (audioSource && typeof audioSource.pause === 'function') {
                        audioSource.pause();
                    }
                    window.dispatchEvent(new CustomEvent('objectAudioPause', {
                        detail: { object, name: object.name }
                    }));
                    return { playing: false };
                }
            },
            {
                id: 'mute_audio',
                label: 'Mute',
                icon: VolumeX,
                description: 'Toggle mute',
                color: '#ef4444',
                execute: (object, state) => {
                    const newMuted = !state.muted;
                    let audioSource = object.userData?.audioSource;
                    if (!audioSource) {
                        object.traverse((child) => {
                            if (child.userData?.audioSource) {
                                audioSource = child.userData.audioSource;
                            }
                        });
                    }
                    if (audioSource) {
                        if (typeof audioSource.setVolume === 'function') {
                            audioSource.setVolume(newMuted ? 0 : (state.volume || 1));
                        } else if (audioSource.gain) {
                            audioSource.gain.gain.value = newMuted ? 0 : (state.volume || 1);
                        }
                    }
                    return { muted: newMuted };
                }
            }
        ]
    });

    registerContextType(CONTEXT_TYPES.MODEL_OBJECT, {
        name: 'Object',
        description: 'Interactive 3D model',
        actions: [
            {
                id: 'inspect_model',
                label: 'Inspect',
                icon: Eye,
                description: 'Examine this object',
                color: '#6366f1',
                execute: (object, state) => {
                    window.dispatchEvent(new CustomEvent('objectInspect', {
                        detail: { object, name: object.name, state }
                    }));
                }
            },
            {
                id: 'toggle_animation',
                label: 'Animate',
                icon: Play,
                description: 'Toggle animation',
                color: '#10b981',
                condition: (state) => state.hasAnimations,
                execute: (object, state) => {
                    if (object.userData?.animationMixer && object.userData?.animationActions) {
                        const actions = object.userData.animationActions;
                        const actionKeys = Object.keys(actions);
                        if (actionKeys.length > 0) {
                            const firstAction = actions[actionKeys[0]];
                            if (state.animating) {
                                firstAction.stop();
                            } else {
                                firstAction.play();
                            }
                        }
                    }
                    window.dispatchEvent(new CustomEvent('objectAnimationToggle', {
                        detail: { object, name: object.name, animating: !state.animating }
                    }));
                    return { animating: !state.animating };
                }
            },
            {
                id: 'grab_model',
                label: 'Grab',
                icon: Grab,
                description: 'Pick up object',
                color: '#f59e0b',
                condition: (state) => state.grabbable,
                execute: (object, state) => {
                    window.dispatchEvent(new CustomEvent('objectGrab', {
                        detail: { object, name: object.name }
                    }));
                    return { grabbed: !state.grabbed };
                }
            }
        ]
    });

    // Generic interactable context
    registerContextType(CONTEXT_TYPES.GENERIC, {
        name: 'Generic',
        description: 'Generic interactable object',
        actions: [
            {
                id: 'interact',
                label: 'Interact',
                icon: Settings,
                description: 'Interact with object',
                color: '#6366f1',
                execute: (object, state, position) => {
                    alert(`Interacted with: ${object.name}`);
                }
            }
        ]
    });

    // Default context types initialized
};

/**
 * Helper function to make any Three.js object contextually interactable
 */
export const makeObjectInteractable = (object, contextType, initialState = {}) => {
    if (!object.userData) {
        object.userData = {};
    }
    
    object.userData.contextType = contextType;
    object.userData.state = initialState;
    object.userData.interactable = true;
    
    // Object made interactable
};

/**
 * Example usage:
 * 
 * // Make a chest interactable
 * makeObjectInteractable(chestMesh, CONTEXT_TYPES.CONTAINER, { 
 *   open: false, 
 *   locked: true 
 * });
 * 
 * // In the cursor detection system
 * const context = detectObjectContext(intersectedObject, hitPoint);
 * if (context.type !== 'world') {
 *   // Show context-specific actions instead of default radial menu
 *   showContextualMenu(context);
 * }
 */
