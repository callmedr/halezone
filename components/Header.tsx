
import React from 'react';
import { LogIn, PlusCircle, LayoutGrid, Compass, BookOpen } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  isAdmin: boolean;
  view: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAdmin, view, onNavigate, onLogout }) => {
  const LOGO_IMAGE_URL = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/hale_logo.PNG"; 

  const TitleTag = (view === 'LIST' || view === 'MAIN') ? 'h1' : 'div';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-50/50 py-4 md:py-2.5 px-6 md:px-10 mb-0 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => onNavigate('MAIN')}
        >
          <div className="w-12 h-12 md:w-8 md:h-8 mr-3 md:mr-2 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-50 rounded-full opacity-40 group-hover:bg-lime-100 group-hover:scale-110 transition-all duration-300"></div>
            <img 
              src={LOGO_IMAGE_URL} 
              alt="Halezone Logo" 
              className="w-8 h-8 md:w-5 md:h-5 object-contain relative z-10"
            />
          </div>
          
          <div className="flex flex-col">
            <span className="text-emerald-600 text-[10px] md:text-[8px] font-black uppercase tracking-[0.25em] leading-none mb-0.5">Halezone</span>
            <TitleTag className="serif text-lg md:text-sm font-bold text-gray-800 leading-tight">숨결의 온도</TitleTag>
          </div>
        </div>
        
        <nav className="flex items-center space-x-1 md:space-x-0">
          <button 
            onClick={() => onNavigate('MAIN')}
            className={`p-3 md:p-2 rounded-full transition-all ${view === 'MAIN' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-700'}`}
            title="메인"
          >
            <LayoutGrid size={20} className="md:w-3.5 md:h-3.5" />
          </button>

          <button 
            onClick={() => onNavigate('LAB')}
            className={`p-3 md:p-2 rounded-full transition-all ${view === 'LAB' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-700'}`}
            title="연구소"
          >
            <Compass size={20} className="md:w-3.5 md:h-3.5" />
          </button>
          
          <button 
            onClick={() => onNavigate('LIST')}
            className={`p-3 md:p-2 rounded-full transition-all ${view === 'LIST' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-700'}`}
            title="아카이브"
          >
            <BookOpen size={20} className="md:w-3.5 md:h-3.5" />
          </button>

          {isAdmin ? (
            <>
              <button 
                onClick={() => onNavigate('WRITE')}
                className={`p-3 md:p-2 rounded-full transition-all ${view === 'WRITE' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-700'}`}
                title="글쓰기"
              >
                <PlusCircle size={20} className="md:w-3.5 md:h-3.5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => onNavigate('LOGIN')}
              className={`p-3 md:p-2 rounded-full transition-all ${view === 'LOGIN' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-800/40 hover:bg-emerald-50 hover:text-emerald-700'}`}
              title="관리자 로그인"
            >
              <LogIn size={20} className="md:w-3.5 md:h-3.5" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
