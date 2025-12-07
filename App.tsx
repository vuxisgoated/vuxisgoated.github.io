
import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ParticleSystem from './components/ParticleSystem';
import UIOverlay from './components/UIOverlay';
import { useHandTracking } from './hooks/useHandTracking';
import { useAudioAnalysis } from './hooks/useAudioAnalysis';
import { AppState, ParticleShape } from './types';

const App: React.FC = () => {
  // Global App State
  const [state, setState] = useState<AppState>({
    shape: ParticleShape.SPHERE,
    color: '#00ffff',
    isAudioEnabled: false,
    isCameraEnabled: false,
    showHelp: false,
  });

  // Sensor Hooks
  const { handData: _handDataState, videoRef, loading: handLoading } = useHandTracking(state.isCameraEnabled);
  const audioAnalysisRef = useAudioAnalysis(state.isAudioEnabled);
  
  const handDataRef = useRef(_handDataState);
  useEffect(() => {
    handDataRef.current = _handDataState;
  }, [_handDataState]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas 
          camera={{ position: [0, 0, 15], fov: 60 }} 
          dpr={[1, 2]}
        >
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          
          <ParticleSystem 
            shape={state.shape}
            color={state.color}
            handDataRef={handDataRef}
            audioDataRef={audioAnalysisRef}
            handEnabled={state.isCameraEnabled}
          />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={!state.isCameraEnabled} // Disable mouse zoom when hand zoom is active
            enableRotate={!state.isCameraEnabled} // Disable mouse rotate when hand rotate is active
            minDistance={5} 
            maxDistance={30}
            autoRotate={!state.isCameraEnabled} 
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Video Element for Tracking Logic (Always Hidden but Active) */}
      <video 
        ref={videoRef} 
        className="opacity-0 fixed top-0 left-0 w-1 h-1 pointer-events-none"
        autoPlay 
        playsInline
        muted
      />

      {/* UI Overlay */}
      <UIOverlay 
        state={state} 
        setState={setState} 
        handLoading={handLoading}
      />
    </div>
  );
};

export default App;