import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Text, Input, setPreferredColorScheme } from '@react-three/uikit';
import { WandSparkles, X, Loader } from '@react-three/uikit-lucide';
import * as THREE from 'three';

setPreferredColorScheme('dark');

const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const DEFAULT_CONFIG = {
  id: "primitive",
  name: "PrimitiveAnything",
  description: "3D primitive assembly generation from images using auto-regressive transformer",
  server: {
    defaultPort: 11440,
    healthCheck: "/health",
    endpoints: {
      health: "/health",
      generate: "/generate",
      websocket: "ws://localhost:11441"
    }
  },
  defaultSettings: {
    port: 11440,
    host: "localhost",
    enableCors: true,
    logLevel: "info",
    numPrimitives: 50,
    temperature: 1.0,
    highResolution: false
  }
};

const usePluginConfig = (urlOverride = null) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  useEffect(() => {
    const username = localStorage.getItem('xr_publisher_username');
    const storageKey = username ? `model-local-settings` : 'model-local-settings';
    const savedSettings = localStorage.getItem(storageKey);
    
    let updatedConfig = { ...DEFAULT_CONFIG };
    
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        const primitiveSettings = parsedSettings['3d-generation-primitive'];
        if (primitiveSettings) {
          updatedConfig.defaultSettings = {
            ...updatedConfig.defaultSettings,
            ...primitiveSettings
          };
        }
      } catch (e) {}
    }
    
    if (urlOverride) {
      try {
        const url = new URL(urlOverride);
        updatedConfig.defaultSettings.host = url.hostname;
        updatedConfig.defaultSettings.port = parseInt(url.port) || 11440;
      } catch (e) {}
    }
    
    setConfig(updatedConfig);
  }, [urlOverride]);
  
  return config;
};

