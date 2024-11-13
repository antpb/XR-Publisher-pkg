declare module 'three-omi' {
  import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader';
  import { AudioListener } from 'three';

  export class GLTFAudioEmitterExtension {
    constructor(parser: GLTFParser, listener: AudioListener);
  }
}
