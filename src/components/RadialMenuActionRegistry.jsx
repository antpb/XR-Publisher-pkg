import { WandSparkles, Settings, Hammer, Palette } from '@react-three/uikit-lucide';

/**
 * Radial Menu Action Registry
 * 
 * This system allows for easy registration of actions for the radial menu.
 * Future hook implementation will look like:
 * 
 * const { registerAction, unregisterAction, getActions } = useRadialMenuActions();
 * 
 * useEffect(() => {
 *   registerAction({
 *     id: 'my-custom-action',
 *     label: 'Custom',
 *     icon: MyIcon,
 *     description: 'My custom action',
 *     color: '#ff0000',
 *     enabled: true,
 *     category: 'custom',
 *     priority: 1,
 *     onExecute: (position) => { ... }
 *   });
 *   
 *   return () => unregisterAction('my-custom-action');
 * }, []);
 */

// Global action registry (will be moved to context/hook in future)
let globalActionRegistry = new Map();

// Event system for action registry changes
const actionRegistryEvents = new EventTarget();

/**
 * Register a new action in the radial menu
 */
export const registerRadialAction = (action) => {
    if (!action.id) {
        console.error('Action must have an id');
        return;
    }

    const actionWithDefaults = {
        enabled: true,
        category: 'plugin',
        priority: 0,
        ...action
    };

    globalActionRegistry.set(action.id, actionWithDefaults);
    
    // Dispatch event for components to react to changes
    actionRegistryEvents.dispatchEvent(new CustomEvent('actionsChanged', {
        detail: { type: 'added', action: actionWithDefaults }
    }));
};

/**
 * Unregister an action from the radial menu
 */
export const unregisterRadialAction = (actionId) => {
    const action = globalActionRegistry.get(actionId);
    if (action) {
        globalActionRegistry.delete(actionId);
        
        actionRegistryEvents.dispatchEvent(new CustomEvent('actionsChanged', {
            detail: { type: 'removed', actionId }
        }));
    }
};

/**
 * Get all registered actions
 */
export const getRegisteredActions = () => {
    return Array.from(globalActionRegistry.values())
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Higher priority first
};

/**
 * Listen for action registry changes
 */
export const onActionRegistryChange = (callback) => {
    actionRegistryEvents.addEventListener('actionsChanged', callback);
    return () => actionRegistryEvents.removeEventListener('actionsChanged', callback);
};

/**
 * Pre-defined actions that can be easily registered
 */
export const PREDEFINED_ACTIONS = {
    GENERATE: {
        id: 'generate',
        label: 'Generate',
        icon: WandSparkles,
        description: 'AI model generation',
        color: '#8b5cf6',
        category: 'ai',
        priority: 2
    },
    
    SETTINGS: {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        description: 'Environment settings',
        color: '#10b981',
        category: 'system',
        priority: -1
    },
    
    BUILD: {
        id: 'build',
        label: 'Build',
        icon: Hammer,
        description: 'Construction tools',
        color: '#f59e0b',
        category: 'tools',
        priority: 1
    },
    
    PAINT: {
        id: 'paint',
        label: 'Paint',
        icon: Palette,
        description: 'Material and texture tools',
        color: '#ef4444',
        category: 'tools',
        priority: 1
    }
};

/**
 * Helper function to register a predefined action
 */
export const registerPredefinedAction = (actionKey, onExecute) => {
    const action = PREDEFINED_ACTIONS[actionKey];
    if (!action) {
        console.error('Unknown predefined action:', actionKey);
        return;
    }

    registerRadialAction({
        ...action,
        onExecute
    });
};

/**
 * Example usage:
 * 
 * // Register the AI generation action
 * registerPredefinedAction('GENERATE', (position) => {
 *   console.log('Generate action triggered at:', position);
 *   // Open AI generation UI
 * });
 * 
 * // Register a custom action
 * registerRadialAction({
 *   id: 'my-plugin',
 *   label: 'My Plugin',
 *   icon: MyIcon,
 *   description: 'Does something awesome',
 *   color: '#ff6b35',
 *   enabled: true,
 *   category: 'plugin',
 *   priority: 3,
 *   onExecute: (position) => {
 *     console.log('Custom action at:', position);
 *   }
 * });
 */
