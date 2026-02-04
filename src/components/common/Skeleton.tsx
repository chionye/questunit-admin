import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton-shimmer rounded-md', className)} />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div
        className="grid gap-4 p-4 border-b-2 border-gray-200"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3.5 w-4/5" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`r-${rowIdx}`}
          className="grid gap-4 p-4 border-b border-gray-100"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`c-${colIdx}`} className="h-4 w-3/4" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <Skeleton className="h-3.5 w-2/5 mb-3" />
      <Skeleton className="h-8 w-3/5 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="p-5">
          <Skeleton className="h-5 w-48" />
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
}
