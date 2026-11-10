import { Globe, Eye, Rocket, Moon, Mountain } from 'lucide-react';

export type CameraPresetType = 'system' | 'earth' | 'cruise' | 'moon';

interface CameraPresetsBarProps {
  currentPreset: CameraPresetType;
  onSelectPreset: (preset: CameraPresetType) => void;
  onNavigateToSurface: () => void;
}

export default function CameraPresetsBar({
  currentPreset,
  onSelectPreset,
  onNavigateToSurface,
}: CameraPresetsBarProps) {
  const presets: { id: CameraPresetType; label: string; icon: any; desc: string }[] = [
    { id: 'system', label: 'System Overview', icon: Eye, desc: 'Earth-Moon orbital vista' },
    { id: 'earth', label: 'Earth Departure', icon: Globe, desc: 'LEO injection node' },
    { id: 'cruise', label: 'Cruise Tracker', icon: Rocket, desc: 'Tracking CLPS lander' },
    { id: 'moon', label: 'Lunar Orbit', icon: Moon, desc: 'Candidate landing sites' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-full pointer-events-auto select-none shadow-xl">
      {presets.map((p) => {
        const Icon = p.icon;
        const isActive = currentPreset === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.id)}
            title={p.desc}
            className={`px-3 py-1.5 rounded-full text-xs font-['Space_Grotesk'] font-medium uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-white text-black font-bold shadow-md scale-105'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        );
      })}

      <div className="w-px h-4 bg-white/20 mx-1" />

      {/* Direct link to LOLA DEM 3D surface view */}
      <button
        onClick={onNavigateToSurface}
        className="px-3 py-1.5 rounded-full text-xs font-['Space_Grotesk'] font-semibold uppercase tracking-wider text-amber-300 hover:text-black hover:bg-amber-400 transition-all flex items-center gap-1.5 border border-amber-500/30"
        title="Explore LOLA 5m/px DEM 3D Surface Terrain"
      >
        <Mountain className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Surface 3D</span>
      </button>
    </div>
  );
}
