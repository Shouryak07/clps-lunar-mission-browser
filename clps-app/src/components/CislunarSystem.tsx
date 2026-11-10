import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Sphere, Stars, useTexture, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import CislunarEarth from './CislunarEarth';
import CislunarSun from './CislunarSun';
import CislunarTrajectory from './CislunarTrajectory';
import CLPSSpacecraft from './CLPSSpacecraft';
import MoonMarker3D from './MoonMarker3D';
import MoonHeatmap from './MoonHeatmap';
import FloatingAstronaut from './FloatingAstronaut';
import type { CLPSMission } from '../data/clpsMissions';
import type { CameraPresetType } from './CameraPresetsBar';
import { latLonToVector3 } from './RingMarker';
import { useAppStore } from '../store/useAppStore';

interface CislunarSystemProps {
  mission: CLPSMission;
  progress: number;
  onProgressChange: (p: number) => void;
  cameraPreset: CameraPresetType;
  onSelectPreset: (preset: CameraPresetType) => void;
  sites: any[];
  hoveredSite: any;
  targetSite: any;
  isDescending: boolean;
  showHeatmap: boolean;
  onHoverSite: (site: any) => void;
  onSelectSite: (site: any) => void;
  onSelectAstronaut: () => void;
  cameraControlsRef: React.MutableRefObject<CameraControls | null>;
}

// 3D Realistic Lunar Sphere with NASA 2k textures
function RealisticMoon() {
  const [albedoTexture, bumpTexture] = useTexture([
    '/textures/moon_albedo_2k.jpg',
    '/textures/moon_bump_1k.jpg',
  ]);
  const { gl } = useThree();

  useMemo(() => {
    if (albedoTexture) {
      albedoTexture.generateMipmaps = true;
      albedoTexture.minFilter = THREE.LinearMipmapLinearFilter;
      albedoTexture.magFilter = THREE.LinearFilter;
      albedoTexture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
      albedoTexture.colorSpace = THREE.SRGBColorSpace;
      albedoTexture.needsUpdate = true;
    }
    if (bumpTexture) {
      bumpTexture.generateMipmaps = true;
      bumpTexture.minFilter = THREE.LinearMipmapLinearFilter;
      bumpTexture.magFilter = THREE.LinearFilter;
      bumpTexture.needsUpdate = true;
    }
  }, [albedoTexture, bumpTexture, gl]);

  return (
    <Sphere args={[12, 64, 64]} position={[0, 0, 0]}>
      <meshStandardMaterial
        map={albedoTexture}
        bumpMap={bumpTexture}
        bumpScale={0.14}
        roughness={0.92}
        metalness={0.04}
        color="#c8c8cf"
      />
    </Sphere>
  );
}

