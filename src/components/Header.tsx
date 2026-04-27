export function Header() {
  return (
    <header className="bg-navy-950 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-medium leading-tight">
            Sofia SDR · Painel de ligações
          </h1>
          <span className="text-[10px] sm:text-xs text-navy-300 uppercase tracking-widest">
            Visão Investimentos
          </span>
        </div>
      </div>
    </header>
  );
}
