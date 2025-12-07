
import React from 'react';
import { AppState, ParticleShape } from '../types';

interface UIOverlayProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  handLoading: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ state, setState, handLoading }) => {
  const shapes = Object.values(ParticleShape);

  const toggleCamera = () => setState(s => ({ ...s, isCameraEnabled: !s.isCameraEnabled }));
  const toggleAudio = () => setState(s => ({ ...s, isAudioEnabled: !s.isAudioEnabled }));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
            3D Particle
          </h1>
        </div>
      </div>

      {/* Main Controls Panel */}
      <div className="pointer-events-auto w-full max-w-sm bg-black/60 backdrop-blur-md border border-gray-800 rounded-xl p-4 shadow-2xl transition-all self-end md:self-auto">
        
        {/* Shape Selectors */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Shape</label>
          <div className="grid grid-cols-3 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape}
                onClick={() => setState(s => ({ ...s, shape }))}
                className={`text-xs py-2 px-1 rounded transition-all duration-200 ${
                  state.shape === shape
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Color & Sensors */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          
          {/* Color */}
          <div>
             <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Color</label>
             <div className="flex items-center gap-2 bg-gray-800/50 rounded p-1 border border-gray-700/50">
                <input 
                    type="color" 
                    value={state.color}
                    onChange={(e) => setState(s => ({...s, color: e.target.value}))}
                    className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="text-xs text-gray-300 font-mono">{state.color}</span>
             </div>
          </div>

          {/* Inputs */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Controls</label>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={toggleCamera}
                    className={`flex items-center justify-between text-xs px-2 py-1 rounded border transition-all ${
                        state.isCameraEnabled ? 'border-green-500/50 bg-green-900/20 text-green-200 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-750'
                    }`}
                >
                    <span>Camera</span>
                    <div className={`w-2 h-2 rounded-full ${state.isCameraEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                </button>
                <button 
                    onClick={toggleAudio}
                    className={`flex items-center justify-between text-xs px-2 py-1 rounded border transition-all ${
                        state.isAudioEnabled ? 'border-blue-500/50 bg-blue-900/20 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-750'
                    }`}
                >
                    <span>Mic</span>
                    <div className={`w-2 h-2 rounded-full ${state.isAudioEnabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></div>
                </button>
            </div>
          </div>
        </div>
        
        {handLoading && state.isCameraEnabled && (
            <div className="mt-2 text-xs text-yellow-400 animate-pulse text-center bg-yellow-900/20 py-1 rounded">
                Initializing...
            </div>
        )}
      </div>

    </div>
  );
};

export default UIOverlay;
