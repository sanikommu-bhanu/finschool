import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl3" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl3" />
        <Skeleton className="h-24 rounded-xl3" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl3" />
    </div>
  );
}
