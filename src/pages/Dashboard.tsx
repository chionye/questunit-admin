import { useQuery } from '@tanstack/react-query';
import { Users, Box, Wrench, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { extractData } from '@/hooks/useApiData';
import { Header } from '@/components/layout/Header';
import { DashboardSkeleton } from '@/components/common/Skeleton';
import type { DashboardOverview } from '@/types';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'bg-blue-500' },
  { key: 'totalRenderers', label: 'Total Renderers', icon: TrendingUp, color: 'bg-primary' },
  { key: 'pendingRenderers', label: 'Pending Renderers', icon: Clock, color: 'bg-amber-500' },
  { key: 'totalServices', label: 'Total Services', icon: Box, color: 'bg-purple-500' },
  { key: 'totalBookings', label: 'Total Bookings', icon: Wrench, color: 'bg-indigo-500' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'bg-emerald-500' },
];

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
        <DashboardSkeleton />
      ) : error ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-red-500">Failed to load dashboard data</p>
          <p className="text-gray-400 text-sm mt-1">Please check your connection and try again</p>
        </div>
      ) : (
        <div>
          {/* Stat Cards */}
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
                <div
                  key={stat.key}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                    <div
                      className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}
                    >
                      <stat.icon size={20} className="text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {String(displayValue)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          {overview?.recentActivity && Array.isArray(overview.recentActivity) && overview.recentActivity.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {overview.recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.message || activity.type}</p>
                      {activity.createdAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                      {activity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
