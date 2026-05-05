import { useState } from "react";
import TripMap from "./TripMap";
import { formatDate } from "../utils";
import {
  IconX,
  IconMountain,
  IconUtensils,
  IconMapPin,
  IconPencil,
} from "./Icons";

export default function TripDetail({ trip, onClose, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 overflow-hidden flex flex-col">
      {trip.imageData ? (
        <div className="relative">
          <img
            src={trip.imageData}
            alt={trip.name}
            className="w-full object-cover max-h-72"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 p-4">
            <h2 className="text-xl font-bold text-white drop-shadow">
              {trip.name}
            </h2>
            <p className="text-xs text-white/70 mt-0.5">
              {formatDate(trip.date)}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 pt-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
          <IconMountain className="w-8 h-8 text-white/60 mb-2" />
          <h2 className="text-xl font-bold text-white">{trip.name}</h2>
          <p className="text-xs text-white/70 mt-0.5">
            {formatDate(trip.date)}
          </p>
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {trip.restaurant && (
            <span className="text-sm bg-orange-50 dark:bg-orange-950/50 text-orange-500 rounded-full px-3 py-1 flex items-center gap-1.5">
              <IconUtensils className="w-3.5 h-3.5" /> {trip.restaurant}
            </span>
          )}
          {trip.lat != null && (
            <span className="text-sm bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full px-3 py-1 flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5" /> {trip.lat.toFixed(4)},{" "}
              {trip.lng.toFixed(4)}
            </span>
          )}
        </div>

        {trip.lat != null && trip.lng != null && (
          <TripMap lat={trip.lat} lng={trip.lng} small />
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-[0.97] rounded-xl px-4 py-2 transition-all"
          >
            <IconPencil className="w-4 h-4" /> Upravit
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Smazat výlet
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(trip.id)}
                className="bg-red-500 hover:bg-red-600 active:scale-[0.97] text-white text-xs font-medium rounded-xl px-3 py-1.5 transition-all"
              >
                Smazat
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-slate-300 text-xs font-medium rounded-xl px-3 py-1.5 transition-all hover:bg-slate-200 dark:hover:bg-neutral-600"
              >
                Zrušit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
