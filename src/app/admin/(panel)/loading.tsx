// Per-page Suspense boundary so navigating between admin pages streams instantly.
export default function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-200" />)}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
    </div>
  );
}
