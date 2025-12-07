import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleShape, HandData, AudioData } from '../types';
import { generateParticles } from '../utils/geometry';

interface ParticleSystemProps {
  shape: ParticleShape;
  color: string;
  handDataRef: React.MutableRefObject<HandData>; 
  audioDataRef: React.MutableRefObject<AudioData>;
  handEnabled: boolean;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  shape, 
  color, 
  handDataRef, 
  audioDataRef,
  handEnabled
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const targetPositions = useMemo(() => generateParticles(shape), [shape]);
  const currentPositions = useMemo(() => new Float32Array(targetPositions.length), [targetPositions]);
  
  // Initialize positions
  useMemo(() => {
    for(let i=0; i<currentPositions.length; i++) {
        currentPositions[i] = (Math.random() - 0.5) * 10;
    }
  }, [currentPositions]);

  const tempColor = useMemo(() => new THREE.Color(), []);

  // Smooth rotation values
  const currentRotation = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const hand = handDataRef.current;
    const audio = audioDataRef.current;
    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    
    // --- Scale Logic ---
    let targetScale = 1.0;
    let jitterFactor = 0.05;

    if (handEnabled && hand.isPresent) {
        // Zoom Logic: Map Tension (0=Fist, 1=Open)
        // Fist (0) -> Zoom In (Scale Up to 2.5x)
        // Open (1) -> Zoom Out (Scale Down to 0.5x)
        targetScale = 0.5 + (1.0 - hand.tension) * 2.0;

        // Add energy/jitter when making a tight fist (Zoomed In)
        if (hand.tension < 0.2) {
            jitterFactor = 0.15;
        }
    } else if (handEnabled && !hand.isPresent) {
        // Idle breathing if camera enabled but no hand
        targetScale = 1.0 + Math.sin(state.clock.elapsedTime) * 0.1;
    }

    // Audio Influence on Scale
    if (audio.volume > 0) {
        jitterFactor += audio.volume * 0.5;
        // Beat adds a momentary punch to scale
        if (audio.beat) targetScale *= 1.2;
        else targetScale *= (1 + audio.volume * 0.2);
    }

    // --- Position & Rotation Logic ---
    const lerpSpeed = 3.0 * delta;
    
    if (handEnabled && hand.isPresent) {
        // Map Hand X/Y (0-1) to Rotation angles (-PI to PI)
        const targetRotY = (hand.x - 0.5) * Math.PI * 2; // Left/Right
        const targetRotX = (hand.y - 0.5) * Math.PI;     // Up/Down
        
        // Smooth rotation
        currentRotation.current.x += (targetRotX - currentRotation.current.x) * delta * 5;
        currentRotation.current.y += (targetRotY - currentRotation.current.y) * delta * 5;
        
        pointsRef.current.rotation.x = currentRotation.current.x;
        pointsRef.current.rotation.y = currentRotation.current.y;
    } else {
        // Auto rotate
        pointsRef.current.rotation.y += delta * 0.1;
        // Reset X tilt slowly
        pointsRef.current.rotation.x += (0 - pointsRef.current.rotation.x) * delta;
    }

    if (audio.beat) {
        pointsRef.current.rotation.y += delta * 0.5;
    }

    // --- Particle Animation ---
    for (let i = 0; i < currentPositions.length; i += 3) {
      const tx = targetPositions[i] * targetScale;
      const ty = targetPositions[i+1] * targetScale;
      const tz = targetPositions[i+2] * targetScale;

      let cx = currentPositions[i];
      let cy = currentPositions[i+1];
      let cz = currentPositions[i+2];

      const noise = Math.sin(i * 0.1 + state.clock.elapsedTime * 5) * jitterFactor;
      
      cx += (tx + noise - cx) * lerpSpeed;
      cy += (ty + noise - cy) * lerpSpeed;
      cz += (tz + noise - cz) * lerpSpeed;
      
      currentPositions[i] = cx;
      currentPositions[i+1] = cy;
      currentPositions[i+2] = cz;
    }

    positionsAttribute.needsUpdate = true;
    
    // Color update
    tempColor.set(color);
    if (audio.beat) {
        tempColor.offsetHSL(0, 0, 0.2);
    }
    
    // Intensify color when zoomed in (fist)
    if (handEnabled && hand.isPresent && hand.tension < 0.3) {
        tempColor.offsetHSL(0, 0.2, 0.1);
    }
    
    (pointsRef.current.material as THREE.PointsMaterial).color.lerp(tempColor, 0.1);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={currentPositions.length / 3}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
};

export default ParticleSystem;