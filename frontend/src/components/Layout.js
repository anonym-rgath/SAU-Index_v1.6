import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <TopBar />
      
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;