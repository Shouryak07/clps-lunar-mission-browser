import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { TelemetryMilestone } from '../data/clpsMissions';

interface CislunarTrajectoryProps {
  controlPoints: [number, number, number][];
  milestones: TelemetryMilestone[];
  color?: string;
  currentProgress: number;
  onSelectMilestone: (progress: number) => void;
}

export default function CislunarTrajectory({
  controlPoints,
  milestones,
  color = '#38bdf8',
  currentProgress,
  onSelectMilestone,
}: CislunarTrajectoryProps) {
  const pulseBeadRef = useRef<THREE.Mesh>(null);

  // Build CatmullRomCurve3
  const curve = useMemo(() => {
    const vectors = controlPoints.map((pt) => new THREE.Vector3(...pt));
    return new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);
  }, [controlPoints]);

  // Generate smooth tube geometry
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 120, 0.12, 8, false);
  }, [curve]);

  // Animate a glowing signal bead traversing the trajectory continuously
  useFrame(({ clock }) => {
    if (!pulseBeadRef.current) return;
    const t = (clock.getElapsedTime() * 0.12) % 1.0;
    const pos = curve.getPointAt(t);
    pulseBeadRef.current.position.copy(pos);
  });

  return (
    <group>
      {/* 3D Glowing Trajectory Spline Tube */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Trajectory Core Inner Line */}
      <mesh geometry={tubeGeometry} scale={[0.98, 0.98, 0.98]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>

      {/* Continuous Signal Flow Particle traversing the trajectory */}
      <mesh ref={pulseBeadRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Trajectory Milestone Waypoint Nodes */}
      {milestones.map((m) => {
        const pos = curve.getPointAt(m.progress);
        const isCurrent = Math.abs(currentProgress - m.progress) < 0.05;

        return (
          <group
            key={m.progress}
            position={[pos.x, pos.y, pos.z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMilestone(m.progress);
            }}
          >
            {/* Waypoint Sphere */}
            <mesh>
              <sphereGeometry args={[isCurrent ? 0.35 : 0.22, 16, 16]} />
              <meshBasicMaterial
                color={isCurrent ? '#f59e0b' : color}
                transparent
                opacity={0.9}
              />
            </mesh>

            {/* Glowing Ring when active */}
            {isCurrent && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.65, 24]} />
                <meshBasicMaterial
                  color="#f59e0b"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}

            {/* Milestone HTML Label */}
            <Html
              distanceFactor={35}
              position={[0, 0.7, 0]}
              center
              className="pointer-events-auto cursor-pointer"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMilestone(m.progress);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap tracking-wider uppercase transition-all shadow-md ${
                  isCurrent
                    ? 'bg-amber-500/90 text-black font-bold border border-amber-300 scale-105'
                    : 'bg-black/75 text-zinc-300 border border-white/20 hover:border-amber-400 hover:text-white'
                }`}
              >
                <span>{m.label}</span>
                <span className="ml-1 opacity-75 text-[8px]">({m.met})</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
