/** @format */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeletonLoader() {
  return (
    <div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-10 rounded-lg' />
              </div>
              <Skeleton className='h-8 w-20' />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className='pt-6'>
          <Skeleton className='h-5 w-40 mb-4' />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between py-3'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-6 w-16 rounded-full' />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
