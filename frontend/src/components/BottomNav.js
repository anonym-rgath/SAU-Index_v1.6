import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Users, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fines', icon: Receipt, label: 'Strafen' },
    { path: '/members', icon: Users, label: 'Mitglieder' },
    { path: '/fine-types', icon: Tag, label: 'Katalog' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex justify-around items-center z-50 safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <button
            key={item.path}
            data-testid={`bottom-nav-${item.path.slice(1)}`}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[60px] h-full transition-colors",
              isActive
                ? "text-emerald-700"
                : "text-stone-400 active:text-stone-600"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
            <span className={cn("text-xs", isActive && "font-semibold")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;