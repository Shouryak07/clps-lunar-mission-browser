import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CislunarEarthProps {
  position?: [number, number, number];
  radius?: number;
  onSelectEarth?: () => void;
}

export default function CislunarEarth({
  position = [-80, 20, -50],
  radius = 13.5,
  onSelectEarth,
}: CislunarEarthProps) {
  const earthRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, cloudsMap, lightsMap] = useTexture([
    '/textures/earth_day_2k.jpg',
    '/textures/earth_clouds_1k.png',
    '/textures/earth_lights_2k.png',
  ]);

  useMemo(() => {
    if (dayMap) {
      dayMap.colorSpace = THREE.SRGBColorSpace;
      dayMap.generateMipmaps = true;
      dayMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
    if (cloudsMap) {
      cloudsMap.generateMipmaps = true;
      cloudsMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
    if (lightsMap) {
      lightsMap.generateMipmaps = true;
      lightsMap.minFilter = THREE.LinearMipmapLinearFilter;
    }
  }, [dayMap, cloudsMap, lightsMap]);

  // Rotate Earth & cloud layer
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.028;
    }
  });

  return (
    <group
      position={position}
      onClick={onSelectEarth}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <group ref={earthRef}>
        {/* Base Earth Sphere */}
        <Sphere args={[radius, 64, 64]}>
          <meshStandardMaterial
            map={dayMap}
            roughness={0.65}
            metalness={0.1}
            bumpScale={0.05}
          />
        </Sphere>

        {/* Night Lights Sphere (Additive faint glow on shaded sides) */}
        {lightsMap && (
          <Sphere args={[radius * 1.002, 48, 48]}>
            <meshBasicMaterial
              map={lightsMap}
              blending={THREE.AdditiveBlending}
              transparent
              opacity={0.35}
            />
          </Sphere>
        )}
      </group>

      {/* Cloud Sphere */}
      {cloudsMap && (
        <Sphere ref={cloudsRef} args={[radius * 1.018, 48, 48]}>
          <meshStandardMaterial
            map={cloudsMap}
            transparent
            opacity={0.68}
            blending={THREE.NormalBlending}
            roughness={0.9}
            depthWrite={false}
          />
        </Sphere>
      )}

      {/* Atmospheric Fresnel Halo */}
      <Sphere args={[radius * 1.045, 32, 32]}>
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Low Earth Orbit (LEO) Departure Node Marker */}
      <group position={[radius * 1.25, radius * 0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html distanceFactor={45} position={[0, 0.8, 0]} center>
          <div className="pointer-events-none select-none text-center">
            <div className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-400/40 text-[9px] font-mono tracking-widest uppercase text-sky-300 whitespace-nowrap shadow-lg">
              LEO Departure Node • Alt 285 km
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}
