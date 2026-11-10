/**
 * Client-Side Real-Time Lunar Astronomical Calculation Engine
 * Based on Jean Meeus standard astronomical algorithms.
 * Computes live Moon phase, illumination percentage, lunar age, and Earth-Moon distance.
 */

export interface LunarStatus {
  phaseName: string;
  illuminationPct: number;
  ageDays: number;
  distanceKm: number;
  isWaxing: boolean;
  phaseFraction: number;
}

const SYNODIC_MONTH = 29.53058867; // Days from New Moon to New Moon
const ANOMALISTIC_MONTH = 27.55455; // Days from Perigee to Perigee
const MEAN_DISTANCE_KM = 384400;
const LUNAR_ECCENTRICITY = 0.0549;

// Known New Moon reference epoch: 2000-01-06 18:14 UTC (JD 2451549.26)
const NEW_MOON_REF_JD = 2451549.26;

// Known Perigee reference epoch: 2000-01-22 05:00 UTC (JD 2451565.71)
const PERIGEE_REF_JD = 2451565.71;

function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export function getLiveLunarStatus(date: Date = new Date()): LunarStatus {
  const jd = toJulianDay(date);

  // 1. Synodic Phase Cycle
  const daysSinceNew = (jd - NEW_MOON_REF_JD) % SYNODIC_MONTH;
  const normalizedDays = daysSinceNew < 0 ? daysSinceNew + SYNODIC_MONTH : daysSinceNew;
  const phaseFraction = normalizedDays / SYNODIC_MONTH;

  // Illumination percentage: k = (1 - cos(2*pi*f)) / 2
  const phaseAngleRad = 2 * Math.PI * phaseFraction;
  const illuminationFraction = (1 - Math.cos(phaseAngleRad)) / 2;
  const illuminationPct = Math.round(illuminationFraction * 1000) / 10;

  // Phase Name classification
  let phaseName = 'New Moon';
  if (phaseFraction >= 0.025 && phaseFraction < 0.225) {
    phaseName = 'Waxing Crescent';
  } else if (phaseFraction >= 0.225 && phaseFraction < 0.275) {
    phaseName = 'First Quarter';
  } else if (phaseFraction >= 0.275 && phaseFraction < 0.475) {
    phaseName = 'Waxing Gibbous';
  } else if (phaseFraction >= 0.475 && phaseFraction < 0.525) {
    phaseName = 'Full Moon';
  } else if (phaseFraction >= 0.525 && phaseFraction < 0.725) {
    phaseName = 'Waning Gibbous';
  } else if (phaseFraction >= 0.725 && phaseFraction < 0.775) {
    phaseName = 'Last Quarter';
  } else if (phaseFraction >= 0.775 && phaseFraction < 0.975) {
    phaseName = 'Waning Crescent';
  }

  // 2. Anomalistic Cycle (Distance from Earth)
  const daysSincePerigee = (jd - PERIGEE_REF_JD) % ANOMALISTIC_MONTH;
  const normPerigee = daysSincePerigee < 0 ? daysSincePerigee + ANOMALISTIC_MONTH : daysSincePerigee;
  const anomalyRad = 2 * Math.PI * (normPerigee / ANOMALISTIC_MONTH);

  // Distance modulated by orbital eccentricity
  const distanceKm = Math.round(MEAN_DISTANCE_KM * (1 - LUNAR_ECCENTRICITY * Math.cos(anomalyRad)));

  return {
    phaseName,
    illuminationPct,
    ageDays: Math.round(normalizedDays * 10) / 10,
    distanceKm,
    isWaxing: phaseFraction < 0.5,
    phaseFraction,
  };
}
