import { useEffect, useState, useRef } from "react";
import { IconSave, IconX } from "./Icons";

const AUTO_DISMISS_MS = 9000;

export default function BackupNudge({ tripCount, onExport, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / AUTO_DISMISS_MS);
      setProgress(remaining * 100);
      if (elapsed < AUTO_DISMISS_MS) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onDismiss]);

  function handleExport() {
    cancelAnimationFrame(rafRef.current);
    onExport();
    onDismiss();
  }

  function handleDismiss() {
    cancelAnimationFrame(rafRef.current);
    onDismiss();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 animate-slide-up">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl shadow-slate-400/20 overflow-hidden border border-slate-100 dark:border-neutral-700">
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100 dark:bg-neutral-700">
          <div
            className="h-full bg-emerald-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 flex gap-4 items-start">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <IconSave className="w-5 h-5 text-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Nezapomeň na zálohu!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Výlety jsou uloženy{" "}
              <span className="font-medium text-slate-600">
                jen v tomto prohlížeči
              </span>
              . Smazání dat nebo změna zařízení = ztráta všeho. Záloha zabere
              jen pár sekund.
            </p>

            <div className="flex gap-2 mt-3.5">
              <button
                onClick={handleExport}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-xs font-semibold rounded-xl px-4 py-2 transition-all shadow-sm shadow-emerald-200"
              >
                ↓ Uložit zálohu ({tripCount})
              </button>
              <button
                onClick={handleDismiss}
                className="bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 active:scale-[0.97] text-slate-500 dark:text-slate-300 text-xs font-medium rounded-xl px-4 py-2 transition-all"
              >
                Teď ne
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-300 hover:text-slate-500 flex-shrink-0 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
