export function MenuCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-2xs space-y-3 animate-pulse">
      <div className="space-y-3">
        {/* Shimmer Image Box */}
        <div className="h-28 sm:h-36 rounded-xl bg-slate-200/80 w-full" />
        
        {/* Shimmer Title */}
        <div className="space-y-1.5 pt-1">
          <div className="h-4 bg-slate-200 rounded-md w-3/4" />
          <div className="h-2.5 bg-slate-100 rounded-md w-1/3" />
        </div>

        {/* Shimmer Description */}
        <div className="space-y-1">
          <div className="h-3 bg-slate-100 rounded-md w-full" />
          <div className="h-3 bg-slate-100 rounded-md w-2/3" />
        </div>
      </div>

      {/* Shimmer Price & Button Row */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="h-5 bg-slate-200 rounded-md w-16" />
        <div className="h-8 bg-slate-200 rounded-xl w-20" />
      </div>
    </div>
  );
}

export function MenuGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MenuCardSkeleton key={i} />
      ))}
    </div>
  );
}
