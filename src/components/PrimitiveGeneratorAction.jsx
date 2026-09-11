import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Root } from '@react-three/uikit';
import { WandSparkles } from '@react-three/uikit-lucide';
import { registerRadialAction, unregisterRadialAction } from './RadialMenuActionRegistry.jsx';
import PrimitiveGenerator from './PrimitiveGenerator.jsx';
import { CanvasTextMesh } from './core/front/CanvasTextMesh';
import usePrimitiveGeneratorStore from '../stores/primitiveGeneratorStore';

const GenerationPlaceholder = ({ position, isGenerating, progress = 0 }) => {
  const meshRef = React.useRef();
  
  useFrame((state) => {
    if (meshRef.current && isGenerating) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  if (!isGenerating) return null;

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial 
          color="#8b5cf6" 
          transparent 
          opacity={0.6}
          emissive="#4c1d95"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <ringGeometry args={[0.4, 0.5, 32, 1, 0, (progress / 100) * Math.PI * 2]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
      </mesh>
      
      {[...Array(6)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((i / 6) * Math.PI * 2) * 0.8,
            0.3 + Math.sin(Date.now() * 0.003 + i) * 0.2,
            Math.sin((i / 6) * Math.PI * 2) * 0.8
          ]}
        >
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={0.8 + Math.sin(Date.now() * 0.005 + i) * 0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

const PrimitiveGeneratorAction = () => {
  const { camera } = useThree();
  
  const isGeneratorVisible = usePrimitiveGeneratorStore((s) => s.isGeneratorVisible);
  const fixedMenuPosition = usePrimitiveGeneratorStore((s) => s.fixedMenuPosition);
  const isGenerating = usePrimitiveGeneratorStore((s) => s.isGenerating);
  const generationProgress = usePrimitiveGeneratorStore((s) => s.generationProgress);
  const generationStatus = usePrimitiveGeneratorStore((s) => s.generationStatus);
  const generationPosition = usePrimitiveGeneratorStore((s) => s.generationPosition);
  
  const openGenerator = usePrimitiveGeneratorStore((s) => s.openGenerator);
  const closeGenerator = usePrimitiveGeneratorStore((s) => s.closeGenerator);
  const startGeneration = usePrimitiveGeneratorStore((s) => s.startGeneration);
  const updateProgress = usePrimitiveGeneratorStore((s) => s.updateProgress);
  const completeGeneration = usePrimitiveGeneratorStore((s) => s.completeGeneration);
  const failGeneration = usePrimitiveGeneratorStore((s) => s.failGeneration);
  
  const menuRotationRef = useRef(0);
  const groupRef = useRef();

  useEffect(() => {
    const action = {
      id: 'primitive-generator',
      label: 'Generate',
      icon: WandSparkles,
      description: 'AI-powered 3D model generation',
      color: '#8b5cf6',
      category: 'ai',
      priority: 10,
      enabled: true,
      onExecute: (position, context) => {
        const fixedPosition = [
          position[0],
          position[1] + 1.2,
          position[2]
        ];
        
        const menuRotationY = Math.atan2(
          camera.position.x - fixedPosition[0],
          camera.position.z - fixedPosition[2]
        );
        menuRotationRef.current = menuRotationY;
        
        openGenerator(position, fixedPosition);
        
        window.primitiveGeneratorTarget = {
          position: position,
          normal: context?.normal || { x: 0, y: 1, z: 0 },
          timestamp: Date.now()
        };
        
        return 'closeMenu';
      }
    };

    registerRadialAction(action);

    return () => {
      unregisterRadialAction('primitive-generator');
    };
  }, [camera, openGenerator]);

  useEffect(() => {
    const handleGenerationStart = () => {
      const targetPosition = window.primitiveGeneratorTarget?.position;
      if (targetPosition) {
        startGeneration([targetPosition.x, targetPosition.y, targetPosition.z]);
      }
    };

    const handleGenerationProgress = (event) => {
      if (event.detail) {
        const targetPosition = window.primitiveGeneratorTarget?.position;
        const pos = targetPosition ? [targetPosition.x, targetPosition.y, targetPosition.z] : null;
        updateProgress(event.detail.progress || 0, event.detail.status || 'Generating...', pos);
      }
    };

    const handleGenerationComplete = () => {
      completeGeneration();
    };

    const handleGenerationError = () => {
      failGeneration();
    };

    window.addEventListener('primitiveGenerationStart', handleGenerationStart);
    window.addEventListener('primitiveGenerationProgress', handleGenerationProgress);
    window.addEventListener('primitiveGenerationComplete', handleGenerationComplete);
    window.addEventListener('primitiveGenerationError', handleGenerationError);

    return () => {
      window.removeEventListener('primitiveGenerationStart', handleGenerationStart);
      window.removeEventListener('primitiveGenerationProgress', handleGenerationProgress);
      window.removeEventListener('primitiveGenerationComplete', handleGenerationComplete);
      window.removeEventListener('primitiveGenerationError', handleGenerationError);
    };
  }, [startGeneration, updateProgress, completeGeneration, failGeneration]);

  useFrame(() => {
    if (isGeneratorVisible && fixedMenuPosition && camera && groupRef.current) {
      const rotation = Math.atan2(
        camera.position.x - fixedMenuPosition[0],
        camera.position.z - fixedMenuPosition[2]
      );
      menuRotationRef.current = rotation;
      groupRef.current.rotation.y = rotation;
    }
  });

  return (
    <>
      {isGeneratorVisible && fixedMenuPosition && (
        <group 
          ref={groupRef}
          position={fixedMenuPosition} 
          rotation={[0, menuRotationRef.current, 0]}
          scale={0.5}
        >
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[3, 3.5]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, 0, -0.005]}>
            <planeGeometry args={[3.1, 3.6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
          </mesh>
          
          <CanvasTextMesh
            text="PrimitiveAnything"
            worldWidth={2.8}
            worldFontSize={0.28}
            fontWeight="700"
            color="#ffffff"
            align="center"
            position={[0, 1.5, 0.02]}
          />

          <CanvasTextMesh
            text="AI-powered 3D generation"
            worldWidth={2.08}
            worldFontSize={0.112}
            color="#cccccc"
            align="center"
            position={[0, 1.25, 0.02]}
          />

          {isGenerating && (
            <CanvasTextMesh
              text={generationStatus || 'Generating...'}
              worldWidth={2.08}
              worldFontSize={0.128}
              color="#10b981"
              align="center"
              position={[0, -1.4, 0.02]}
            />
          )}

          {isGenerating && (
            <CanvasTextMesh
              text={`${Math.round(generationProgress)}%`}
              worldWidth={0.8}
              worldFontSize={0.16}
              fontWeight="700"
              color="#10b981"
              align="center"
              position={[0, -1.6, 0.02]}
            />
          )}
          
          <Root 
            sizeX={3} 
            sizeY={3.5} 
            pixelSize={0.01} 
            anchorX="center" 
            anchorY="center"
          >
            <PrimitiveGenerator
              visible={isGeneratorVisible}
              onClose={closeGenerator}
              urlOverride={null}
            />
          </Root>
        </group>
      )}

      {generationPosition && (
        <GenerationPlaceholder
          position={generationPosition}
          isGenerating={isGenerating}
          progress={generationProgress}
        />
      )}
    </>
  );
};

export default PrimitiveGeneratorAction;
