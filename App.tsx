
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
  Leaf
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
    setToast({ message: '로그아웃 되었습니다.', type: 'success' });
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setView('DETAIL');
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
      <div className="relative group my-12 animate-in fade-in zoom-in duration-1000">
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-100/30 to-lime-100/30 rounded-[2.5rem] blur-xl opacity-50"></div>
        <img src={imageUrl} className="relative w-full rounded-2xl shadow-sm border border-emerald-50 object-cover max-h-[700px]" alt="Post content" />
      </div>
    ) : null;

    const parts = content.split(/(\[IMAGE\]|\[HR\]|\[QUOTE\].*?\[\/QUOTE\]|\[HL\].*?\[\/HL\]|\[SUB\].*?\[\/SUB\])/gs);

    return (
      <div className="serif text-[1.15rem] leading-[1.8] text-gray-700 space-y-4">
        {parts.map((part, index) => {
          if (part === '[IMAGE]') return <ImageComponent key={index} />;
          if (part === '[HR]') {
            return (
              <div key={index} className="relative flex items-center justify-center my-16 py-4 overflow-hidden">
                {/* 1. 선명해진 그라데이션 라인 (emerald-300~400) */}
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
                </div>
                {/* 2. 중앙 잎사귀 심볼 포인트 */}
                <div className="relative bg-white px-6">
                  <div className="relative flex items-center justify-center">
                    {/* 심볼 뒤에 은은한 후광(glow) 효과 */}
                    <div className="absolute inset-0 bg-emerald-100 blur-md rounded-full opacity-40 animate-pulse"></div>
                    <Leaf size={18} className="text-emerald-500 fill-emerald-50 relative z-10 transform -rotate-12" />
                  </div>
                </div>
              </div>
            );
          }
          if (part.startsWith('[QUOTE]')) {
            const text = part.replace(/\[\/?QUOTE\]/g, '');
            return <blockquote key={index} className="my-10 pl-8 pr-6 py-6 bg-emerald-50/30 border-l-4 border-emerald-400 rounded-r-2xl italic text-emerald-900/80 whitespace-pre-wrap">{text}</blockquote>;
          }
          if (part.startsWith('[HL]')) {
            const text = part.replace(/\[\/?HL\]/g, '');
            return <mark key={index} className="bg-emerald-100/60 text-emerald-900 px-1 rounded-sm whitespace-pre-wrap">{text}</mark>;
          }
          if (part.startsWith('[SUB]')) {
            const text = part.replace(/\[\/?SUB\]/g, '');
            return <h3 key={index} className="text-2xl font-bold text-gray-900 mt-12 mb-4 pt-4 border-t border-gray-50 whitespace-pre-wrap">{text}</h3>;
          }
          return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        })}
        {!content.includes('[IMAGE]') && imageUrl && <ImageComponent />}
      </div>
    );
  };

  const renderContent = () => {
    if (loading && view === 'LIST') {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-emerald-300 mb-4" size={32} />
          <p className="text-gray-400 text-sm tracking-widest">기록의 조각을 맞추는 중...</p>
        </div>
      );
    }

    if (view === 'LIST') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 animate-in fade-in duration-1000">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} onClick={handlePostClick} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="serif italic text-gray-300">아직 들려드리지 못한 이야기가 많습니다.</p>
            </div>
          )}
        </div>
      );
    }

    if (view === 'DETAIL' && selectedPost) {
      return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32">
          <div className="flex items-center justify-between mb-12">
            <button onClick={() => setView('LIST')} className="flex items-center text-gray-400 hover:text-emerald-600 transition-colors font-medium text-sm group">
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>숨결의 목록</span>
            </button>
            {isAdmin && (
              <div className="flex space-x-1">
                <button onClick={() => setView('EDIT')} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><Edit size={18} /></button>
                <button onClick={() => setShowDeleteModal(true)} className="p-2.5 text-red-300 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>
            )}
          </div>
          <div className="mb-2"><span className="text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">Daily Journal</span></div>
          <h2 className="serif text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">{selectedPost.title}</h2>
          <div className="text-gray-400 text-xs mb-14 flex items-center justify-between border-b border-gray-50 pb-6">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-gray-900">Dr. Halezone</span>
              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
              <span>{new Date(selectedPost.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          {renderStyledContent(selectedPost.content, selectedPost.image_url)}
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
    <div className="min-h-screen pb-20 bg-white relative">
      <Header isAdmin={isAdmin} onNavigate={setView} onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto px-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center text-sm border border-red-100"><AlertCircle size={18} className="mr-2" />{error}</div>}
        {renderContent()}
      </main>
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-emerald-50 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-400" size={32} /></div>
            <h3 className="serif text-2xl font-bold text-gray-900 mb-3">기록을 지우시겠습니까?</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-10">지워진 숨결은 다시 되돌릴 수 없습니다.</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors">닫기</button>
              <button onClick={executeDelete} className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-100 transition-all">삭제</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-semibold">{toast.message}</span>
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
      newCursorPos = selected.length > 0 
        ? start + newText.length 
        : start + tag.length + 2;
    } else {
      newText = `\n[${tag}]\n`;
      newCursorPos = start + newText.length;
    }
    
    setContent(before + newText + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;
    
    if (isMod) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertTag('SUB', true);
          break;
        case 'q':
          e.preventDefault();
          insertTag('QUOTE', true);
          break;
        case 'h':
          e.preventDefault();
          insertTag('HL', true);
          break;
        case 'i':
          e.preventDefault();
          insertTag('IMAGE');
          break;
        case 'l':
          e.preventDefault();
          insertTag('HR');
          break;
        case 's':
          e.preventDefault();
          handleFormSubmit();
          break;
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
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex items-center justify-between mb-12">
        <h2 className="serif text-3xl font-bold text-gray-900">{post ? '숨결 수정' : '새로운 숨결'}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-emerald-700 font-bold transition-colors">취소</button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Title</label>
          <input type="text" className="w-full text-2xl font-bold border-b border-emerald-100 py-3 focus:outline-none focus:border-emerald-500 bg-transparent placeholder:text-gray-200" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="제목을 입력하세요" />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Visual</label>
          <div className="flex items-center space-x-6">
            {imageUrl && <img src={imageUrl} className="w-24 h-24 rounded-2xl object-cover border border-emerald-50" />}
            <label className="flex-1 cursor-pointer group">
              <div className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-3xl bg-emerald-50/20 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-all">
                {uploading ? <Loader2 className="animate-spin text-emerald-300" /> : <><ImageIcon className="text-emerald-300 mb-1" size={24} /><span className="text-[11px] text-emerald-700 font-bold">이미지 업로드 (Ctrl+I)</span></>}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-50 pb-2 overflow-x-auto">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Content</label>
            <div className="flex space-x-2">
              <button type="button" onClick={() => insertTag('IMAGE')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="이미지 (Ctrl+I)"><ImageIcon size={16} /></button>
              <button type="button" onClick={() => insertTag('SUB', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="소제목 (Ctrl+B)"><Heading2 size={16} /></button>
              <button type="button" onClick={() => insertTag('QUOTE', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="인용구 (Ctrl+Q)"><Quote size={16} /></button>
              <button type="button" onClick={() => insertTag('HL', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="형광펜 (Ctrl+H)"><Highlighter size={16} /></button>
              <button type="button" onClick={() => insertTag('HR')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="구분선 (Ctrl+L)"><Minus size={16} /></button>
            </div>
          </div>
          <textarea 
            ref={textareaRef} 
            className="w-full h-[30rem] focus:outline-none bg-transparent serif text-lg leading-relaxed placeholder:text-gray-200 resize-none" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            onKeyDown={handleKeyDown}
            required 
            placeholder="당신의 통찰을 자유롭게 남겨주세요..." 
          />
        </div>

        <button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-700 text-white py-5 rounded-[2rem] font-bold hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-100 flex items-center justify-center space-x-3">
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /><span>기록 저장하기 (Ctrl+S)</span></>}
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
    <div className="max-w-sm mx-auto py-32 text-center animate-in fade-in zoom-in duration-700">
      <h2 className="serif text-4xl font-bold mb-12 text-gray-900">관리자님,<br/>반갑습니다.</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <input type="password" placeholder="비밀번호" className="w-full px-6 py-4 rounded-2xl border border-emerald-50 bg-emerald-50/10 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-center" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-emerald-50">
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '접속하기'}
        </button>
      </form>
    </div>
  );
};

export default App;
