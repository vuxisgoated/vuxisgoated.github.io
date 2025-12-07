import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandData } from '../types';

export const useHandTracking = (enabled: boolean) => {
  const [handData, setHandData] = useState<HandData>({ 
    isOpen: true, 
    tension: 0.5, 
    x: 0.5, 
    y: 0.5, 
    z: 1, 
    isPresent: false 
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const startCamera = async () => {
      setLoading(true);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        console.error("Error initializing hand tracking:", err);
      } finally {
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, [enabled]);

  const predictWebcam = () => {
    if (!landmarkerRef.current || !videoRef.current) return;
    
    // Safety check if video is actually ready
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    const startTimeMs = performance.now();
    const result: HandLandmarkerResult = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      
      const wrist = landmarks[0];
      const mcp = landmarks[9]; // Middle Finger MCP
      
      // Calculate Hand Center (using MCP as rough center)
      // Mirror X because webcam is usually mirrored for user
      const handX = 1 - mcp.x; 
      const handY = mcp.y;

      // Calculate Palm Size (Wrist to Middle Finger MCP)
      // This is our depth/zoom proxy. Closer to camera = larger size.
      const palmSize = Math.sqrt(
        Math.pow(mcp.x - wrist.x, 2) + 
        Math.pow(mcp.y - wrist.y, 2) + 
        Math.pow(mcp.z - wrist.z, 2)
      );

      // Normalize scale: 0.1 (far) to 0.4 (close) roughly
      // Map to 0.5 - 2.0
      let zoomFactor = (palmSize - 0.05) / 0.25; 
      zoomFactor = Math.max(0.5, Math.min(zoomFactor * 2, 3.0));

      // Calculate Tension (Fist vs Open)
      const tips = [4, 8, 12, 16, 20];
      let totalDist = 0;
      tips.forEach(idx => {
        const tip = landmarks[idx];
        const dx = tip.x - wrist.x;
        const dy = tip.y - wrist.y;
        const dz = tip.z - wrist.z;
        totalDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
      });
      const avgDist = totalDist / 5;
      const ratio = avgDist / (palmSize || 0.1); 
      
      const minR = 0.8;
      const maxR = 2.0;
      const normalizedTension = Math.min(Math.max((ratio - minR) / (maxR - minR), 0), 1);

      setHandData({
        isPresent: true,
        isOpen: normalizedTension > 0.5,
        tension: normalizedTension,
        x: handX,
        y: handY,
        z: zoomFactor
      });

    } else {
      setHandData(prev => ({ ...prev, isPresent: false }));
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return { handData, videoRef, loading };
};