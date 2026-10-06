import React from "react";
import toast from "react-hot-toast";

export interface ToastContentOptions {
  title: string;
  description?: string;
}

export const showSuccessToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-in fade-in slide-in-from-top-2 duration-300" : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-[#f0fdf4] border border-[#bbf7d0] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] rounded-2xl pointer-events-auto flex items-start p-4 gap-3`}
    >
      <div className="shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-[#16a34a]" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#15803d] leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-[#166534] mt-0.5 leading-normal opacity-90">{description}</p>
        )}
      </div>
    </div>
  ));
};

export const showErrorToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-in fade-in slide-in-from-top-2 duration-300" : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-[#fff1f2] border border-[#fecdd3] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] rounded-2xl pointer-events-auto flex items-start p-4 gap-3`}
    >
      <div className="shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-[#e11d48]" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#9f1239] leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-[#9f1239] mt-0.5 leading-normal opacity-90">{description}</p>
        )}
      </div>
    </div>
  ));
};

export const showInfoToast = (title: string, description?: string) => {
  return toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-in fade-in slide-in-from-top-2 duration-300" : "animate-out fade-out slide-out-to-top-2 duration-200"
      } max-w-md w-full bg-[#eff6ff] border border-[#bfdbfe] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] rounded-2xl pointer-events-auto flex items-start p-4 gap-3`}
    >
      <div className="shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-[#2563eb]" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1e40af] leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-[#1e40af] mt-0.5 leading-normal opacity-90">{description}</p>
        )}
      </div>
    </div>
  ));
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
};
