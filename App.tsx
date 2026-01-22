
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, ADMIN_EMAIL, STORAGE_BUCKET } from './supabase';
import { Post, ViewState } from './types';
import Header from './components/Header';
import PostCard from './components/PostCard';
import { 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Send, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Quote,
  Minus,
  Highlighter,
  Heading2,
  Leaf,
  Search,
  Users,
  LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // 방문 기록 남기기 (접속 시 1회)
  useEffect(() => {
    const recordVisit = async () => {
      try {
        await supabase.from('visitor_logs').insert([{}]);
      } catch (e) {
        console.error('Visit recording failed', e);
      }
    };
    recordVisit();
  }, []);

  // 관리자일 경우 방문자 수 가져오기
  const fetchVisitorCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error: countError } = await supabase
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      
      if (countError) throw countError;
      setVisitorCount(count);
    } catch (e) {
      console.error('Failed to fetch visitor count', e);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchVisitorCount();
    }
  }, [isAdmin, fetchVisitorCount]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('blog')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('LIST');
    setVisitorCount(null);
    setToast({ message: '로그아웃 되었습니다.', type: 'success' });
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setView('DETAIL');
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setView('LIST');
    window.scrollTo(0, 0);
  };

  const executeDelete = async () => {
    if (!selectedPost) return;
    setLoading(true);
    setShowDeleteModal(false);
    try {
      const { error: delError, status } = await supabase
        .from('blog')
        .delete()
        .eq('id', selectedPost.id);
      if (delError) throw delError;
      if (status >= 200 && status < 300) {
        setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
        setSelectedPost(null);
        setView('LIST');
        setToast({ message: '기록이 삭제되었습니다.', type: 'success' });
      } else {
        throw new Error(`삭제 실패 (상태: ${status})`);
      }
    } catch (err: any) {
      setToast({ message: `삭제 실패: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderStyledContent = (content: string, imageUrl: string | null) => {
    const ImageComponent = () => imageUrl ? (
      <div className="relative group my-10 md:my-8 animate-in fade-in zoom-in duration-1000">
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-100/30 to-lime-100/30 rounded-[2rem] blur-2xl opacity-50"></div>
        <img src={imageUrl} className="relative w-full rounded-[2rem] md:rounded-lg shadow-md border border-emerald-50 object-cover max-h-[450px] md:max-h-[550px]" alt="Post content" />
      </div>
    ) : null;

    const parts = content.split(/(\[IMAGE\]|\[HR\]|\[QUOTE\].*?\[\/QUOTE\]|\[HL\].*?\[\/HL\]|\[SUB\].*?\[\/SUB\])/gs);

    return (
      <div className="serif text-[1.1rem] md:text-[0.9rem] leading-[1.8] md:leading-[1.65] text-gray-700 space-y-7 md:space-y-4">
        {parts.map((part, index) => {
          if (part === '[IMAGE]') return <ImageComponent key={index} />;
          if (part === '[HR]') {
            return (
              <div key={index} className="relative flex items-center justify-center my-14 md:my-8 py-5 md:py-2.5 overflow-hidden">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
                </div>
                <div className="relative bg-white px-6">
                  <Leaf size={24} className="text-emerald-400 fill-emerald-50 transform -rotate-12 md:w-3.5 md:h-3.5" />
                </div>
              </div>
            );
          }
          if (part.startsWith('[QUOTE]')) {
            const text = part.replace(/\[\/?QUOTE\]/g, '');
            return <blockquote key={index} className="my-10 md:my-5 pl-7 md:pl-4 pr-5 md:pr-2.5 py-8 md:py-4 bg-emerald-50/40 border-l-[6px] md:border-l-[2px] border-emerald-300 rounded-r-[2rem] md:rounded-r-md italic text-emerald-900/80 whitespace-pre-wrap text-base md:text-sm leading-relaxed">{text}</blockquote>;
          }
          if (part.startsWith('[HL]')) {
            const text = part.replace(/\[\/?HL\]/g, '');
            return <mark key={index} className="bg-emerald-100/60 text-emerald-900 px-1.5 rounded-sm whitespace-pre-wrap">{text}</mark>;
          }
          if (part.startsWith('[SUB]')) {
            const text = part.replace(/\[\/?SUB\]/g, '');
            return <h3 key={index} className="text-xl md:text-lg font-bold text-gray-900 mt-14 md:mt-6 mb-6 md:mb-3 pt-8 md:pt-3 border-t-2 border-emerald-50 whitespace-pre-wrap leading-tight">{text}</h3>;
          }
          return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        })}
        {!content.includes('[IMAGE]') && imageUrl && <ImageComponent />}
      </div>
    );
  };

  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const cleanContent = post.content.replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '').toLowerCase();
    const lowerTitle = post.title.toLowerCase();
    return lowerTitle.includes(lowerQuery) || cleanContent.includes(lowerQuery);
  });

  const renderContent = () => {
    if (loading && view === 'LIST' && posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-48 md:py-24">
          <Loader2 className="animate-spin text-emerald-200 mb-8" size={56} />
          <p className="text-gray-300 text-lg md:text-[10px] tracking-[0.4em] uppercase font-black">Resonating...</p>
        </div>
      );
    }

    if (view === 'LIST') {
      return (
        <div className="animate-in fade-in duration-1000">
          <div className="max-w-xl mx-auto mb-14 md:mb-12 relative group px-4">
            <div className="absolute inset-0 bg-emerald-100/20 blur-[3.5rem] md:blur-[2rem] rounded-full group-focus-within:bg-emerald-200/50 transition-all duration-500"></div>
            <div className="relative flex items-center bg-white border border-emerald-50 rounded-[2rem] md:rounded-lg px-7 py-5 md:px-3.5 md:py-2 shadow-lg focus-within:shadow-xl focus-within:border-emerald-300 transition-all duration-300">
              <Search size={24} className="text-emerald-400 mr-5 md:mr-2 shrink-0 md:w-3.5 md:h-3.5" />
              <input 
                type="text" 
                placeholder="어떤 숨결을 찾으시나요?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-300 text-base md:text-[11px] font-light"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-2 md:p-0.5 text-emerald-200 hover:text-emerald-500 transition-colors">
                  <X size={20} className="md:w-3 md:h-3" />
                </button>
              )}
            </div>

            {/* 관리자 로그아웃 버튼 (검색바 바로 아래) */}
            {isAdmin && (
              <div className="mt-5 md:mt-3 flex justify-center animate-in slide-in-from-top-2 fade-in duration-500">
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-5 py-2 md:px-3 md:py-1 text-[12px] md:text-[9px] font-black tracking-tighter text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all border border-transparent hover:border-emerald-100/50 uppercase"
                >
                  <LogOut size={14} className="md:w-3 md:h-3" />
                  <span>Admin Logout</span>
                </button>
              </div>
            )}

            {/* 관리자 전용 방문자 수 표시 (로그아웃 버튼 아래) */}
            {isAdmin && visitorCount !== null && (
              <div className="mt-4 md:mt-2 flex justify-center animate-in slide-in-from-top-2 fade-in duration-700">
                <div className="flex items-center space-x-2.5 md:space-x-1.5 px-6 py-2.5 md:px-3 md:py-1 bg-emerald-50/40 rounded-full border border-emerald-100/30 shadow-sm">
                  <Users size={16} className="text-emerald-400 md:w-3 md:h-3" />
                  <span className="serif text-[12px] md:text-[9px] font-bold text-emerald-800 tracking-tight">
                    오늘의 숨결: <span className="text-emerald-500">{visitorCount}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 md:gap-x-8 gap-y-16 md:gap-y-8">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onClick={handlePostClick} />
              ))}
            </div>
          ) : (
            <div className="py-28 text-center animate-in fade-in slide-in-from-top-4">
              <div className="w-24 h-24 md:w-14 md:h-14 bg-emerald-50/50 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-5">
                <Search size={32} className="text-emerald-200 md:w-5 md:h-5" />
              </div>
              <p className="serif italic text-gray-400 mb-12 md:mb-6 text-lg md:text-xs px-10 leading-relaxed">
                {searchQuery ? `"${searchQuery}"에 대한 흔적이 보이지 않습니다.` : '아직 들려드리지 못한 이야기가 많습니다.'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="px-12 py-5 md:px-5 md:py-2.5 bg-emerald-900 text-white rounded-[1.5rem] md:rounded-md text-[13px] md:text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl shadow-emerald-100 uppercase">
                  View All Records
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    if (view === 'DETAIL' && selectedPost) {
      return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 px-6 md:px-0">
          <div className="flex items-center justify-between mb-14 md:mb-8">
            <button 
              onClick={handleBackToList} 
              className="flex items-center bg-emerald-50/60 hover:bg-emerald-100/80 border-2 border-emerald-100/50 px-7 py-5 md:px-4 md:py-2.5 rounded-[1.5rem] md:rounded-md transition-all duration-500 text-emerald-800 font-black text-[13px] md:text-[9px] tracking-widest uppercase group shadow-md hover:shadow-xl"
            >
              <ArrowLeft size={20} className="mr-3.5 md:mr-1.5 group-hover:-translate-x-1.5 transition-transform md:w-3 md:h-3" />
              <span>Back to List</span>
            </button>
            {isAdmin && (
              <div className="flex space-x-2.5 md:space-x-1">
                <button onClick={() => setView('EDIT')} className="p-3.5 md:p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-2xl md:rounded-md transition-colors"><Edit size={24} className="md:w-3.5 md:h-3.5" /></button>
                <button onClick={() => setShowDeleteModal(true)} className="p-3.5 md:p-1.5 text-red-400 hover:bg-red-50 rounded-2xl md:rounded-md transition-colors"><Trash2 size={24} className="md:w-3.5 md:h-3.5" /></button>
              </div>
            )}
          </div>
          
          <div className="mb-4 md:mb-2"><span className="text-[12px] md:text-[9px] font-black tracking-[0.5em] text-emerald-500 uppercase">Daily Insight</span></div>
          <h2 className="serif text-2xl md:text-xl font-bold text-gray-900 mb-10 md:mb-5 leading-[1.15]">{selectedPost.title}</h2>
          <div className="text-gray-400 text-sm md:text-[10px] mb-14 md:mb-8 flex items-center justify-between border-b md:border-b-0.5 border-emerald-50/50 pb-8 md:pb-4">
            <div className="flex items-center space-x-5 md:space-x-2">
              <span className="font-black text-gray-900 uppercase tracking-tighter">Dr. Halezone</span>
              <span className="w-1.5 h-1.5 md:w-0.5 md:h-0.5 bg-emerald-100 rounded-full"></span>
              <span>{new Date(selectedPost.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          {renderStyledContent(selectedPost.content, selectedPost.image_url)}

          <div className="mt-24 md:mt-16 pt-16 md:pt-10 border-t md:border-t-0.5 border-emerald-50 flex flex-col items-center">
            <div className="mb-10 md:mb-5 text-center">
              <Leaf size={28} className="text-emerald-100 mx-auto mb-5 md:mb-2 md:w-4 md:h-4" />
              <p className="serif italic text-gray-400 text-base md:text-[10px]">기록의 끝에서 다시 처음으로</p>
            </div>
            <button 
              onClick={handleBackToList} 
              className="flex items-center bg-emerald-900 hover:bg-black text-white px-14 py-6 md:px-6 md:py-3.5 rounded-[3rem] md:rounded-lg transition-all duration-500 font-black text-[13px] md:text-[10px] tracking-[0.25em] uppercase group shadow-[0_25px_50px_-12px_rgba(6,78,59,0.3)] hover:scale-105"
            >
              <ArrowLeft size={22} className="mr-4 md:mr-2 group-hover:-translate-x-2 transition-transform md:w-3.5 md:h-3.5" />
              <span>Back to Journal List</span>
            </button>
          </div>
        </div>
      );
    }

    if (view === 'LOGIN') return <LoginForm onLoginSuccess={() => setView('LIST')} />;
    if (view === 'WRITE' || view === 'EDIT') {
      return (
        <PostForm 
          post={view === 'EDIT' ? selectedPost : null} 
          onSuccess={() => { fetchPosts(); setView('LIST'); }}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
          onCancel={() => setView(view === 'EDIT' ? 'DETAIL' : 'LIST')}
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-40 bg-white relative overflow-x-hidden">
      <Header isAdmin={isAdmin} onNavigate={setView} onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto px-8 md:px-12">
        {error && <div className="mb-10 p-7 md:p-4 bg-red-50 text-red-600 rounded-[1.5rem] md:rounded-lg flex items-center text-base md:text-xs border border-red-100"><AlertCircle size={24} className="mr-3.5 md:mr-2 md:w-3.5 md:h-3.5" />{error}</div>}
        {renderContent()}
      </main>
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-emerald-950/30 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] md:rounded-xl p-12 md:p-6 max-w-md w-full shadow-2xl border border-emerald-50 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 md:w-12 md:h-12 bg-red-50 rounded-[2rem] md:rounded-lg flex items-center justify-center mx-auto mb-8 md:mb-4"><Trash2 className="text-red-400 md:w-6 md:h-6" size={32} /></div>
            <h3 className="serif text-2xl md:text-lg font-bold text-gray-900 mb-4 md:mb-2">기록을 삭제하시겠습니까?</h3>
            <p className="text-gray-400 text-base md:text-xs leading-relaxed mb-12 md:mb-6">한 번 지워진 숨결은 다시 되돌릴 수 없습니다.</p>
            <div className="flex space-x-3.5 md:space-x-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-6 md:py-3 rounded-[1.5rem] md:rounded-md font-black text-gray-400 hover:bg-gray-50 transition-colors text-base md:text-[10px] uppercase">취소</button>
              <button onClick={executeDelete} className="flex-1 py-6 md:py-3 rounded-[1.5rem] md:rounded-md font-black bg-red-500 text-white hover:bg-red-600 shadow-2xl shadow-red-100 transition-all text-base md:text-[10px] uppercase">삭제하기</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-10 fade-in duration-500 w-[calc(100%-4rem)] max-w-sm">
          <div className={`flex items-center justify-center space-x-4 md:space-x-2.5 px-8 py-6 md:px-5 md:py-3 rounded-[1.5rem] md:rounded-lg shadow-2xl border-2 ${toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={24} className="md:w-3.5 md:h-3.5" /> : <AlertCircle size={24} className="md:w-3.5 md:h-3.5" />}
            <span className="text-base md:text-xs font-black">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const PostForm: React.FC<{ post: Post | null, onSuccess: () => void, onError: (msg: string) => void, onCancel: () => void }> = ({ post, onSuccess, onError, onCancel }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [imageUrl, setImageUrl] = useState(post?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = useCallback((tag: string, isPair: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let newText = '';
    let newCursorPos = 0;

    if (isPair) {
      newText = `[${tag}]${selected}[/${tag}]`;
      newCursorPos = selected.length > 0 ? start + newText.length : start + tag.length + 2;
    } else {
      newText = `\n[${tag}]\n`;
      newCursorPos = start + newText.length;
    }
    
    setContent(before + newText + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); insertTag('SUB', true); break;
        case 'q': e.preventDefault(); insertTag('QUOTE', true); break;
        case 'h': e.preventDefault(); insertTag('HL', true); break;
        case 'i': e.preventDefault(); insertTag('IMAGE'); break;
        case 'l': e.preventDefault(); insertTag('HR'); break;
        case 's': e.preventDefault(); handleFormSubmit(); break;
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(`uploads/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(`uploads/${fileName}`);
      setImageUrl(data.publicUrl);
    } catch (err: any) {
      onError('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting || !title || !content) return;
    setSubmitting(true);
    try {
      const payload = { title, content, image_url: imageUrl };
      const { error } = post 
        ? await supabase.from('blog').update(payload).eq('id', post.id)
        : await supabase.from('blog').insert([payload]);
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      onError('기록 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 md:py-6 px-6 md:px-0">
      <div className="flex items-center justify-between mb-14 md:mb-8">
        <h2 className="serif text-3xl md:text-xl font-black text-gray-900">{post ? '숨결 수정' : '새로운 숨결'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-emerald-700 font-black transition-colors text-base md:text-[10px] py-3 md:py-1.5 px-6 md:px-3.5 bg-gray-50 rounded-[1.5rem] md:rounded-md uppercase tracking-widest">취소</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-14 md:space-y-8">
        <div className="space-y-4 md:space-y-1.5">
          <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1">Journal Title</label>
          <input type="text" className="w-full text-2xl md:text-lg font-bold border-b-2 md:border-b border-emerald-50 py-5 md:py-2.5 focus:outline-none focus:border-emerald-500 bg-transparent placeholder:text-gray-200 transition-colors" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="제목을 입력하세요" />
        </div>

        <div className="space-y-6 md:space-y-2.5">
          <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1">Main Visual</label>
          <div className="flex items-center space-x-8 md:space-x-5">
            {imageUrl && <img src={imageUrl} className="w-28 h-28 md:w-20 md:h-20 rounded-[2rem] md:rounded-lg object-cover border md:border-0.5 border-emerald-50 shadow-xl" />}
            <label className="flex-1 cursor-pointer group">
              <div className="w-full h-28 md:h-20 flex flex-col items-center justify-center border-2 md:border-1.5 border-dashed border-emerald-100 rounded-[2rem] md:rounded-lg bg-emerald-50/10 hover:bg-emerald-50/40 transition-all">
                {uploading ? <Loader2 className="animate-spin text-emerald-300 md:w-4 md:h-4" size={32} /> : <><ImageIcon className="text-emerald-300 mb-4 md:mb-1 md:w-5 md:h-5" size={32} /><span className="text-[12px] md:text-[9px] text-emerald-800 font-black uppercase tracking-[0.3em]">Image Upload</span></>}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="space-y-6 md:space-y-2.5">
          <div className="flex items-center justify-between border-b-2 md:border-b border-emerald-50 pb-6 md:pb-2 overflow-x-auto scrollbar-hide">
            <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1 shrink-0 mr-8 md:mr-3">Context</label>
            <div className="flex space-x-3.5 md:space-x-1">
              <button type="button" onClick={() => insertTag('IMAGE')} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md transition-colors" title="이미지"><ImageIcon size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('SUB', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md transition-colors" title="소제목"><Heading2 size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('QUOTE', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md transition-colors" title="인용구"><Quote size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('HL', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md transition-colors" title="형광펜"><Highlighter size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('HR')} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md transition-colors" title="구분선"><Minus size={24} className="md:w-3.5 md:h-3.5" /></button>
            </div>
          </div>
          <textarea 
            ref={textareaRef} 
            className="w-full h-[35rem] md:h-[22rem] focus:outline-none bg-transparent serif text-xl md:text-sm leading-relaxed placeholder:text-gray-200 resize-none" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            onKeyDown={handleKeyDown}
            required 
            placeholder="당신의 통찰을 자유롭게 남겨주세요..." 
          />
        </div>

        <button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-900 text-white py-7 md:py-4 rounded-[2.5rem] md:rounded-lg font-black hover:bg-black transition-all shadow-lg flex items-center justify-center space-x-5 md:space-x-2 text-lg md:text-sm uppercase tracking-[0.3em] group">
          {submitting ? <Loader2 className="animate-spin md:w-4 md:h-4" size={28} /> : <><Send size={24} className="group-hover:translate-x-1.5 group-hover:-translate-y-1 transition-transform md:w-3.5 md:h-3.5" /><span>Publish Record</span></>}
        </button>
      </form>
    </div>
  );
};

const LoginForm: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      alert('비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-40 md:py-24 text-center animate-in fade-in zoom-in duration-700 px-8 md:px-0">
      <div className="mb-12 md:mb-5"><span className="text-[12px] md:text-[9px] font-black tracking-[0.6em] text-emerald-500 uppercase">Administrator</span></div>
      <h2 className="serif text-4xl md:text-2xl font-bold mb-16 md:mb-8 text-gray-900 leading-tight">관리자님,<br/>반갑습니다.</h2>
      <form onSubmit={handleLogin} className="space-y-7 md:space-y-4">
        <input type="password" placeholder="비밀번호" className="w-full px-8 py-7 md:px-4 md:py-3 rounded-[1.5rem] md:rounded-lg border-2 md:border border-emerald-50 bg-emerald-50/5 focus:outline-none focus:ring-6 md:focus:ring-4 focus:ring-emerald-100 transition-all text-center text-xl md:text-base tracking-tighter" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-7 md:py-3 rounded-[1.5rem] md:rounded-lg font-black hover:bg-black transition-all shadow-xl shadow-emerald-100 text-lg md:text-[9px] tracking-[0.3em] uppercase">
          {loading ? <Loader2 className="animate-spin mx-auto md:w-4 md:h-4" size={28} /> : 'Connect'}
        </button>
      </form>
    </div>
  );
};

export default App;
