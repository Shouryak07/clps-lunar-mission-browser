import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CLPSSpacecraftProps {
  curve: THREE.CatmullRomCurve3;
  progress: number; // 0 to 1
  name?: string;
  onSelectSpacecraft?: () => void;
  isSelected?: boolean;
}

export default function CLPSSpacecraft({
  curve,
  progress,
  name = 'Nova-C Lander',
  onSelectSpacecraft,
  isSelected = false,
}: CLPSSpacecraftProps) {
  const groupRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);

  // Load the NASA lunar lander 3D model
  const { scene } = useGLTF('/models/lunar_lander.glb');
  const landerClone = useMemo(() => {
    const clone = scene.clone(true);
    // Apply metallic & roughness enhancements for space lighting
    clone.traverse((child: any) => {
      if (child.isMesh && child.material) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Position and orient spacecraft along the 3D trajectory curve
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const clampedT = Math.max(0.001, Math.min(0.999, progress));
    const currentPos = curve.getPointAt(clampedT);
    const tangent = curve.getTangentAt(clampedT).normalize();

    groupRef.current.position.copy(currentPos);

    // Compute look-at orientation along the curve tangent
    const targetPoint = currentPos.clone().add(tangent);
    groupRef.current.lookAt(targetPoint);

    // Thruster engine plume flicker
    if (thrusterRef.current) {
      const flicker = 1.0 + Math.sin(clock.getElapsedTime() * 25) * 0.25;
      thrusterRef.current.scale.set(flicker, flicker * 1.3, flicker);
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSpacecraft?.();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Lander Model Scaled to fit space scene */}
      <group scale={[0.18, 0.18, 0.18]} rotation={[0, Math.PI, 0]}>
        <primitive object={landerClone} />
      </group>

      {/* Engine Thruster Plume */}
      <mesh
        ref={thrusterRef}
        position={[0, 0, -0.6]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.15, 0.75, 12, 1, true]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Target Marker Ring when selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.35, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* HUD Spacecraft Identification Pill */}
      <Html
        distanceFactor={28}
        position={[0, 1.2, 0]}
        center
        className="pointer-events-auto"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectSpacecraft?.();
          }}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-lg border ${
            isSelected
              ? 'bg-sky-500 text-black font-bold border-sky-300'
              : 'bg-black/80 text-sky-300 border-sky-400/30 hover:border-sky-400 hover:text-white'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <span>{name}</span>
        </button>
      </Html>
    </group>
  );
}

useGLTF.preload('/models/lunar_lander.glb');
