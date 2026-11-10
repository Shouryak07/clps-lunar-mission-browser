import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface CislunarSunProps {
  position?: [number, number, number];
  intensity?: number;
}

export default function CislunarSun({
  position = [130, 65, 80],
  intensity = 2.9,
}: CislunarSunProps) {
  const coronaRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coronaRef.current) {
      const scale = 1.0 + Math.sin(t * 1.5) * 0.04;
      coronaRef.current.scale.set(scale, scale, scale);
    }
    if (outerGlowRef.current) {
      const scale = 1.0 + Math.cos(t * 1.1) * 0.06;
      outerGlowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Primary Directional Sunlight casting across Earth and Moon */}
      <directionalLight
        position={[0, 0, 0]}
        target-position={[-40, 10, -25]}
        intensity={intensity}
        color="#fffcf5"
        castShadow={false}
      />

      {/* Point light to add local radiance to objects approaching Sun */}
      <pointLight intensity={1.5} distance={300} decay={2} color="#ffedd5" />

      {/* Sun Core Sphere */}
      <Sphere args={[5.2, 32, 32]}>
        <meshBasicMaterial color="#fffbeb" />
      </Sphere>

      {/* Inner Coronal Halo */}
      <Sphere ref={coronaRef} args={[7.8, 32, 32]}>
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer Luminous Coronal Flare */}
      <Sphere ref={outerGlowRef} args={[12.5, 32, 32]}>
        <meshBasicMaterial
          color="#f97316"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}
