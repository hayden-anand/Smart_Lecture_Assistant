
import React from 'react';
import { Icon } from './Icon';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-950/70 backdrop-blur-sm p-4 border-b border-slate-700/50 sticky top-0 z-10">
      <div className="container mx-auto flex items-center">
        <div className="bg-indigo-600 p-2 rounded-lg mr-4">
          <Icon name="logo" className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">
          Smart Lecture Assistant
        </h1>
      </div>
    </header>
  );
};

export default Header;
