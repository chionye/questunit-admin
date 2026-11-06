import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { loginPath } from '@/lib/utils';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] max-md:ml-0 p-7 max-md:p-4 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
