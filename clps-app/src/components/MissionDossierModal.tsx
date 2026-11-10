import { X, ExternalLink, ShieldCheck, Rocket, MapPin, CheckCircle2, Cpu } from 'lucide-react';
import type { CLPSMission } from '../data/clpsMissions';

interface MissionDossierModalProps {
  mission: CLPSMission;
  isOpen: boolean;
  onClose: () => void;
  onSelectSite: (siteId: string) => void;
}

export default function MissionDossierModal({
  mission,
  isOpen,
  onClose,
  onSelectSite,
}: MissionDossierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-2xl w-full max-h-[88vh] overflow-y-auto bg-[#0a0b12] border border-white/20 rounded-2xl p-6 shadow-2xl space-y-6 text-white custom-scrollbar">
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                NASA CLPS TASK ORDER
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {mission.launchDate}
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-white">
              {mission.name}
            </h2>
            <div className="text-xs font-mono text-zinc-400 mt-0.5">
              Provider: <span className="text-zinc-200">{mission.provider}</span> • Lander: <span className="text-zinc-200">{mission.landerType}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-emerald-300">{mission.status}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Rocket className="w-4 h-4 text-sky-400" />
            <span>{mission.launchVehicle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>{mission.targetSiteName}</span>
          </div>
        </div>

        {/* Overview Narrative */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
            Mission Overview
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
            {mission.overview}
          </p>
        </div>

        {/* Scientific Objectives */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Scientific & Operational Objectives</span>
          </h3>
          <div className="grid gap-2">
            {mission.scientificObjectives.map((obj, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-zinc-300"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manifested Science Payloads Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Manifested NASA & Commercial Payloads</span>
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {mission.payloads.map((payload) => (
              <div
                key={payload.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="font-['Space_Grotesk'] text-sm font-bold text-white">
                    {payload.name}
                  </div>
                  <div className="text-[10px] font-mono text-sky-300">
                    {payload.agency}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    {payload.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-amber-300">
                  Target: {payload.primaryGoal}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-sans transition-colors"
          >
            Close Dossier
          </button>
          <button
            onClick={() => {
              onClose();
              onSelectSite(mission.linkedSiteId);
            }}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-['Space_Grotesk'] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
          >
            <span>Analyze Landing Site & DEM Terrain</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
