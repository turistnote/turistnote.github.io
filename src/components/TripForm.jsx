import { useState, useRef } from "react";
import { extractExifData, resizeImage } from "../utils";
import { IconCamera, IconMapPin, IconX } from "./Icons";

const today = new Date().toISOString().slice(0, 10);

const inputClass =
  "w-full bg-neutral-50 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

export default function TripForm({ onSave, onCancel, initialData = null }) {
  const isEdit = initialData !== null;
  const [name, setName] = useState(initialData?.name ?? "");
  const [date, setDate] = useState(initialData?.date ?? today);
  const [restaurant, setRestaurant] = useState(initialData?.restaurant ?? "");
  const [imageData, setImageData] = useState(initialData?.imageData ?? null);
  const [fileName, setFileName] = useState(null);
  const [gps, setGps] = useState(
    initialData?.lat != null
      ? { lat: initialData.lat, lng: initialData.lng }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFromExif, setDateFromExif] = useState(false);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const [exif, resized] = await Promise.all([
        extractExifData(file),
        resizeImage(file),
      ]);
      if (exif.lat != null && exif.lng != null) {
        setGps({ lat: exif.lat, lng: exif.lng });
      }
      if (exif.date) {
        setDate(exif.date);
        setDateFromExif(true);
      }
      setImageData(resized);
    } catch (err) {
      setError("Nepodařilo se zpracovat fotku.");
    } finally {
      setLoading(false);
    }
  }

  function clearImage() {
    setImageData(null);
    setFileName(null);
    setGps(null);
    setDateFromExif(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Zadejte název výletu.");
      return;
    }
    onSave({
      name: name.trim(),
      date,
      restaurant: restaurant.trim(),
      imageData,
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 p-6 flex flex-col gap-5"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {isEdit ? "Upravit výlet" : "Nový výlet"}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {isEdit ? "Uprav detaily výletu" : "Vyplň detaily o svém výletu"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2">
          <IconX className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Název výletu *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="např. Karlštejn"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDateFromExif(false);
            }}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Restaurace
          </label>
          <input
            type="text"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            className={inputClass}
            placeholder="název restaurace"
          />
        </div>
      </div>

      {/* Custom file picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Fotka
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        {!imageData ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 dark:border-neutral-600 hover:border-emerald-400 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-2xl py-8 flex flex-col items-center gap-2 transition-all group"
          >
            {loading ? (
              <>
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400 dark:text-slate-500">
                  Zpracovávám…
                </span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-neutral-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 flex items-center justify-center transition-colors">
                  <IconCamera className="w-7 h-7 text-slate-400 group-hover:text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 transition-colors">
                  Vyber fotku
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  JPG, PNG, HEIC…
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={imageData}
              alt="náhled"
              className="w-full max-h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 justify-between">
              <div>
                {gps ? (
                  <span className="text-xs text-white bg-emerald-500/80 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                    <IconMapPin className="w-3 h-3" /> {gps.lat.toFixed(4)},{" "}
                    {gps.lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-white/70">Bez GPS</span>
                )}
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl py-3 text-sm font-semibold transition-all shadow-md shadow-emerald-200"
        >
          {isEdit ? "Uložit změny" : "Uložit výlet"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 active:scale-[0.98] text-slate-600 dark:text-slate-300 rounded-2xl py-3 text-sm font-semibold transition-all"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
