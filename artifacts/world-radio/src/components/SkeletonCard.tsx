

export function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl bg-card border border-border p-5 h-full animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-16 h-16 rounded-xl bg-muted" />
        <div className="w-8 h-8 rounded-full bg-muted" />
      </div>
      
      <div className="h-5 bg-muted rounded-md w-3/4 mb-2" />
      <div className="h-5 bg-muted rounded-md w-1/2 mb-4" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="w-1 h-1 rounded-full bg-muted" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <div className="h-6 w-16 bg-muted rounded-md" />
        <div className="h-6 w-20 bg-muted rounded-md" />
      </div>
    </div>
  );
}
