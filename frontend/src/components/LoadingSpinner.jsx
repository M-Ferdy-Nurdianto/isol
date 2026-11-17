const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999] transition-opacity duration-150">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary">Memuat...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

