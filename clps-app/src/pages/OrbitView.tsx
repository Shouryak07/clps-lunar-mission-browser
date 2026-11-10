import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMission } from '../context/MissionContext';
import { View } from '@react-three/drei';
import type { CameraControls } from '@react-three/drei';
import { useAppStore } from '../store/useAppStore';
import SitesDrawer from '../components/SitesDrawer';
import DescentOverlay from '../components/DescentOverlay';
import FpsMonitor from '../components/FpsMonitor';
import CislunarSystem from '../components/CislunarSystem';
import CameraPresetsBar, { type CameraPresetType } from '../components/CameraPresetsBar';
import MissionTimelineScrubber from '../components/MissionTimelineScrubber';
import MissionDossierModal from '../components/MissionDossierModal';
import { CLPS_MISSIONS } from '../data/clpsMissions';
import { getLunarLightingForDate } from '../utils/lunarLighting';
import { getLiveLunarStatus } from '../utils/lunarAstronomy';
import { latLonToVector3 } from '../components/RingMarker';
import {
  Sun,
  Compass,
  MapPin,
  Layers,
  ArrowRight,
  Radio,
  X,
  FileText,
  ChevronDown,
  Sparkles,
  Rocket,
} from 'lucide-react';

const ASTRONAUT_LOGS = [
  {
    title: 'Permanently Shadowed Regions (PSRs)',
    author: 'NASA Artemis Science Team',
    text: 'At the lunar South Pole, deep crater interiors have remained in complete darkness for over two billion years. Temperatures drop to 40 Kelvin (-233°C), preserving massive deposits of primordial water ice essential for life support and propellant production.',
  },
  {
    title: 'Peak Solar Illumination',
    author: 'LRO LOLA Laser Altimetry',
    text: 'Elevated peaks on the rims of Shackleton Crater and Malapert Mountain receive sunlight for over 85% of the lunar year. The Sun glides horizontally across the horizon, creating grazing low-angle shadows and near-continuous solar array power.',
  },
  {
    title: 'Direct-to-Earth Line of Sight',
    author: 'JPL Deep Space Telemetry',
    text: "Because of lunar libration (the Moon's subtle wobble), Earth oscillates between +6.5° and -6.5° relative to the polar horizon over a 27.3-day cycle. When Earth dips below the local horizon, direct radio communications are cut off.",
  },
  {
    title: 'Apollo 17 Departure Log',
    author: 'Eugene Cernan (Commander)',
    text: 'As we leave the Moon at Taurus-Littrow, we leave as we came and, God willing, as we shall return, with peace and hope for all mankind. Godspeed the crew of Apollo 17.',
  },
];

