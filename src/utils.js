import exifr from "exifr";

/**
 * Format an ISO date string (YYYY-MM-DD) to Czech format (D. M. YYYY).
 */
export function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${parseInt(d)}. ${parseInt(m)}. ${y}`;
}

/**
 * Extract GPS coordinates and date from an image file using exifr.
 * Returns { lat, lng, date } — each field may be null if not found.
 * date is a string in 'YYYY-MM-DD' format.
 */
export async function extractExifData(file) {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      tiff: true,
      ifd0: true,
      exif: ["DateTimeOriginal", "CreateDate"],
    });
    if (!data) return { lat: null, lng: null, date: null };

    const lat = data.latitude ?? null;
    const lng = data.longitude ?? null;

    const rawDate = data.DateTimeOriginal ?? data.CreateDate ?? null;
    let date = null;
    if (rawDate instanceof Date && !isNaN(rawDate)) {
      date = rawDate.toISOString().slice(0, 10);
    }

    return { lat, lng, date };
  } catch {
    return { lat: null, lng: null, date: null };
  }
}

/**
 * Reverse geocode GPS coordinates using Nominatim (OpenStreetMap).
 * Returns a suggested place name string, or null on failure.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=cs`,
      { headers: { "User-Agent": "TuristNote/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    // prefer village/town/city, fall back to county/state
    return (
      a.village ??
      a.town ??
      a.city ??
      a.municipality ??
      a.county ??
      a.state ??
      null
    );
  } catch {
    return null;
  }
}

/** @deprecated use extractExifData */
export async function extractGPS(file) {
  const { lat, lng } = await extractExifData(file);
  return lat != null && lng != null ? { lat, lng } : null;
}

/**
 * Resize an image file to max 800px on the longer side, JPEG quality 0.7.
 * Returns a Base64 string (data URL).
 */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          }
        } else {
          if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate azimuth (bearing) in degrees from home point to destination.
 * @param {number} homeLat
 * @param {number} homeLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {number} azimuth 0–360
 */
export function calcAzimuth(homeLat, homeLng, destLat, destLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(destLng - homeLng);
  const lat1 = toRad(homeLat);
  const lat2 = toRad(destLat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Angular difference between two azimuths (0–180).
 */
export function angleDiff(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Recommend the next trip from a list of trips.
 * Strategy:
 *   1. Iterate trips from oldest visited to newest (highest priority first).
 *   2. For each candidate, compare its azimuth only against the 3 most recently
 *      visited OTHER trips. This way the oldest trip is never penalised by its
 *      own azimuth and naturally gets the highest priority.
 *   3. First candidate whose direction differs by ≥ MAX_ANGLE_OVERLAP from all
 *      recent others wins.
 *   4. Fallback: oldest trip with GPS (ignoring direction).
 *
 * @param {Array} trips - all trips (any order)
 * @param {{ lat: number, lng: number }} home
 * @returns {object|null} recommended trip or null
 */
export function recommendNextTrip(trips, home) {
  if (!trips || trips.length === 0) return null;

  const MAX_ANGLE_OVERLAP = 45; // degrees

  // Oldest visited first = highest recommendation priority
  const byAge = [...trips].sort((a, b) => new Date(a.date) - new Date(b.date));
  // Most recently visited first = used for direction exclusion
  const byRecent = [...trips].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  for (const candidate of byAge) {
    // No GPS → can't compute direction → recommend purely by age
    if (candidate.lat == null || candidate.lng == null) return candidate;

    // Other GPS trips visited more recently = direction conflict candidates
    const recentOthers = byRecent
      .filter((t) => t.id !== candidate.id && t.lat != null && t.lng != null)
      .slice(0, 3);

    // No comparable trips → direction filter irrelevant
    if (recentOthers.length === 0) return candidate;

    const az = calcAzimuth(home.lat, home.lng, candidate.lat, candidate.lng);
    const tooClose = recentOthers.some(
      (t) =>
        angleDiff(az, calcAzimuth(home.lat, home.lng, t.lat, t.lng)) <
        MAX_ANGLE_OVERLAP,
    );
    if (!tooClose) return candidate;
  }

  // All candidates direction-filtered → return oldest regardless
  return byAge[0];
}

/**
 * Return up to `count` recommended trips by iteratively picking and excluding.
 */
export function recommendNextTrips(trips, home, count = 3) {
  if (!trips || trips.length === 0) return [];
  const results = [];
  const excludedIds = new Set();
  for (let i = 0; i < Math.min(count, trips.length); i++) {
    const available = trips.filter((t) => !excludedIds.has(t.id));
    if (available.length === 0) break;
    const pick = recommendNextTrip(available, home);
    if (!pick) break;
    results.push(pick);
    excludedIds.add(pick.id);
  }
  return results;
}

/**
 * Export all trips as a JSON file download.
 */
export function exportTrips(trips) {
  const json = JSON.stringify(trips, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `turistnote-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
