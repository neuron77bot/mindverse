/**
 * Page Loader - Loading indicator for lazy-loaded pages
 */
export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="icon-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
