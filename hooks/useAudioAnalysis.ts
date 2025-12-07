import { useEffect, useRef, useState } from 'react';
import { AudioData } from '../types';

export const useAudioAnalysis = (enabled: boolean) => {
  const [audioData, setAudioData] = useState<AudioData>({ volume: 0, beat: false });
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  
  // Beat detection helpers
  const beatCutoffRef = useRef<number>(0);
  const beatDecayRate = 0.95;

  useEffect(() => {
    if (!enabled) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        analyze();
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    initAudio();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const analyze = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate Average Volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const normalizedVolume = average / 255; // 0 to 1

    // Simple Beat Detection
    // If current volume > threshold, and we aren't already in a beat hold
    let isBeat = false;
    if (normalizedVolume > beatCutoffRef.current && normalizedVolume > 0.1) {
      isBeat = true;
      beatCutoffRef.current = normalizedVolume * 1.1; // Increase threshold immediately
    } else {
      beatCutoffRef.current *= beatDecayRate; // Decay threshold
      if (beatCutoffRef.current < 0.1) beatCutoffRef.current = 0.1;
    }

    // Update state occasionally or via ref to avoid React render thrashing
    // For direct visualizer loop usage, we might prefer a Ref, but for this demo standard state is okay 
    // provided we don't render the whole DOM tree too often.
    // However, to keep the particles smooth, we'll actually NOT update React state every frame.
    // Instead we'll update a ref that the canvas component can read.
    // But for the sake of this hook returning data, we'll expose a ref getter or similar.
    // To solve "React Hook Infinite Loop" and performance, we will update a Mutable Ref that is returned.
    
    // We will update the ref, but also set state ONLY if it changes significantly to trigger UI updates if needed (optional)
    // Actually, let's just update the internal refs and return a getter function or the ref itself.
    
    requestRef.current = requestAnimationFrame(analyze);
  };
  
  // We expose a ref that has the latest data, so the Animation Loop can read it without triggering React Renders
  const analysisRef = useRef<AudioData>({ volume: 0, beat: false });
  
  // We hook into the analyze loop to update this ref
  const originalAnalyze = analyze;
  // Monkey patch logic into the loop? No, just put it inside analyze.
  // Re-writing analyze slightly to update the exported ref
  
  const analyzeWithRefUpdate = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Low frequency focus for beat
    let sum = 0;
    // Lower half of spectrum is bass-heavy
    const p = dataArrayRef.current.slice(0, dataArrayRef.current.length / 2);
    for(let i=0; i<p.length; i++) sum += p[i];
    
    const average = sum / p.length;
    const normalizedVolume = average / 255;
    
    let isBeat = false;
    if (normalizedVolume > beatCutoffRef.current && normalizedVolume > 0.15) {
      isBeat = true;
      beatCutoffRef.current = normalizedVolume * 1.15;
    } else {
      beatCutoffRef.current *= beatDecayRate;
    }

    analysisRef.current = {
        volume: normalizedVolume,
        beat: isBeat
    };

    requestRef.current = requestAnimationFrame(analyzeWithRefUpdate);
  }

  // Override the effect to use this new function
  useEffect(() => {
    if(!enabled) {
        analysisRef.current = { volume: 0, beat: false };
        return;
    }
    
    const init = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.smoothingTimeConstant = 0.8;
            analyserRef.current.fftSize = 512;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyzeWithRefUpdate();
        } catch (e) { console.error(e); }
    }
    init();
    return () => {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
        if(audioContextRef.current) audioContextRef.current.close();
    }
  }, [enabled]);

  return analysisRef;
};