const useWebSocket = (config, visible) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const socketRef = useRef(null);
  const isInputFocusedRef = useRef(false);
  const chunkedMeshDataRef = useRef(null);

  const updateKeyboardControls = useCallback((focused) => {
    isInputFocusedRef.current = focused;
    window.primitiveGeneratorInputActive = focused;
  }, []);

  useEffect(() => {
    if (!visible) {
      updateKeyboardControls(false);
      return;
    }
    
    const handleGlobalFocus = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        updateKeyboardControls(true);
      }
    };

    const handleGlobalBlur = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        setTimeout(() => updateKeyboardControls(false), 100);
      }
    };

    document.addEventListener('focusin', handleGlobalFocus, true);
    document.addEventListener('focusout', handleGlobalBlur, true);

    return () => {
      document.removeEventListener('focusin', handleGlobalFocus, true);
      document.removeEventListener('focusout', handleGlobalBlur, true);
      updateKeyboardControls(false);
    };
  }, [visible, updateKeyboardControls]);
  
  const connect = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    
    try {
      const wsUrl = `ws://${config.defaultSettings.host}:${config.defaultSettings.port + 1}`;
      
      if (window.electronAPI?.createWebSocket) {
        await window.electronAPI.createWebSocket(wsUrl);
        
        window.electronAPI.onWebSocketMessage((event, data) => {
          if (data.type === 'open') {
            setIsConnected(true);
            setConnectionStatus('connected');
          } else if (data.type === 'message') {
            try {
              const message = JSON.parse(data.data);
              handleMessage(message);
            } catch (e) {}
          } else if (data.type === 'close') {
            setIsConnected(false);
            setConnectionStatus('disconnected');
          } else if (data.type === 'error') {
            setIsConnected(false);
            setConnectionStatus('error');
          }
        });
      } else {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;
        
        ws.onopen = () => {
          setIsConnected(true);
          setConnectionStatus('connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMessage(message);
          } catch (e) {}
        };
        
        ws.onclose = () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        };
        
        ws.onerror = () => {
          setIsConnected(false);
          setConnectionStatus('error');
        };
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  }, [config]);
  
  const handleMessage = useCallback((message) => {
    switch (message.type) {
      case 'connected':
        break;
        
      case 'generation_started':
        setIsGenerating(true);
        break;
        
      case 'generation_progress':
        setGenerationProgress(message.progress || 0);
        
        window.dispatchEvent(new CustomEvent('primitiveGenerationProgress', {
          detail: { 
            progress: message.progress || 0, 
            status: message.message || 'Generating...' 
          }
        }));
        break;
        
      case 'mesh_chunk':
        if (!chunkedMeshDataRef.current) {
          chunkedMeshDataRef.current = {};
        }
        if (message.chunk_type === 'vertices') {
          chunkedMeshDataRef.current.vertices = message.data;
        } else if (message.chunk_type === 'faces') {
          chunkedMeshDataRef.current.faces = message.data;
        }
        break;
        
      case 'mesh_complete':
        const chunkData = chunkedMeshDataRef.current;
        if (chunkData && chunkData.vertices && chunkData.faces) {
          placeMeshAtCursor({
            vertices: chunkData.vertices,
            faces: chunkData.faces,
            generationType: message.generation_type || 'model'
          });
          
          window.dispatchEvent(new CustomEvent('primitiveGenerationComplete', {
            detail: { 
              meshData: {
                vertices: chunkData.vertices,
                faces: chunkData.faces,
                generationType: message.generation_type || 'model'
              },
              generationType: message.generation_type || 'model',
              timestamp: Date.now()
            }
          }));
          
          chunkedMeshDataRef.current = null;
        }
        setGenerationProgress(100);
        setIsGenerating(false);
        break;
        
      case 'generation_completed':
        setGenerationProgress(100);
        
        if (message.generation_type === 'model' && message.mesh_data && message.mesh_data.vertices && message.mesh_data.vertices.length > 0) {
          placeMeshAtCursor(message.mesh_data);
          
          if (message.mesh_data.vertices) message.mesh_data.vertices = null;
          if (message.mesh_data.faces) message.mesh_data.faces = null;
          if (message.mesh_data.normals) message.mesh_data.normals = null;
        }
        
        if (!message.chunked || (message.mesh_data && message.mesh_data.vertices && message.mesh_data.vertices.length > 0)) {
          window.dispatchEvent(new CustomEvent('primitiveGenerationComplete', {
            detail: { 
              meshData: message.mesh_data,
              generationType: message.generation_type,
              timestamp: Date.now()
            }
          }));
          
          setIsGenerating(false);
        }
        break;
        
      case 'generation_error':
        setGenerationProgress(0);
        setIsGenerating(false);
        
        window.dispatchEvent(new CustomEvent('primitiveGenerationError', {
          detail: { 
            error: message.message,
            timestamp: Date.now()
          }
        }));
        break;
        
      default:
        break;
    }
  }, []);
  
  const sendMessage = useCallback(async (message) => {
    if (window.electronAPI?.sendWebSocketMessage) {
      await window.electronAPI.sendWebSocketMessage(JSON.stringify(message));
    } else if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    connectionStatus,
    generationProgress,
    sendMessage,
    connect,
    isGenerating,
    setIsGenerating,
    setInputFocused: updateKeyboardControls
  };
};

