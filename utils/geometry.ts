import * as THREE from 'three';
import { ParticleShape } from '../types';

const COUNT = 12000;

export const generateParticles = (shape: ParticleShape): Float32Array => {
  const positions = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;

    switch (shape) {
      case ParticleShape.SPHERE: {
        const phi = Math.acos(-1 + (2 * i) / COUNT);
        const theta = Math.sqrt(COUNT * Math.PI) * phi;
        const r = 4;
        x = r * Math.cos(theta) * Math.sin(phi);
        y = r * Math.sin(theta) * Math.sin(phi);
        z = r * Math.cos(phi);
        break;
      }
      case ParticleShape.HEART: {
        // Parametric heart equations
        // Use random sampling for volume or surface? Let's do random distribution inside
        const t = Math.random() * Math.PI * 2;
        const u = Math.random() * Math.PI * 2; 
        // A bit simplified heart shape distribution
        const r = 0.25; 
        // 16sin^3(t)
        // 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
        // Add some thickness with z
        const ht = Math.random() * Math.PI * 2;
        // Basic 2D outline
        let hx = 16 * Math.pow(Math.sin(ht), 3);
        let hy = 13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht);
        
        // Randomize radius to fill it in
        const scale = Math.sqrt(Math.random()) * 0.3;
        x = hx * scale;
        y = hy * scale;
        z = (Math.random() - 0.5) * 2; // Thickness
        break;
      }
      case ParticleShape.SATURN: {
        if (i < COUNT * 0.6) {
          // Planet
          const phi = Math.acos(-1 + (2 * i) / (COUNT * 0.6));
          const theta = Math.sqrt((COUNT * 0.6) * Math.PI) * phi;
          const r = 2.5;
          x = r * Math.cos(theta) * Math.sin(phi);
          y = r * Math.sin(theta) * Math.sin(phi);
          z = r * Math.cos(phi);
        } else {
          // Ring
          const angle = Math.random() * Math.PI * 2;
          const dist = 3.5 + Math.random() * 2.5;
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          y = (Math.random() - 0.5) * 0.2; // Thin disk
          
          // Tilt the whole system later or here
          const tilt = Math.PI / 6;
          const tempY = y * Math.cos(tilt) - z * Math.sin(tilt);
          const tempZ = y * Math.sin(tilt) + z * Math.cos(tilt);
          y = tempY;
          z = tempZ;
        }
        break;
      }
      case ParticleShape.GALAXY: {
        const branches = 3;
        const radius = Math.random() * 8;
        const spinAngle = radius * 1.5; // Spiral factor
        const branchAngle = ((i % branches) / branches) * Math.PI * 2;
        
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;

        x = Math.cos(branchAngle + spinAngle) * radius + randomX;
        y = randomY; // Flat galaxy
        z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        break;
      }
      case ParticleShape.CUBE: {
        const s = 5;
        x = (Math.random() - 0.5) * s;
        y = (Math.random() - 0.5) * s;
        z = (Math.random() - 0.5) * s;
        break;
      }
      case ParticleShape.BURST: {
         // Random point in sphere volume
         const theta = Math.random() * 2 * Math.PI;
         const phi = Math.acos(2 * Math.random() - 1);
         const r = Math.pow(Math.random(), 1/3) * 6; // Uniform volume
         x = r * Math.sin(phi) * Math.cos(theta);
         y = r * Math.sin(phi) * Math.sin(theta);
         z = r * Math.cos(phi);
         break;
      }
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }
  return positions;
};