export default function OrbitView() {
  const navigate = useNavigate();
  const { SITES, setSelectedSite } = useMission();
  const {
    phase,
    setPhase,
    setOverlayOpacity,
    reducedMotion,
    setReducedMotion,
    setViewReady,
  } = useAppStore();

  const cameraControlsRef = useRef<CameraControls | null>(null);

  // Mission & 3D space state
  const [activeMissionId, setActiveMissionId] = useState<string>('im-1');
  const [timelineProgress, setTimelineProgress] = useState<number>(0.55);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetType>('system');
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Surface inspection state
  const [hoveredSite, setHoveredSite] = useState<any | null>(null);
  const [targetSite, setTargetSite] = useState<any | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [activeLogIndex, setActiveLogIndex] = useState<number | null>(null);
  const [isMissionDropdownOpen, setIsMissionDropdownOpen] = useState<boolean>(false);

  // Current active CLPS mission object
  const activeMission = useMemo(() => {
    return CLPS_MISSIONS.find((m) => m.id === activeMissionId) || CLPS_MISSIONS[0];
  }, [activeMissionId]);

  // Signal view readiness
  useEffect(() => {
    setViewReady(true);
    return () => setViewReady(false);
  }, [setViewReady]);

  // Trajectory playback ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimelineProgress((prev) => {
        if (prev >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return Math.min(1, prev + 0.003);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Astronomical status calculations
  const lighting = useMemo(() => getLunarLightingForDate(new Date()), []);
  const liveLunar = useMemo(() => getLiveLunarStatus(new Date()), []);

  // System reduced-motion listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [setReducedMotion]);

  // Handle touchdown descent sequence into LOLA DEM 5m/px view
  const handleSelectSite = (siteOrId: any) => {
    const site =
      typeof siteOrId === 'string'
        ? SITES.find((s: any) => s.id === siteOrId) || SITES[0]
        : siteOrId;

    setSelectedSite(site);
    setTargetSite(site);

    if (reducedMotion) {
      setOverlayOpacity(1);
      setTimeout(() => navigate(`/mission/${site.id}`), 250);
      return;
    }

    setPhase('descending');

    if (cameraControlsRef.current) {
      const sitePos = latLonToVector3(site.lat, site.lon, 12);
      const normal = sitePos.clone().normalize();
      const approachCamPos = normal.clone().multiplyScalar(13.8);

      cameraControlsRef.current.setLookAt(
        approachCamPos.x,
        approachCamPos.y,
        approachCamPos.z,
        sitePos.x,
        sitePos.y,
        sitePos.z,
        true
      );

      setTimeout(() => {
        if (cameraControlsRef.current) {
          cameraControlsRef.current.dollyTo(12.5, true);
        }
      }, 1200);

      setTimeout(() => {
        setOverlayOpacity(1);
      }, 1800);

      setTimeout(() => {
        navigate(`/mission/${site.id}`);
      }, 2200);
    } else {
      navigate(`/mission/${site.id}`);
    }
  };

  const activeFocusSite = targetSite || hoveredSite;

  return (
    <div className="h-screen w-full bg-transparent text-white relative overflow-hidden select-none">
      {/* ── Crossfade Descent Overlay ── */}
      <DescentOverlay onCancel={() => setTargetSite(null)} />

      {/* ── 3D Cislunar Earth-Moon System Viewport ── */}
      <View className="absolute inset-0 z-0 pointer-events-auto">
        <Suspense fallback={null}>
          <CislunarSystem
            mission={activeMission}
            progress={timelineProgress}
            onProgressChange={setTimelineProgress}
            cameraPreset={cameraPreset}
            onSelectPreset={setCameraPreset}
            sites={SITES}
            hoveredSite={hoveredSite}
            targetSite={targetSite}
            isDescending={phase === 'descending'}
            showHeatmap={showHeatmap}
            onHoverSite={setHoveredSite}
            onSelectSite={handleSelectSite}
            onSelectAstronaut={() => {
              setActiveLogIndex((prev) => ((prev ?? -1) + 1) % ASTRONAUT_LOGS.length);
            }}
            cameraControlsRef={cameraControlsRef}
          />
        </Suspense>
      </View>

      {/* ── Minimalist Clean Hero Overlay ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-5 pointer-events-none">
        {/* Top Header Bar */}
        <header className="w-full flex items-center justify-between gap-4 pointer-events-auto">
          {/* Brand Wordmark & Mission Selector */}
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-sm tracking-[0.2em] uppercase font-bold text-white">
                  CLPS Space Explorer
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-zinc-300">
                  Cislunar 3D System
                </span>
              </div>

              {/* Mission Selector Dropdown */}
              <div className="relative mt-1">
                <button
                  onClick={() => setIsMissionDropdownOpen(!isMissionDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <Rocket className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold underline decoration-dotted">
                    {activeMission.name}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isMissionDropdownOpen && (
                  <div className="absolute top-6 left-0 w-64 bg-[#0a0b12] border border-white/20 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    {CLPS_MISSIONS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setActiveMissionId(m.id);
                          setTimelineProgress(0.5);
                          setIsMissionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                          m.id === activeMissionId
                            ? 'bg-amber-400/20 text-amber-300 font-bold'
                            : 'text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div>{m.name}</div>
                          <div className="text-[10px] text-zinc-400">{m.provider}</div>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                          {m.targetSiteName.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center Camera Presets Bar */}
          <div className="hidden md:flex">
            <CameraPresetsBar
              currentPreset={cameraPreset}
              onSelectPreset={setCameraPreset}
              onNavigateToSurface={() => handleSelectSite(activeMission.linkedSiteId)}
            />
          </div>

          {/* Top-Right Minimal Actions */}
          <div className="flex items-center gap-2.5">
            {/* Mission Dossier Modal Button */}
            <button
              onClick={() => setIsDossierOpen(true)}
              className="bg-black/50 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 rounded-full px-3 py-1.5 font-['Space_Grotesk'] text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Dossier</span>
            </button>

            {/* Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-1.5 border ${
                showHeatmap
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-black/40 text-zinc-400 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showHeatmap ? 'Heatmap: On' : 'Heatmap'}</span>
            </button>

            {/* Compare Sites Link */}
            <button
              onClick={() => navigate('/compare')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-full px-3.5 py-1.5 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Compare
            </button>

            {/* Sites Drawer */}
            <SitesDrawer
              sites={SITES}
              hoveredSite={hoveredSite}
              targetSite={targetSite}
              onHover={setHoveredSite}
              onSelect={handleSelectSite}
            />
          </div>
        </header>

        {/* Mobile Camera Presets Bar */}
        <div className="flex md:hidden justify-center pointer-events-auto">
          <CameraPresetsBar
            currentPreset={cameraPreset}
            onSelectPreset={setCameraPreset}
            onNavigateToSurface={() => handleSelectSite(activeMission.linkedSiteId)}
          />
        </div>

        {/* Bottom Panel: Interactive Scrubber + Contextual Cards */}
        <div className="w-full flex flex-col items-center gap-3">
          {/* Contextual Landing Site or Mission Destination Preview Card */}
          {activeFocusSite && (
            <div className="max-w-md w-full bg-[#0a0b12]/90 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {activeFocusSite.label}
                </span>
                <span className="text-xs font-mono text-zinc-400 tabular-nums">
                  {Math.abs(activeFocusSite.lat).toFixed(1)}°S, {Math.abs(activeFocusSite.lon).toFixed(1)}°E
                </span>
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-white tracking-wide">
                  {activeFocusSite.name}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                  {activeFocusSite.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">
                  LOLA 5m/px DEM Altimetry Ready
                </span>
                <button
                  onClick={() => handleSelectSite(activeFocusSite)}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md"
                >
                  <span>Touchdown 3D View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive Mission Timeline Scrubber */}
          <MissionTimelineScrubber
            mission={activeMission}
            progress={timelineProgress}
            onProgressChange={setTimelineProgress}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />

          {/* Bottom Footer Info Strip */}
          <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 pointer-events-auto">
            {/* Astronaut hint / button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveLogIndex((prev) => ((prev ?? -1) + 1) % ASTRONAUT_LOGS.length)}
                className="bg-black/50 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs font-mono text-amber-300 flex items-center gap-1.5 transition-all"
                title="Open astronaut exploration logs"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Astronaut Logs</span>
              </button>
              <span className="hidden sm:inline text-zinc-500 text-[11px]">
                • Drag to orbit • Scroll to zoom • Click spacecraft to track
              </span>
            </div>

            {/* Real-time Astronomical Status Pill */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-mono text-zinc-300 tabular-nums flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>{liveLunar.phaseName} ({liveLunar.illuminationPct}%)</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-sky-300">
                {liveLunar.distanceKm.toLocaleString()} km
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{lighting.dateUtcString} UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mission Dossier Modal ── */}
      <MissionDossierModal
        mission={activeMission}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        onSelectSite={handleSelectSite}
      />

      {/* ── Astronaut Mission Insight Modal ── */}
      {activeLogIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
          <div className="max-w-md w-full bg-[#0a0b12] border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Astronaut Exploration Transmission</span>
              </div>
              <button
                onClick={() => setActiveLogIndex(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest font-semibold">
                LOG #{activeLogIndex + 1} • {ASTRONAUT_LOGS[activeLogIndex].author}
              </div>
              <h4 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                {ASTRONAUT_LOGS[activeLogIndex].title}
              </h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed pt-1">
                "{ASTRONAUT_LOGS[activeLogIndex].text}"
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <button
                onClick={() => setActiveLogIndex((prev) => ((prev ?? 0) + 1) % ASTRONAUT_LOGS.length)}
                className="text-amber-400 hover:text-amber-300 transition-colors underline decoration-dotted"
              >
                Next transmission →
              </button>
              <button
                onClick={() => setActiveLogIndex(null)}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FPS & Performance HUD */}
      <FpsMonitor />
    </div>
  );
}
