'use client'; 

import { List, Map as MapIcon } from 'lucide-react';

interface NavbarProps {
  view: 'list' | 'map';
  setView: (view: 'list' | 'map') => void;
}

export default function Navbar({ view, setView }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 h-16 flex items-center px-6 justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">
          EventMap
        </span>
      </div>

      {/* View Toggle */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'list' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={18} />
          <span>List</span>
        </button>
        <button
          onClick={() => setView('map')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'map' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapIcon size={18} />
          <span>Map</span>
        </button>
      </div>

      {/* Placeholder for User Profile */}
      <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-300"></div>
    </nav>
  );
}