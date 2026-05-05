import { formatDate } from "../utils";
import { IconMap, IconCompass, IconUtensils } from "./Icons";

export default function RecommendationBox({ trips }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-neutral-800 dark:to-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white dark:bg-neutral-700 border border-slate-200 dark:border-neutral-600 flex items-center justify-center flex-shrink-0">
          <IconMap className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Přidej první výlet a dostaneš tipy na příští!
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mb-2 px-1">
        Tipy na příští výlet
      </p>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {trips.map((trip, i) => (
          <div
            key={trip.id}
            className={`flex-shrink-0 w-56 rounded-2xl p-4 flex flex-col gap-2 ${
              i === 0
                ? "bg-gradient-to-br from-emerald-600 to-emerald-800 text-white"
                : "bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 shadow-sm text-slate-800 dark:text-slate-100"
            }`}
          >
            {trip.imageData ? (
              <img
                src={trip.imageData}
                alt={trip.name}
                className="w-full h-28 rounded-xl object-cover"
              />
            ) : (
              <div
                className={`w-full h-20 rounded-xl flex items-center justify-center ${i === 0 ? "bg-white/20" : "bg-emerald-50 dark:bg-emerald-900/40"}`}
              >
                <IconCompass
                  className={`w-8 h-8 ${i === 0 ? "text-white/70" : "text-emerald-400"}`}
                />
              </div>
            )}
            <div className="min-w-0">
              <p
                className={`font-bold text-sm truncate ${i === 0 ? "text-white" : "text-slate-800 dark:text-slate-100"}`}
              >
                {trip.name}
              </p>
              <p
                className={`text-xs mt-0.5 ${i === 0 ? "text-emerald-200" : "text-slate-400 dark:text-slate-500"}`}
              >
                {formatDate(trip.date)}
              </p>
              {trip.restaurant && (
                <p
                  className={`text-xs mt-1 flex items-center gap-1 truncate ${i === 0 ? "text-emerald-100" : "text-orange-400"}`}
                >
                  <IconUtensils className="w-3 h-3 flex-shrink-0" />{" "}
                  {trip.restaurant}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