const placeMeshAtCursor = async (meshData) => {
  if (!meshData) return;
  
  try {
    const target = window.primitiveGeneratorTarget;
    if (!target) {
      return;
    }
    
    const { position, normal } = target;
    
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(meshData.vertices.flat());
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    if (meshData.faces) {
      const indices = [];
      meshData.faces.forEach(face => {
        if (face.length === 3) {
          indices.push(...face);
        } else if (face.length === 4) {
          indices.push(face[0], face[1], face[2]);
          indices.push(face[0], face[2], face[3]);
        }
      });
      geometry.setIndex(indices);
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: '#8b5cf6',
      metalness: 0.3,
      roughness: 0.4
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    if (normal && (normal.x !== 0 || normal.y !== 0 || normal.z !== 0)) {
      const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
      const upVector = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(upVector, normalVector);
      mesh.quaternion.copy(quaternion);
    }
    
    mesh.position.y += 0.1;
    
    const timestamp = Date.now();
    const modelName = `PrimitiveGenerated_${timestamp}`;
    mesh.name = modelName;
    mesh.userData = {
      source: 'primitive-generator',
      timestamp: timestamp,
      generationType: meshData.generationType || 'model'
    };
    
    const targetScene = window.currentScene || window.worldScene || window.scene;
    if (targetScene) {
      targetScene.add(mesh);
    }
    
    window.dispatchEvent(new CustomEvent('primitiveGenerated', {
      detail: { mesh, meshData, position, target, modelName }
    }));
    
    delete window.primitiveGeneratorTarget;
    
  } catch (error) {
    window.dispatchEvent(new CustomEvent('primitiveGenerationError', {
      detail: { error: error.message, meshData, position: window.primitiveGeneratorTarget?.position }
    }));
  }
};

const PrimitiveGenerator = ({ visible = true, onClose, urlOverride = null }) => {
  const config = usePluginConfig(urlOverride);
  const webSocket = useWebSocket(config, visible);
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  
  const { setInputFocused, isGenerating, setIsGenerating } = webSocket;
  
  useEffect(() => {
    if (visible) {
      const canvas = document.querySelector('canvas');
      if (canvas && !document.pointerLockElement && typeof canvas.requestPointerLock === 'function') {
        try { canvas.requestPointerLock(); } catch (_e) {}
      }
    }
  }, [visible]);

  const handleGenerate = useCallback(async () => {
    if (!(prompt.trim()) || isGenerating) return;
    
    setIsGenerating(true);
    
    window.dispatchEvent(new CustomEvent('primitiveGenerationStart', {
      detail: { prompt, generationType: 'model', timestamp: Date.now() }
    }));
    
    try {
      if (!webSocket.isConnected) {
        await webSocket.connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!webSocket.isConnected) {
          throw new Error('Could not establish WebSocket connection');
        }
      }
      
      const message = {
        type: 'start_generation',
        prompt: prompt.trim(),
        num_primitives: config.defaultSettings.numPrimitives,
        temperature: config.defaultSettings.temperature,
        generation_type: 'model',
        high_resolution: config.defaultSettings.highResolution,
        image_data: null,
        timestamp: Date.now()
      };
      
      await webSocket.sendMessage(message);
      
    } catch (error) {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, webSocket, config]);
  
  useEffect(() => {
    if (webSocket.generationProgress >= 100) {
      setIsGenerating(false);
    }
  }, [webSocket.generationProgress]);
  
  if (!visible) return null;
  
  return (
    <Container
      width={280}
      height={280}
      flexDirection="column"
      gap={12}
      padding={16}
      paddingTop={70}
      data-primitive-generator="true"
    >
      {/* Header with connection status and close button */}
      <Container flexDirection="row" justifyContent="flex-end" alignItems="center" gap={8}>
        <Container 
          width={12} 
          height={12} 
          borderRadius={6} 
          backgroundColor={webSocket.connectionStatus === 'connected' ? '#10b981' : '#ef4444'} 
        />
        <Container 
          padding={4}
          borderRadius={4}
          cursor="pointer"
          hover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          onClick={onClose}
        >
          <X width={16} height={16} />
        </Container>
      </Container>
      
      {/* Prompt input */}
      <Container 
        padding={8}
        backgroundColor="rgba(255,255,255,0.05)"
        borderRadius={8}
        borderWidth={1}
        borderColor="rgba(255,255,255,0.1)"
      >
        <Input
          ref={textareaRef}
          value={prompt}
          onValueChange={setPrompt}
          placeholder="Describe what to generate..."
          onPointerDown={() => {
            if (textareaRef.current?.focus) {
              textareaRef.current.focus();
            }
            setInputFocused(true);
          }}
          onFocusChange={(focused) => {
            if (focused) {
              setInputFocused(true);
            } else {
              setTimeout(() => setInputFocused(false), 200);
            }
          }}
          disabled={isGenerating}
          tabIndex={1}
        />
      </Container>
      
      {/* Generate button */}
      <Container
        onClick={handleGenerate}
        opacity={!prompt.trim() || isGenerating || !webSocket.isConnected ? 0.5 : 1}
        cursor={!prompt.trim() || isGenerating || !webSocket.isConnected ? "default" : "pointer"}
        width="100%"
        height={44}
        backgroundColor="#8b5cf6"
        borderRadius={8}
        justifyContent="center"
        alignItems="center"
        hover={{ backgroundColor: '#7c3aed' }}
      >
        <Container flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
          {isGenerating ? (
            <Loader width={18} height={18} />
          ) : (
            <WandSparkles width={18} height={18} />
          )}
        </Container>
      </Container>
      
      {/* Progress bar (visual only, no text) */}
      {isGenerating && (
        <Container 
          width="100%" 
          height={6} 
          borderRadius={3}
          backgroundColor="rgba(255,255,255,0.1)"
          overflow="hidden"
        >
          <Container
            width={`${webSocket.generationProgress}%`}
            height="100%"
            backgroundColor="#10b981"
            borderRadius={3}
          />
        </Container>
      )}
    </Container>
  );
};

export default PrimitiveGenerator;
