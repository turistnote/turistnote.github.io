import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { recommendNextTrips, exportTrips, calcAzimuth } from "./utils";
import TripForm from "./components/TripForm";
import TripCard from "./components/TripCard";
import TripDetail from "./components/TripDetail";
import RecommendationBox from "./components/RecommendationBox";
import BackupNudge from "./components/BackupNudge";
import {
  IconMountain,
  IconUpload,
  IconDownload,
  IconPlus,
  IconMap,
  IconDotsVertical,
  IconSun,
  IconMoon,
} from "./components/Icons";

// Home base – Prague city centre. Adjust as needed.
const HOME = { lat: 50.0755, lng: 14.4378 };

export default function App() {
  const [view, setView] = useState("dashboard"); // 'dashboard' | 'form' | 'detail'
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [importError, setImportError] = useState(null);
  const [showBackupNudge, setShowBackupNudge] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const importRef = useRef(null);
  const menuRef = useRef(null);

  const trips = useLiveQuery(
    () => db.trips.orderBy("date").reverse().toArray(),
    [],
  );

  const recommendations = trips ? recommendNextTrips(trips, HOME, 3) : [];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  async function handleSave(tripData) {
    const azimuth =
      tripData.lat != null && tripData.lng != null
        ? calcAzimuth(HOME.lat, HOME.lng, tripData.lat, tripData.lng)
        : null;
    await db.trips.add({ ...tripData, azimuth });
    setView("dashboard");
    setShowBackupNudge(true);
  }

  async function handleUpdate(tripData) {
    const azimuth =
      tripData.lat != null && tripData.lng != null
        ? calcAzimuth(HOME.lat, HOME.lng, tripData.lat, tripData.lng)
        : null;
    await db.trips.update(editingTrip.id, { ...tripData, azimuth });
    const updated = { ...editingTrip, ...tripData, azimuth };
    setEditingTrip(null);
    setSelectedTrip(updated);
    setView("detail");
  }

  function openEdit(trip) {
    setEditingTrip(trip);
    setView("form");
  }

  async function handleDelete(id) {
    await db.trips.delete(id);
    setView("dashboard");
    setSelectedTrip(null);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Neplatný formát souboru.");
      await db.trips.clear();
      await db.trips.bulkAdd(data);
    } catch (err) {
      setImportError(err.message || "Import se nezdařil.");
    }
    e.target.value = "";
  }

  function openDetail(trip) {
    setSelectedTrip(trip);
    setView("detail");
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-emerald-700/95 backdrop-blur-md text-white px-4 py-3.5 flex items-center justify-between shadow-lg">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-2.5 hover:opacity-80 active:opacity-60 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <IconMountain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">TuristNote</span>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/10 flex items-center justify-center transition-all"
            title="Nastavení"
          >
            <IconDotsVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-100 dark:border-neutral-700 z-50 p-1.5 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl">
                <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  {dark ? (
                    <IconMoon className="w-4 h-4" />
                  ) : (
                    <IconSun className="w-4 h-4" />
                  )}
                  Tmavý režim
                </span>
                <button
                  onClick={() => setDark((d) => !d)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    dark ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                      dark ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              <hr className="border-slate-100 dark:border-neutral-700 my-0.5" />
              <button
                onClick={() => {
                  exportTrips(trips || []);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <IconUpload className="w-4 h-4" /> Export dat
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  importRef.current?.click();
                }}
                className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <IconDownload className="w-4 h-4" /> Import dat
              </button>
            </div>
          )}
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImport}
        />
      </header>

      {showBackupNudge && trips && (
        <BackupNudge
          tripCount={trips.length}
          onExport={() => exportTrips(trips)}
          onDismiss={() => setShowBackupNudge(false)}
        />
      )}

      <main className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
        {importError && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-2xl p-3.5 text-sm flex gap-2 items-start">
            <IconAlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Dashboard */}
        {view === "dashboard" && (
          <>
            <RecommendationBox trips={recommendations} />

            <button
              onClick={() => setView("form")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200"
            >
              <IconPlus className="w-5 h-5" /> Přidat výlet
            </button>

            {trips && trips.length > 0 ? (
              <section className="flex flex-col gap-2.5">
                <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                  Výlety · {trips.length}
                </h2>
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => openDetail(trip)}
                  />
                ))}
              </section>
            ) : (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <IconMap className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">
                  Zatím žádné výlety.
                  <br />
                  Přidej první!
                </p>
              </div>
            )}
          </>
        )}

        {/* Form */}
        {view === "form" && (
          <TripForm
            initialData={editingTrip}
            onSave={editingTrip ? handleUpdate : handleSave}
            onCancel={() => {
              if (editingTrip) {
                setEditingTrip(null);
                setView("detail");
              } else setView("dashboard");
            }}
          />
        )}

        {/* Detail */}
        {view === "detail" && selectedTrip && (
          <TripDetail
            trip={selectedTrip}
            onClose={() => {
              setView("dashboard");
              setSelectedTrip(null);
            }}
            onDelete={handleDelete}
            onEdit={() => openEdit(selectedTrip)}
          />
        )}
      </main>
    </div>
  );
}
