import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    bar: "bg-emerald-500",
    icon_class: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  error: {
    icon: XCircle,
    bar: "bg-red-500",
    icon_class: "text-red-400",
    border: "border-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    bar: "bg-amber-500",
    icon_class: "text-amber-400",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    bar: "bg-violet-500",
    icon_class: "text-violet-400",
    border: "border-violet-500/20",
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;
        const Icon = cfg.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-2xl
              bg-slate-900 border ${cfg.border} shadow-xl
              transition-all duration-300
              ${toast.exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-slide-up"}
            `}
          >
            <div className={`w-1 self-stretch rounded-full shrink-0 ${cfg.bar}`} />

            <Icon size={18} className={`${cfg.icon_class} shrink-0 mt-0.5`} />

            <p className="flex-1 text-sm text-slate-200 leading-snug">{toast.message}</p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
