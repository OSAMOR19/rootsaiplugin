import { Skeleton } from "@/components/ui/skeleton"

export default function FavoritesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

