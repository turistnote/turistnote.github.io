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
 * Raw EXIF GPS reader — bypasses exifr, reads GPS IFD directly from JPEG bytes.
 * Handles Xiaomi/MediaTek files where exifr returns NaN for GPS rationals.
 */
async function readRawExifGps(file) {
  try {
    const buf = await file.arrayBuffer();
    const dv = new DataView(buf);

    // Scan JPEG segments for APP1/Exif
    let pos = 2;
    while (pos + 4 < dv.byteLength) {
      if (dv.getUint8(pos) !== 0xff) break;
      const marker = dv.getUint8(pos + 1);
      const segLen = dv.getUint16(pos + 2);
      if (
        marker === 0xe1 &&
        dv.getUint8(pos + 4) === 0x45 &&
        dv.getUint8(pos + 5) === 0x78 &&
        dv.getUint8(pos + 6) === 0x69 &&
        dv.getUint8(pos + 7) === 0x66 &&
        dv.getUint16(pos + 8) === 0
      ) {
        const base = pos + 10; // TIFF header start
        const le = dv.getUint16(base) === 0x4949;
        const r16 = (o) => dv.getUint16(base + o, le);
        const r32 = (o) => dv.getUint32(base + o, le);

        // Find GPS IFD pointer (tag 0x8825) in IFD0
        const ifd0 = r32(4);
        const ifd0n = r16(ifd0);
        let gpsOff = null;
        for (let i = 0; i < ifd0n; i++) {
          const e = ifd0 + 2 + i * 12;
          if (r16(e) === 0x8825) {
            gpsOff = r32(e + 8);
            break;
          }
        }
        if (gpsOff === null) return null;

        // Read GPS IFD
        const tags = {};
        const gpsn = r16(gpsOff);
        for (let i = 0; i < gpsn; i++) {
          const e = gpsOff + 2 + i * 12;
          const tag = r16(e);
          const type = r16(e + 2);
          const count = r32(e + 4);
          if (type === 2) {
            // ASCII
            const off = count <= 4 ? e + 8 : r32(e + 8);
            let s = "";
            for (let c = 0; c < count - 1; c++)
              s += String.fromCharCode(dv.getUint8(base + off + c));
            tags[tag] = s;
          } else if (type === 5) {
            // RATIONAL (always at offset, 8 bytes each)
            const off = r32(e + 8);
            const vals = [];
            for (let r = 0; r < count; r++) {
              const num = r32(off + r * 8);
              const den = r32(off + r * 8 + 4);
              vals.push(den === 0 ? 0 : num / den);
            }
            tags[tag] = vals;
          }
        }

        const latArr = tags[2]; // GPSLatitude
        const lonArr = tags[4]; // GPSLongitude
        if (!Array.isArray(latArr) || !Array.isArray(lonArr)) return null;

        let lat = latArr[0] + latArr[1] / 60 + (latArr[2] || 0) / 3600;
        let lon = lonArr[0] + lonArr[1] / 60 + (lonArr[2] || 0) / 3600;
        if (tags[1] === "S") lat = -lat; // GPSLatitudeRef
        if (tags[3] === "W") lon = -lon; // GPSLongitudeRef

        if (isFinite(lat) && isFinite(lon) && (lat !== 0 || lon !== 0))
          return { latitude: lat, longitude: lon };
        return null;
      }
      pos += 2 + segLen;
    }
  } catch (e) {
    console.log("[exif] rawGps error:", e);
  }
  return null;
}

/**
 * Extract GPS coordinates and date from an image file using exifr.
 * Returns { lat, lng, date } — each field may be null if not found.
 * date is a string in 'YYYY-MM-DD' format.
 */
export async function extractExifData(file) {
  function validCoord(v) {
    return v != null && isFinite(v) && !isNaN(v) ? v : null;
  }
  try {
    const [gpsData, fullData, rawGps] = await Promise.all([
      exifr.gps(file).catch(() => null),
      exifr
        .parse(file, {
          gps: true,
          xmp: true,
          tiff: true,
          ifd0: true,
          exif: true,
          translateValues: true,
          reviveValues: true,
          sanitize: true,
        })
        .catch(() => null),
      readRawExifGps(file),
    ]);

    console.log("[exif] gps():", gpsData);
    console.log(
      "[exif] parse() lat/lon:",
      fullData?.latitude,
      fullData?.longitude,
    );
    console.log("[exif] rawGps:", rawGps);

    const lat =
      validCoord(gpsData?.latitude) ??
      validCoord(fullData?.latitude) ??
      validCoord(rawGps?.latitude) ??
      null;
    const lng =
      validCoord(gpsData?.longitude) ??
      validCoord(fullData?.longitude) ??
      validCoord(rawGps?.longitude) ??
      null;

    const rawDate = fullData?.DateTimeOriginal ?? fullData?.CreateDate ?? null;
    let date = null;
    if (rawDate instanceof Date && !isNaN(rawDate)) {
      date = rawDate.toISOString().slice(0, 10);
    }

    return { lat, lng, date };
  } catch (e) {
    console.log("[exif] error:", e);
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
