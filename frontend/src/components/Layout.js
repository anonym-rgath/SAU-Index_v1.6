import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LayoutDashboard, Users, Tag, Receipt, LogOut, Target } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fines', icon: Receipt, label: 'Strafen' },
    { path: '/members', icon: Users, label: 'Mitglieder' },
    { path: '/fine-types', icon: Tag, label: 'Strafenarten' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Target className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-stone-900">Schützenzug</h2>
              <p className="text-xs text-stone-500">Manager</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <button
                    data-testid={`nav-${item.path.slice(1)}`}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-stone-200">
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full h-11 rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;