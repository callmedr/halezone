
import React from 'react';
import { LogIn, PlusCircle, Home } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, onNavigate, onLogout }) => {
  const LOGO_IMAGE_URL = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/hale_logo.PNG"; 

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-50/50 py-5 md:py-2.5 px-6 md:px-10 mb-6 md:mb-6 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => onNavigate('LIST')}
        >
          <div className="w-14 h-14 md:w-8 md:h-8 mr-3.5 md:mr-2 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-50 rounded-full opacity-40 group-hover:bg-lime-100 group-hover:scale-110 transition-all duration-300"></div>
            <img 
              src={LOGO_IMAGE_URL} 
              alt="Halezone Logo" 
              className="w-9 h-9 md:w-5 md:h-5 object-contain relative z-10"
            />
          </div>
          
          <div className="flex flex-col">
            <span className="text-emerald-600 text-[10px] md:text-[8px] font-black uppercase tracking-[0.25em] leading-none mb-1 md:mb-0.5">Halezone</span>
            <h1 className="serif text-xl md:text-sm font-bold text-gray-800 leading-tight">숨결의 온도</h1>
          </div>
        </div>
        
        <nav className="flex items-center space-x-0.5 md:space-x-0">
          <button 
            onClick={() => onNavigate('LIST')}
            className="p-3.5 md:p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-800/40 hover:text-emerald-700"
            title="홈"
          >
            <Home size={22} className="md:w-3.5 md:h-3.5" />
          </button>

          {isAdmin ? (
            <>
              <button 
                onClick={() => onNavigate('WRITE')}
                className="p-3.5 md:p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-800/40 hover:text-emerald-700"
                title="글쓰기"
              >
                <PlusCircle size={22} className="md:w-3.5 md:h-3.5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => onNavigate('LOGIN')}
              className="p-3.5 md:p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-100 hover:text-emerald-400"
              title="관리자 로그인"
            >
              <LogIn size={22} className="md:w-3.5 md:h-3.5" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
