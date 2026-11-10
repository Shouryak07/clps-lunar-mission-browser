import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/useAppStore';

interface FloatingAstronautProps {
  onSelectAstronaut?: () => void;
}

export default function FloatingAstronaut({ onSelectAstronaut }: FloatingAstronautProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/astronaut.glb');
  const { reducedMotion } = useAppStore();
  const [hovered, setHovered] = useState(false);

  // Clone scene so it can be managed independently
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Gentle zero-gravity physics and mouse interaction
  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return;

    const t = state.clock.getElapsedTime();

    // Zero-g slow undulating bobbing motion
    const bobY = Math.sin(t * 0.7) * 0.35 + Math.cos(t * 0.4) * 0.15;
    const driftX = Math.cos(t * 0.5) * 0.2;
    const driftZ = Math.sin(t * 0.3) * 0.25;

    // Base position in lower-right foreground (secondary element, doesn't block center)
    groupRef.current.position.set(9.2 + driftX, -4.6 + bobY, 17 + driftZ);

    // Subtle zero-g rotation/pitch
    const targetRotX = Math.sin(t * 0.4) * 0.08 + 0.1;
    const targetRotY = -0.75 + Math.sin(t * 0.5) * 0.12 + (state.pointer.x * 0.15);
    const targetRotZ = Math.cos(t * 0.6) * 0.06;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 2);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, delta * 2);

    // Subtle hover scale feedback
    const targetScale = hovered ? 0.068 : 0.062;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 4);
  });

  return (
    <group
      ref={groupRef}
      position={[9.2, -4.6, 17]}
      rotation={[0.1, -0.75, 0]}
      scale={[0.062, 0.062, 0.062]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectAstronaut) {
          onSelectAstronaut();
        }
      }}
    >
      {/* Localized lighting to highlight the spacesuit details */}
      <pointLight position={[2, 3, 4]} intensity={2.5} color="#f8fafc" distance={20} />
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/astronaut.glb');
