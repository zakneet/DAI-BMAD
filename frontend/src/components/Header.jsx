export default function Header({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
            Clinical Workspace
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          Authenticated session
        </div>
      </div>
    </header>
  );
}