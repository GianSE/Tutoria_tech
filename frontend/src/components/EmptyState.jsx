export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-4">
          <Icon size={24} className="text-slate-600" />
        </div>
      )}
      <h3 className="text-slate-300 font-semibold text-sm mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 text-xs max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-5 text-sm px-5 py-2.5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
