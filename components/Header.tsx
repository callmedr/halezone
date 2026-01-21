
import React from 'react';
import { LogIn, LogOut, PlusCircle, Home } from 'lucide-react';
import { supabase } from '../supabase';

interface HeaderProps {
  isAdmin: boolean;
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, onNavigate, onLogout }) => {
  const LOGO_IMAGE_URL = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/hale_logo.PNG"; 

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-50/50 py-6 md:py-8 px-6 md:px-10 mb-8 md:mb-14 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => onNavigate('LIST')}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 mr-4 md:mr-6 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-50 rounded-full opacity-40 group-hover:bg-lime-100 group-hover:scale-110 transition-all duration-300"></div>
            <img 
              src={LOGO_IMAGE_URL} 
              alt="Halezone Logo" 
              className="w-12 h-12 md:w-16 md:h-16 object-contain relative z-10"
            />
          </div>
          
          <div className="flex flex-col">
            <span className="text-emerald-600 text-[12px] md:text-[14px] font-black uppercase tracking-[0.25em] leading-none mb-2">Halezone</span>
            <h1 className="serif text-2xl md:text-3xl font-bold text-gray-800 leading-tight">숨결의 온도</h1>
          </div>
        </div>
        
        <nav className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={() => onNavigate('LIST')}
            className="p-3.5 md:p-5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-800/40 hover:text-emerald-700"
            title="홈"
          >
            <Home size={26} className="md:w-8 md:h-8" />
          </button>

          {isAdmin ? (
            <>
              <button 
                onClick={() => onNavigate('WRITE')}
                className="p-3.5 md:p-5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-800/40 hover:text-emerald-700"
                title="글쓰기"
              >
                <PlusCircle size={26} className="md:w-8 md:h-8" />
              </button>
              <div className="h-6 w-[1.5px] bg-emerald-100 mx-2 md:mx-4"></div>
              <button 
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 md:px-6 py-3 text-[12px] md:text-[14px] font-black tracking-tighter text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-colors border border-emerald-100/50 uppercase shadow-sm"
              >
                <LogOut size={16} className="md:w-5 md:h-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => onNavigate('LOGIN')}
              className="p-3.5 md:p-5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-100 hover:text-emerald-400"
              title="관리자 로그인"
            >
              <LogIn size={26} className="md:w-8 md:h-8" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
