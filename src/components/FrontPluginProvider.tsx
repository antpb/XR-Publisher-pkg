import React, { useContext, useState, useEffect, useCallback } from "react";
import { useThree } from '@react-three/fiber';

declare global {
  interface Window {
    registerFrontPlugin: any;
  }
}

export const FrontPluginContext = React.createContext({
  plugins: [],
  //@ts-ignore
  registerFrontPlugin: (plugin: any) => {},
  scene: null,
  camera: null
});

import { ReactNode } from "react";

interface FrontPluginProviderProps {
  children: ReactNode;
}

export function FrontPluginProvider({ children }: FrontPluginProviderProps) {

  const [plugins, setPlugins] = useState([]);
  const { scene, camera } = useThree();
  
  const registerFrontPlugin = useCallback((plugin: any) => {
    setPlugins(prevPlugins => [...prevPlugins, plugin]);
  }, []);
  
  useEffect(() => {
    // Expose the registerPlugin method globally
    window.registerFrontPlugin = registerFrontPlugin;
    window.dispatchEvent(new Event('registerFrontPluginReady'));
    
    return () => {
      // Cleanup
      window.registerFrontPlugin = null;
    };
  }, [registerFrontPlugin]);

  return (
    <FrontPluginContext.Provider value={{ plugins, registerFrontPlugin, scene, camera }}>
        {children}
    </FrontPluginContext.Provider>
  );
}

export const useFrontPlugins = () => useContext(FrontPluginContext);
