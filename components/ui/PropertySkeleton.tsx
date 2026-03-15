// components/ui/PropertySkeleton.tsx
export default function PropertySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] rounded-xl bg-gray-200 mb-4" />
      <div className="flex justify-between mb-2">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-3 bg-gray-200 rounded w-28" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-14" />
        <div className="h-3 bg-gray-200 rounded w-14" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-24" />
    </div>
  );
}
