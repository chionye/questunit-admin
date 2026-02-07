/** @format */

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/endpoints";
import { extractData } from "@/hooks/useApiData";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardOverview } from "@/types";
import { statCards } from "@/constants";
import { DashboardSkeletonLoader } from "@/components/skeletons/DashboardSkeletonLoader";

export function DashboardPage() {
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.getOverview,
  });

  const overview: DashboardOverview | undefined = response
    ? extractData(response)
    : undefined;

  const counts = overview?.counts;
  const recentUsers = overview?.recentActivities?.users;
  const recentServices = overview?.recentActivities?.services;

  return (
    <div>
      <Header title='Dashboard' subtitle='Overview of your admin panel' />

      {isLoading ? (
        <DashboardSkeletonLoader />
      ) : error ? (
        <Card className='p-8 text-center'>
          <p className='text-red-500'>Failed to load dashboard data</p>
          <p className='text-gray-400 text-sm mt-1'>
            Please check your connection and try again
          </p>
        </Card>
      ) : (
        <div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8'>
            {statCards.map((stat) => {
              const value = counts?.[stat.key as keyof typeof counts] ?? "—";

              return (
                <Card
                  key={stat.key}
                  className='hover:shadow-md transition-shadow'>
                  <CardContent className='pt-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <span className='text-sm font-medium text-gray-500'>
                        {stat.label}
                      </span>
                      <div
                        className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon size={20} className='text-white' />
                      </div>
                    </div>
                    <p className='text-2xl font-bold text-gray-900'>
                      {typeof value === "number"
                        ? value.toLocaleString()
                        : String(value)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {recentUsers && recentUsers.length > 0 && (
              <Card>
                <CardContent className='pt-6'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                    Recent Users
                  </h2>
                  <div className='divide-y divide-gray-100'>
                    {recentUsers.map((user) => {
                      const name = user.UserProfile
                        ? `${user.UserProfile.firstName} ${user.UserProfile.lastName}`.trim()
                        : user.email;

                      return (
                        <div
                          key={user.id}
                          className='py-3 flex items-center justify-between'>
                          <div>
                            <p className='text-sm font-medium text-gray-900'>
                              {name}
                            </p>
                            <p className='text-xs text-gray-400 mt-0.5'>
                              {user.email} &middot;{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className='flex gap-2'>
                            <Badge variant='secondary'>{user.role}</Badge>
                            <Badge
                              variant={
                                user.status === "active" ? "success" : "warning"
                              }>
                              {user.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {recentServices && recentServices.length > 0 && (
              <Card>
                <CardContent className='pt-6'>
                  <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                    Recent Services
                  </h2>
                  <div className='divide-y divide-gray-100'>
                    {recentServices.map((service) => (
                      <div
                        key={service.id}
                        className='py-3 flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {service.name}
                          </p>
                          <p className='text-xs text-gray-400 mt-0.5'>
                            {service.category} &middot;{" "}
                            {new Date(service.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            service.status === "active" ? "success" : "warning"
                          }>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