export default function CislunarSystem({
  mission,
  progress,
  onProgressChange,
  cameraPreset,
  onSelectPreset,
  sites,
  hoveredSite,
  targetSite,
  isDescending,
  showHeatmap,
  onHoverSite,
  onSelectSite,
  onSelectAstronaut,
  cameraControlsRef,
}: CislunarSystemProps) {
  const moonGroupRef = useRef<THREE.Group>(null);
  const { reducedMotion } = useAppStore();

  // Build the 3D trajectory curve from current mission
  const trajectoryCurve = useMemo(() => {
    const pts = mission.trajectoryControlPoints.map((pt) => new THREE.Vector3(...pt));
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  }, [mission]);

  // Handle camera preset changes
  useEffect(() => {
    if (!cameraControlsRef.current) return;
    const cc = cameraControlsRef.current;

    switch (cameraPreset) {
      case 'system':
        cc.setLookAt(-30, 42, 90, -35, 8, -20, true);
        break;
      case 'earth':
        cc.setLookAt(-58, 28, -25, -80, 20, -50, true);
        break;
      case 'cruise': {
        const landerPos = trajectoryCurve.getPointAt(Math.max(0.001, Math.min(0.999, progress)));
        cc.setLookAt(
          landerPos.x + 5,
          landerPos.y + 3,
          landerPos.z + 8,
          landerPos.x,
          landerPos.y,
          landerPos.z,
          true
        );
        break;
      }
      case 'moon':
        cc.setLookAt(0, 4, 34, 0, 0, 0, true);
        break;
    }
  }, [cameraPreset, cameraControlsRef, trajectoryCurve]);

  // Frame loop: subtle idle moon drift + cruise camera tracking
  useFrame((_, delta) => {
    // 1. Idle Moon rotation
    if (moonGroupRef.current) {
      if (!isDescending && !hoveredSite && !targetSite && !reducedMotion && cameraPreset !== 'cruise') {
        moonGroupRef.current.rotation.y += delta * 0.03;
        moonGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          moonGroupRef.current.rotation.x,
          -0.65,
          0.05
        );
      }

      // Rotate to focused site
      const activeSite = targetSite || hoveredSite;
      if (activeSite && !reducedMotion) {
        const targetY = -THREE.MathUtils.degToRad(activeSite.lon);
        moonGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          moonGroupRef.current.rotation.y,
          targetY,
          0.08
        );
        const targetX = -0.75 - THREE.MathUtils.degToRad(activeSite.lat + 90) * 0.5;
        moonGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          moonGroupRef.current.rotation.x,
          targetX,
          0.08
        );
      }
    }

    // 2. In cruise mode, keep camera tracking the spacecraft smoothly
    if (cameraPreset === 'cruise' && cameraControlsRef.current) {
      const landerPos = trajectoryCurve.getPointAt(Math.max(0.001, Math.min(0.999, progress)));
      const cc = cameraControlsRef.current;
      cc.moveTo(landerPos.x, landerPos.y, landerPos.z, true);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[-30, 42, 90]} fov={45} />

      {/* Luminous Sun & Directional Light */}
      <CislunarSun position={[130, 65, 80]} intensity={2.9} />

      {/* Ambient Baseline for Deep Space Contrast */}
      <ambientLight intensity={0.07} />

      {/* Deep Space Starfield */}
      <Stars radius={200} depth={80} count={6000} factor={4.5} saturation={0} fade speed={0.3} />

      {/* 3D Earth Globe at [-80, 20, -50] */}
      <CislunarEarth
        position={[-80, 20, -50]}
        radius={13.5}
        onSelectEarth={() => onSelectPreset('earth')}
      />

      {/* 3D Translunar Transfer Trajectory Arc */}
      <CislunarTrajectory
        controlPoints={mission.trajectoryControlPoints}
        milestones={mission.milestones}
        color={mission.statusColor === 'emerald' ? '#34d399' : '#38bdf8'}
        currentProgress={progress}
        onSelectMilestone={(p) => {
          onProgressChange(p);
          onSelectPreset('cruise');
        }}
      />

      {/* 3D CLPS Lander Spacecraft */}
      <CLPSSpacecraft
        curve={trajectoryCurve}
        progress={progress}
        name={mission.landerType}
        isSelected={cameraPreset === 'cruise'}
        onSelectSpacecraft={() => onSelectPreset('cruise')}
      />

      {/* Moon Globe with Surface-Anchored Candidate Landing Sites */}
      <group position={[0, 0, 0]} ref={moonGroupRef}>
        <RealisticMoon />
        <MoonHeatmap active={showHeatmap} opacity={0.85} />

        {sites.map((site: any) => (
          <MoonMarker3D
            key={site.id}
            site={site}
            radius={12.1}
            isHovered={hoveredSite?.id === site.id}
            isTargeted={targetSite?.id === site.id}
            onHover={onHoverSite}
            onSelect={onSelectSite}
          />
        ))}
      </group>

      {/* Floating Astronaut (Secondary interactive zero-g personality) */}
      <FloatingAstronaut onSelectAstronaut={onSelectAstronaut} />

      {/* CameraControls for smooth interactive orbit/zoom */}
      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        smoothTime={0.4}
        minDistance={8}
        maxDistance={180}
      />
    </>
  );
}
