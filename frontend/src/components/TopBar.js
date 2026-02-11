import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Target, LogOut } from 'lucide-react';
import { Button } from './ui/button';

const TopBar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100 h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-100 p-1.5 rounded-lg">
          <Target className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="hidden sm:block">
          <h2 className="font-bold text-base text-stone-900 leading-none">Schützenzug</h2>
          <p className="text-xs text-stone-500 leading-none">Manager</p>
        </div>
      </div>
      
      <Button
        data-testid="topbar-logout-button"
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="h-9 px-3 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full"
      >
        <LogOut className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Abmelden</span>
      </Button>
    </header>
  );
};

export default TopBar;