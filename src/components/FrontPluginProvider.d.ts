import { ReactNode } from 'react';
import { Scene, Camera } from '@react-three/fiber';

export interface FrontPlugin {
  name: string;
}

export interface FrontPluginContextType {
  plugins: FrontPlugin[];
  registerFrontPlugin: (plugin: FrontPlugin) => void;
  scene: Scene;
  camera: Camera;
}

export const FrontPluginContext: React.Context<FrontPluginContextType>;

export interface FrontPluginProviderProps {
  children: ReactNode;
}

export function FrontPluginProvider(props: FrontPluginProviderProps): JSX.Element;

export function useFrontPlugins(): FrontPluginContextType;