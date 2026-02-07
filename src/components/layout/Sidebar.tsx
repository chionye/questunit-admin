/** @format */

import { NavLink, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { navItems } from "@/constants";

export function Sidebar() {
  const { isOpen, close } = useSidebarStore();
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[260px] bg-sidebar-bg flex flex-col z-50 transition-transform duration-300",
          "max-md:-translate-x-full",
          isOpen && "max-md:translate-x-0",
        )}>
        {/* Header */}
        <div className='flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/8'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 bg-primary rounded-lg flex items-center justify-center font-bold text-lg text-white'>
              Q
            </div>
            <span className='text-xl font-bold text-white'>QuestUnit</span>
          </div>
          <button
            className='md:hidden flex items-center justify-center w-8 h-8 rounded-md bg-white/10 text-sidebar-text hover:bg-white/15 transition-colors cursor-pointer'
            onClick={close}
            type='button'>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-3 py-4 overflow-y-auto'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-[0.688rem] font-semibold uppercase tracking-wider text-white/35 px-3 mb-2'>
              Main Menu
            </span>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-text text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-white opacity-100"
                      : "opacity-70 hover:bg-white/8 hover:opacity-100",
                  )}
                  onClick={close}>
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className='px-3 py-4 border-t border-white/8'>
          <button
            className='flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sidebar-text text-sm font-medium opacity-70 hover:bg-red-500/15 hover:text-red-400 hover:opacity-100 transition-all cursor-pointer'
            onClick={logout}
            type='button'>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
