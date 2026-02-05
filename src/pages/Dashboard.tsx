import { useQuery } from '@tanstack/react-query';
import { Users, Box, Wrench, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { extractData } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { DashboardOverview } from '@/types';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'bg-blue-500' },
  { key: 'totalRenderers', label: 'Total Renderers', icon: TrendingUp, color: 'bg-primary' },
  { key: 'pendingRenderers', label: 'Pending Renderers', icon: Clock, color: 'bg-amber-500' },
  { key: 'totalServices', label: 'Total Services', icon: Box, color: 'bg-purple-500' },
  { key: 'totalBookings', label: 'Total Bookings', icon: Wrench, color: 'bg-indigo-500' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'bg-emerald-500' },
];

function DashboardSkeletonLoader() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-40 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getOverview,
  });

  const overview: DashboardOverview | undefined = response ? extractData(response) : undefined;

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your admin panel" />

      {isLoading ? (
        <DashboardSkeletonLoader />
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-red-500">Failed to load dashboard data</p>
          <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {statCards.map((stat) => {
              const value = overview?.[stat.key as keyof DashboardOverview];
              const displayValue =
                stat.key === 'totalRevenue' && typeof value === 'number'
                  ? `$${value.toLocaleString()}`
                  : typeof value === 'number'
                    ? value.toLocaleString()
                    : value ?? '—';

              return (
                <Card key={stat.key} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                      <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon size={20} className="text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{String(displayValue)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {overview?.recentActivity && Array.isArray(overview.recentActivity) && overview.recentActivity.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="divide-y divide-gray-100">
                  {overview.recentActivity.map((activity, idx) => (
                    <div key={activity.id || idx} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.message || activity.type}</p>
                        {activity.createdAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{activity.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
