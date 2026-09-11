import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Container } from '@react-three/uikit';
import { Folder, WandSparkles, Settings, X } from '@react-three/uikit-lucide';

const coreActions = [
    {
        id: 'assets',
        label: 'Assets',
        icon: Folder,
        description: 'Browse and place 3D assets',
        color: '#4285f4',
        enabled: true,
        category: 'core'
    }
];

const closeAction = {
    id: 'close',
    label: 'Close',
    icon: X,
    description: 'Close menu',
    color: '#ef4444',
    enabled: true,
    category: 'system'
};

const createPlaceholder = (index) => ({
    id: `placeholder_${index}`,
    label: 'Coming Soon',
    icon: Settings,
    description: 'Feature coming soon',
    color: '#6b7280',
    enabled: false,
    category: 'placeholder'
});

const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

export default function RadialMenu({
    visible = false,
    position = [0, 0, 0],
    onClose = () => {},
    onAction = () => {},
    characterControllerRef,
    cameraRef,
    registeredActions = [],
    contextualActions = [],
    contextType = null,
    onHoverChange = () => {},
    onActionsReady = () => {}
}) {
    const menuRef = useRef();
    const hoveredActionRef = useRef(null);

    const actions = useMemo(() => {
        const totalSlots = 4;
        const availableSlots = totalSlots - 1;
        
        let combinedActions;
        
        if (contextualActions.length > 0) {
            combinedActions = [...contextualActions];
        } else {
            combinedActions = [...coreActions, ...registeredActions];
        }
        
        while (combinedActions.length < availableSlots) {
            combinedActions.push(createPlaceholder(combinedActions.length));
        }
        
        const finalActions = combinedActions.slice(0, availableSlots);
        finalActions.push(closeAction);
        
        return finalActions.map((action, index) => ({
            ...action,
            angle: angles[index]
        }));
    }, [contextualActions, registeredActions]);

    useEffect(() => {
        onActionsReady(actions);
    }, [actions, onActionsReady]);

    const handleHover = useCallback((actionId) => {
        if (hoveredActionRef.current !== actionId) {
            hoveredActionRef.current = actionId;
            onHoverChange(actionId);
        }
    }, [onHoverChange]);

    const handleActionSelect = useCallback((action) => {
        if (!action.enabled) {
            return;
        }
        
        if (action.id === 'close') {
            onClose();
        } else {
            onAction(action.id, position);
        }
    }, [onClose, onAction, position]);

    if (!visible) return null;

    return (
        <Container
            ref={menuRef}
            width={400}
            height={400}
            positionType="relative"
            justifyContent="center"
            alignItems="center"
        >
            {/* Center area - text is rendered outside uikit in InteractionMenuSystem */}
            <Container
                positionType="absolute"
                width={120}
                height={120}
                justifyContent="center"
                alignItems="center"
            />

            {actions.map((action, index) => {
                const radius = 130;
                const x = Math.cos(action.angle) * radius;
                const y = Math.sin(action.angle) * radius;
                const IconComponent = action.icon;

                return (
                    <Container
                        key={action.id}
                        positionType="absolute"
                        transformTranslateX={x}
                        transformTranslateY={-y}
                        width={60}
                        height={60}
                        backgroundColor="#ffffff"
                        backgroundOpacity={0.95}
                        borderRadius={12}
                        justifyContent="center"
                        alignItems="center"
                        cursor={action.enabled ? "pointer" : "default"}
                        opacity={action.enabled ? 1 : 0.4}
                        hover={{ backgroundColor: "#ffffff", backgroundOpacity: 1 }}
                        onPointerEnter={() => action.enabled && handleHover(action.id)}
                        onPointerLeave={() => action.enabled && handleHover(null)}
                        onClick={() => handleActionSelect(action)}
                    >
                        <IconComponent width={26} height={26} />
                    </Container>
                );
            })}
        </Container>
    );
}
