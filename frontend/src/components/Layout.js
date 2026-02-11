import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <TopBar />
      
      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Layout;