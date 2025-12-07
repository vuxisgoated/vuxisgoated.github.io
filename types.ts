
import { ThreeElements } from '@react-three/fiber';

export enum ParticleShape {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  SATURN = 'Saturn',
  GALAXY = 'Galaxy',
  CUBE = 'Cube',
  BURST = 'Burst',
}

export interface AppState {
  shape: ParticleShape;
  color: string;
  isAudioEnabled: boolean;
  isCameraEnabled: boolean;
  showHelp: boolean;
}

export interface HandData {
  isOpen: boolean;
  tension: number; // 0 (fist) to 1 (open palm)
  x: number; // 0 to 1 (screen position x)
  y: number; // 0 to 1 (screen position y)
  z: number; // Approx distance/scale factor (0 to 1+)
  isPresent: boolean;
}

export interface AudioData {
  volume: number; // 0 to 1
  beat: boolean;
}

// Fix for R3F elements not being recognized in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
