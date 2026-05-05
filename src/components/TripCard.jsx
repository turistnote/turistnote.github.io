import { formatDate } from "../utils";
import {
  IconMountain,
  IconMapPin,
  IconUtensils,
  IconChevronRight,
} from "./Icons";

export default function TripCard({ trip, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-neutral-800 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.99] transition-all flex gap-3.5 p-3.5 items-center border border-slate-100 dark:border-neutral-700"
    >
      {trip.imageData ? (
        <img
          src={trip.imageData}
          alt={trip.name}
          className="w-[68px] h-[68px] rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-[68px] h-[68px] rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-neutral-700 flex items-center justify-center flex-shrink-0">
          <IconMountain className="w-7 h-7 text-emerald-400" />
        </div>
      )}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
          {trip.name}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {formatDate(trip.date)}
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {trip.restaurant && (
            <span className="text-xs bg-orange-50 dark:bg-orange-950/50 text-orange-500 rounded-full px-2 py-0.5 flex items-center gap-1 truncate max-w-full">
              <IconUtensils className="w-3 h-3 flex-shrink-0" />{" "}
              {trip.restaurant}
            </span>
          )}
          {trip.lat != null && (
            <span className="text-xs bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 flex items-center gap-1">
              <IconMapPin className="w-3 h-3" /> GPS
            </span>
          )}
        </div>
      </div>
      <IconChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </button>
  );
}
