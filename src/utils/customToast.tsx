import React from "react";
import toast from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastContentOptions {
  title: string;
  description?: string;
}

export const showSuccessToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible
          ? "animate-in fade-in slide-in-from-top-2 duration-300"
          : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.04)] rounded-xl pointer-events-auto flex items-start p-3.5 gap-3`}
    >
      <div className="shrink-0 mt-0.5 text-emerald-600">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-normal">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 -mr-1 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ));
};

export const showErrorToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible
          ? "animate-in fade-in slide-in-from-top-2 duration-300"
          : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.04)] rounded-xl pointer-events-auto flex items-start p-3.5 gap-3`}
    >
      <div className="shrink-0 mt-0.5 text-rose-600">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-normal">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 -mr-1 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ));
};

export const showInfoToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible
          ? "animate-in fade-in slide-in-from-top-2 duration-300"
          : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-blue-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_8px_10px_-6px_rgba(0,0,0,0.04)] rounded-xl pointer-events-auto flex items-start p-3.5 gap-3`}
    >
      <div className="shrink-0 mt-0.5 text-blue-600">
        <Info className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-normal">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 -mr-1 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ));
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
};
