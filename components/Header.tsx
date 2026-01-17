
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-50 py-3 px-6 mb-8 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => onNavigate('LIST')}
        >
          {/* 로고 영역: 에메랄드와 연두색 포인트 */}
          <div className="w-14 h-14 mr-3 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-50 rounded-full opacity-40 group-hover:bg-lime-100 group-hover:scale-110 transition-all duration-300"></div>
            <img 
              src={LOGO_IMAGE_URL} 
              alt="Halezone Logo" 
              className="w-12 h-12 object-contain relative z-10"
            />
          </div>
          
          <div className="flex flex-col">
            <span className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1">Halezone</span>
            <h1 className="serif text-lg font-bold text-gray-800 leading-tight">숨결의 온도</h1>
          </div>
        </div>
        
        <nav className="flex items-center space-x-1">
          <button 
            onClick={() => onNavigate('LIST')}
            className="p-2.5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-700/60 hover:text-emerald-700"
            title="홈"
          >
            <Home size={20} />
          </button>

          {isAdmin ? (
            <>
              <button 
                onClick={() => onNavigate('WRITE')}
                className="p-2.5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-700/60 hover:text-emerald-700"
                title="글쓰기"
              >
                <PlusCircle size={20} />
              </button>
              <div className="h-4 w-[1px] bg-emerald-100 mx-2"></div>
              <button 
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
              >
                <LogOut size={14} />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => onNavigate('LOGIN')}
              className="p-2.5 hover:bg-emerald-50 rounded-full transition-colors text-emerald-200 hover:text-emerald-400"
              title="관리자 로그인"
            >
              <LogIn size={20} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
