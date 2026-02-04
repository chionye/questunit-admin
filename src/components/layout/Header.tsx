import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const toggle = useSidebarStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex items-center justify-between mb-7 gap-4">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white text-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
          onClick={toggle}
          type="button"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-2xl max-md:text-xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="w-[38px] h-[38px] rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
