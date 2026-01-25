
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, ADMIN_EMAIL, STORAGE_BUCKET } from './supabase';
import { Post, ViewState, BlogRequest, RequestStatus } from './types';
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
  LogOut,
  Compass,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  CheckCircle,
  Link as LinkIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // 연구 의뢰 관련 상태
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestContent, setRequestContent] = useState('');
  const [requests, setRequests] = useState<BlogRequest[]>([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [linkingRequestId, setLinkingRequestId] = useState<any | null>(null);

  // 스크롤 위치 기억을 위한 ref
  const scrollPosRef = useRef<number>(0);

  // 토스트 자동 소멸 로직
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000); // 3초 후 삭제
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const navigateToPost = (id: any) => {
    scrollPosRef.current = window.scrollY;
    window.location.hash = `/post/${id}`;
  };

  const navigateToHome = () => {
    window.location.hash = '/';
  };

  const handleRouting = useCallback(() => {
    const path = window.location.hash.slice(1);
    
    if (path.startsWith('/post/')) {
      const id = decodeURIComponent(path.replace('/post/', ''));
      const foundPost = posts.find(p => String(p.id) === id);
      
      if (foundPost) {
        setSelectedPost(foundPost);
        setView('DETAIL');
        window.scrollTo(0, 0);
      } else if (!isInitialLoading && posts.length > 0) {
        setSelectedPost(null);
        setView('DETAIL'); 
      }
    } else {
      setView('LIST');
      setSelectedPost(null);
    }
  }, [posts, isInitialLoading]);

  useEffect(() => {
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
    return () => window.removeEventListener('hashchange', handleRouting);
  }, [handleRouting]);

  useEffect(() => {
    if (view === 'LIST' && !isInitialLoading) {
      const timeout = setTimeout(() => {
        window.scrollTo({
          top: scrollPosRef.current,
          behavior: 'instant'
        });
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [view, isInitialLoading]);

  useEffect(() => {
    const baseTitle = "Halezone: 숨결의 온도";
    const defaultDesc = "복잡한 의학적 지식을 데이터 기반으로 가장 명료하게 해석하는 전문 의학 인사이트 블로그입니다.";
    const defaultImg = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/hale_logo.PNG";
    const baseUrl = window.location.origin + window.location.pathname;

    let newTitle = baseTitle;
    let newDesc = defaultDesc;
    let newImg = defaultImg;
    let canonicalUrl = baseUrl + window.location.hash;

    if (view === 'DETAIL' && selectedPost) {
      newTitle = `${selectedPost.title} | Halezone`;
      newDesc = selectedPost.content
        .replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 160) + "...";
      
      if (selectedPost.image_url) {
        newImg = selectedPost.image_url;
      }
    }

    document.title = newTitle;

    const updateMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    updateMeta('meta[name="description"]', newDesc);
    updateMeta('meta[property="og:title"]', newTitle);
    updateMeta('meta[property="og:description"]', newDesc);
    updateMeta('meta[property="og:image"]', newImg);
    updateMeta('meta[name="twitter:title"]', newTitle);
    updateMeta('meta[name="twitter:description"]', newDesc);
    updateMeta('meta[name="twitter:image"]', newImg);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

  }, [view, selectedPost]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    };
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === ADMIN_EMAIL);
    });

    const recordVisit = async () => {
      try { await supabase.from('visitor_logs').insert([{}]); } catch (e) {}
    };
    recordVisit();

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchVisitorCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('visitor_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      setVisitorCount(count);
    } catch (e) {}
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchVisitorCount();
  }, [isAdmin, fetchVisitorCount]);

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
      setIsInitialLoading(false);
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blog_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setRequests(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchRequests();
  }, [fetchPosts, fetchRequests]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigateToHome();
    setView('LIST');
  };

  const handleRequestSubmit = async () => {
    if (!requestContent.trim()) return;
    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase.from('blog_requests').insert([{ content: requestContent }]);
      if (error) throw error;
      setToast({ message: '소중한 주제가 접수되었습니다.', type: 'success' });
      setRequestContent('');
      fetchRequests(); 
    } catch (err) {
      setToast({ message: '의뢰 실패. 잠시 후 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const updateRequestStatus = async (requestId: any, currentStatus: RequestStatus) => {
    if (!isAdmin) return;
    
    let nextStatus: RequestStatus;
    if (currentStatus === 'PENDING') nextStatus = 'REVIEWING';
    else if (currentStatus === 'REVIEWING') {
      setLinkingRequestId(requestId);
      return; // COMPLETED는 포스트 선택 후 업데이트
    }
    else nextStatus = 'PENDING';

    try {
      const { error } = await supabase
        .from('blog_requests')
        .update({ status: nextStatus, post_id: nextStatus === 'PENDING' ? null : undefined })
        .eq('id', requestId);
      if (error) throw error;
      fetchRequests();
    } catch (e) {
      setToast({ message: '상태 변경 실패', type: 'error' });
    }
  };

  const handleLinkPost = async (postId: any) => {
    if (!linkingRequestId) return;
    try {
      const { error } = await supabase
        .from('blog_requests')
        .update({ status: 'COMPLETED', post_id: postId || null })
        .eq('id', linkingRequestId);
      if (error) throw error;
      setToast({ message: '연구 결과가 연결되었습니다.', type: 'success' });
      setLinkingRequestId(null);
      fetchRequests();
    } catch (e) {
      setToast({ message: '연결 실패', type: 'error' });
    }
  };

  const deleteRequest = async (requestId: any) => {
    if (!isAdmin) return;
    if (!confirm('이 의뢰를 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('blog_requests').delete().eq('id', requestId);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setToast({ message: '의뢰가 삭제되었습니다.', type: 'success' });
    } catch (e) {
      setToast({ message: '삭제 실패', type: 'error' });
    }
  };

  const getStatusInfo = (status: RequestStatus) => {
    const iconClass = "w-3 h-3 md:w-3 md:h-3 shrink-0";
    switch (status) {
      case 'PENDING': return { text: '연구 대기', icon: <Clock className={iconClass} />, color: 'text-gray-400 bg-gray-50 border-gray-100' };
      case 'REVIEWING': return { text: '문헌 조사', icon: <BookOpen className={iconClass} />, color: 'text-blue-500 bg-blue-50 border-blue-100' };
      case 'COMPLETED': return { text: '집필 완료', icon: <CheckCircle className={iconClass} />, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
      default: return { text: '접수됨', icon: <Clock className={iconClass} />, color: 'text-gray-400 bg-gray-50 border-gray-100' };
    }
  };

  const executeDelete = async () => {
    if (!selectedPost) return;
    setLoading(true);
    try {
      await supabase.from('blog').delete().eq('id', selectedPost.id);
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setToast({ message: '기록이 삭제되었습니다.', type: 'success' });
      setShowDeleteModal(false);
      navigateToHome();
    } catch (err: any) {
      setToast({ message: '삭제 실패', type: 'error' });
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
      <div className="serif text-[1.35rem] md:text-[1.2rem] leading-[1.8] md:leading-[1.65] text-gray-700 space-y-7 md:space-y-4">
        {parts.map((part, index) => {
          if (part === '[IMAGE]') return <ImageComponent key={index} />;
          if (part === '[HR]') {
            return (
              <div key={index} className="relative flex items-center justify-center my-14 md:my-8 py-5 md:py-2.5 overflow-hidden">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div></div>
                <div className="relative bg-white px-6"><Leaf size={24} className="text-emerald-400 fill-emerald-50 transform -rotate-12 md:w-3.5 md:h-3.5" /></div>
              </div>
            );
          }
          if (part.startsWith('[QUOTE]')) {
            const text = part.replace(/\[\/?QUOTE\]/g, '');
            return <blockquote key={index} className="my-10 md:my-5 pl-7 md:pl-4 pr-5 md:pr-2.5 py-8 md:py-4 bg-emerald-50/40 border-l-[6px] md:border-l-[2px] border-emerald-300 rounded-r-[2rem] md:rounded-r-md italic text-emerald-900/80 whitespace-pre-wrap text-[1.25rem] md:text-[1.1rem] leading-relaxed">{text}</blockquote>;
          }
          if (part.startsWith('[HL]')) return <mark key={index} className="bg-emerald-100/60 text-emerald-900 px-1.5 rounded-sm whitespace-pre-wrap">{part.replace(/\[\/?HL\]/g, '')}</mark>;
          if (part.startsWith('[SUB]')) return <h3 key={index} className="text-[1.7rem] md:text-[1.5rem] font-bold text-gray-900 mt-14 md:mt-6 mb-6 md:mb-3 pt-8 md:pt-3 border-t-2 border-emerald-50 whitespace-pre-wrap leading-tight">{part.replace(/\[\/?SUB\]/g, '')}</h3>;
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
    return post.title.toLowerCase().includes(lowerQuery) || cleanContent.includes(lowerQuery);
  });

  const renderContent = () => {
    if (isInitialLoading) {
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
          <div className="max-w-[42rem] mx-auto mb-8 md:mb-6 relative group px-4">
            <div className="absolute inset-0 bg-emerald-100/20 blur-[3.5rem] md:blur-[2rem] rounded-full group-focus-within:bg-emerald-200/50 transition-all duration-500 pointer-events-none"></div>
            <div className="relative flex items-center bg-white border border-emerald-50 rounded-[2rem] md:rounded-lg px-7 py-5 md:px-3.5 md:py-2 shadow-lg focus-within:shadow-xl focus-within:border-emerald-300 transition-all duration-300 z-10">
              <Search size={24} className="text-emerald-400 mr-5 md:mr-2 shrink-0 md:w-3.5 md:h-3.5" />
              <input type="text" placeholder="어떤 숨결을 찾으시나요?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-300 text-base md:text-[11px] font-light" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="p-2 md:p-0.5 text-emerald-200 hover:text-emerald-500"><X size={20} className="md:w-3 md:h-3" /></button>}
            </div>
            {isAdmin && (
              <div className="mt-5 md:mt-3 flex flex-col items-center space-y-4 md:space-y-2 relative z-20">
                <button onClick={handleLogout} className="flex items-center space-x-2 px-6 py-2.5 md:px-3 md:py-1 text-[13px] md:text-[9px] font-black tracking-tighter text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all border border-transparent hover:border-emerald-100/50 uppercase">
                  <LogOut size={15} className="md:w-3 md:h-3" /><span>Admin Logout</span>
                </button>
                {visitorCount !== null && (
                  <div className="flex items-center space-x-2.5 md:space-x-1.5 px-6 py-2.5 md:px-3 md:py-1 bg-emerald-50/40 rounded-full border border-emerald-100/30">
                    <Users size={16} className="text-emerald-400 md:w-3 md:h-3" />
                    <span className="serif text-[12px] md:text-[9px] font-bold text-emerald-800">오늘의 숨결: <span className="text-emerald-500">{visitorCount}</span></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!searchQuery && (
            <div className="max-w-[42rem] mx-auto mb-16 md:mb-10 px-4">
              <div className={`relative bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-[2.5rem] md:rounded-xl overflow-hidden transition-all duration-500 ${isRequestOpen ? 'py-10 md:py-6 px-10 md:px-6' : 'py-6 md:py-3 px-8 md:px-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-5 md:space-x-2.5">
                    <div className="w-14 h-14 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Leaf size={24} className="text-emerald-400 md:w-3.5 md:h-3.5" />
                    </div>
                    <div>
                      <p className="serif text-lg md:text-[11px] font-bold text-emerald-900 leading-tight">궁금한 의학 지식, 대신 연구해드립니다</p>
                      {!isRequestOpen && <p className="text-emerald-500/70 text-sm md:text-[9px] mt-1.5 md:mt-0.5">최신 논문과 데이터를 기반으로 명료한 답을 드립니다.</p>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsRequestOpen(!isRequestOpen)}
                    className="p-3 md:p-1.5 bg-white rounded-full shadow-md text-emerald-600 hover:text-emerald-900 transition-colors"
                  >
                    {isRequestOpen ? <ChevronUp size={24} className="md:w-3.5 md:h-3.5" /> : <ChevronDown size={24} className="md:w-3.5 md:h-3.5" />}
                  </button>
                </div>

                {isRequestOpen && (
                  <div className="mt-10 md:mt-5 animate-in slide-in-from-top-4 fade-in duration-500">
                    <textarea 
                      className="w-full h-40 md:h-24 bg-white/60 border border-emerald-100 rounded-[1.5rem] md:rounded-lg p-7 md:p-4 focus:outline-none focus:ring-2 focus:ring-emerald-200 serif text-lg md:text-xs text-gray-800 placeholder:text-gray-300 resize-none transition-all"
                      placeholder="건강에 관하여 무엇이든 물어보세요."
                      value={requestContent}
                      onChange={(e) => setRequestContent(e.target.value)}
                    />
                    <div className="mt-6 md:mt-3 flex justify-end">
                      <button 
                        onClick={handleRequestSubmit}
                        disabled={isSubmittingRequest || !requestContent.trim()}
                        className="flex items-center space-x-3.5 md:space-x-2 bg-emerald-900 text-white px-10 py-5 md:px-5 md:py-2.5 rounded-full font-black text-[13px] md:text-[9px] uppercase tracking-widest shadow-lg hover:bg-black disabled:bg-emerald-200 transition-all"
                      >
                        {isSubmittingRequest ? <Loader2 size={18} className="animate-spin md:w-3 md:h-3" /> : <Send size={18} className="md:w-3 md:h-3" />}
                        <span>연구 의뢰하기</span>
                      </button>
                    </div>

                    {requests.length > 0 && (
                      <div className="mt-12 md:mt-8 pt-10 md:pt-6 border-t border-emerald-100/50">
                        <h4 className="serif text-base md:text-[10px] font-bold text-emerald-900/50 mb-6 md:mb-3 flex items-center space-x-2.5 md:space-x-1.5">
                          <Compass size={16} className="md:w-3" />
                          <span>현재 연구 진행 상황</span>
                        </h4>
                        <div className="space-y-4 md:space-y-2">
                          {requests.map((req) => {
                            const status = getStatusInfo(req.status);
                            return (
                              <div 
                                key={req.id} 
                                onClick={() => !isAdmin && req.post_id && navigateToPost(req.post_id)}
                                className={`group flex items-center justify-between p-3.5 md:p-2.5 rounded-[1.25rem] md:rounded-lg border bg-white/40 transition-all ${!isAdmin && req.post_id ? 'cursor-pointer hover:bg-white hover:shadow-md hover:-translate-y-0.5' : 'cursor-default'}`}
                              >
                                <p className="flex-1 text-gray-700 text-[8px] md:text-[10px] line-clamp-3 md:line-clamp-1 font-light pr-2 md:pr-2.5 leading-tight">
                                  {req.content}
                                </p>
                                <div className="flex items-center space-x-2 md:space-x-1.5 shrink-0 ml-1.5">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); if(isAdmin) updateRequestStatus(req.id, req.status); }}
                                    className={`flex items-center space-x-1.5 md:space-x-1 px-2.5 py-1 md:px-2 md:py-0.5 rounded-full border text-[10px] md:text-[8px] font-bold transition-all ${status.color} ${isAdmin ? 'hover:scale-105 active:scale-95 cursor-pointer' : ''}`}
                                    title={isAdmin ? "상태 변경" : ""}
                                  >
                                    {status.icon}
                                    <span className="whitespace-nowrap">{status.text}</span>
                                  </button>
                                  {isAdmin && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); }}
                                      className="p-1.5 md:p-1 text-gray-300 hover:text-red-500 transition-colors"
                                      title="의뢰 삭제"
                                    >
                                      <X size={14} className="md:w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 md:gap-x-8 gap-y-16 md:gap-y-8">
              {filteredPosts.map(post => <PostCard key={post.id} post={post} onClick={() => navigateToPost(post.id)} />)}
            </div>
          ) : (
            <div className="py-28 text-center">
              <div className="w-24 h-24 md:w-14 md:h-14 bg-emerald-50/50 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-5"><Search size={32} className="text-emerald-200 md:w-5 md:h-5" /></div>
              <p className="serif italic text-gray-400 mb-12 md:mb-6 text-lg md:text-xs">흔적이 보이지 않습니다.</p>
              <button onClick={() => setSearchQuery('')} className="px-12 py-5 md:px-5 md:py-2.5 bg-emerald-900 text-white rounded-[1.5rem] md:rounded-md text-[13px] md:text-[10px] font-black uppercase shadow-xl">View All Records</button>
            </div>
          )}
        </div>
      );
    }

    if (view === 'DETAIL') {
      if (!selectedPost) {
        return (
          <div className="max-w-2xl mx-auto py-32 md:py-24 text-center animate-in fade-in zoom-in-95 duration-1000">
            <div className="mb-12 md:mb-8 flex justify-center"><div className="relative"><Compass size={80} className="text-emerald-50 animate-[spin_10s_linear_infinite]" /><Leaf size={32} className="text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div></div>
            <h2 className="serif text-4xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-4">길을 잃으셨나요?</h2>
            <p className="text-gray-400 text-lg md:text-sm leading-relaxed mb-16 md:mb-10 px-8">이 숨결은 이미 바람을 타고 멀리 떠난 것 같습니다.</p>
            <button onClick={navigateToHome} className="px-14 py-6 md:px-8 md:py-3.5 bg-emerald-900 text-white rounded-[3rem] md:rounded-lg font-black text-[13px] md:text-[10px] tracking-[0.25em] uppercase shadow-xl">Back to Safe Harbor</button>
          </div>
        );
      }

      return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 px-6 md:px-0">
          <div className="flex items-center justify-between mb-14 md:mb-8">
            <button onClick={navigateToHome} className="flex items-center bg-emerald-50/60 hover:bg-emerald-100/80 border-2 border-emerald-100/50 px-7 py-5 md:px-4 md:py-2.5 rounded-[1.5rem] md:rounded-md transition-all text-emerald-800 font-black text-[13px] md:text-[9px] tracking-widest uppercase shadow-md hover:shadow-xl"><ArrowLeft size={20} className="mr-3.5 md:mr-1.5 md:w-3 md:h-3" /><span>Back to List</span></button>
            {isAdmin && (
              <div className="flex space-x-2.5 md:space-x-1">
                <button onClick={() => setView('EDIT')} className="p-3.5 md:p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-2xl md:rounded-md"><Edit size={24} className="md:w-3.5 md:h-3.5" /></button>
                <button onClick={() => setShowDeleteModal(true)} className="p-3.5 md:p-1.5 text-red-400 hover:bg-red-50 rounded-2xl md:rounded-md"><Trash2 size={24} className="md:w-3.5 md:h-3.5" /></button>
              </div>
            )}
          </div>
          <div className="mb-4 md:mb-8"><span className="text-[12px] md:text-[9px] font-black tracking-[0.5em] text-emerald-500 uppercase">Daily Insight</span></div>
          <h1 className="serif text-[2.0rem] md:text-[1.8rem] font-bold text-gray-900 mb-10 md:mb-5 leading-[1.5]">{selectedPost.title}</h1>
          <div className="text-gray-400 text-sm md:text-[10px] mb-14 md:mb-8 flex items-center justify-between border-b md:border-b-0.5 border-emerald-50/50 pb-8 md:pb-4">
            <div className="flex items-center space-x-5 md:space-x-2"><span className="font-black text-gray-900 uppercase tracking-tighter">Dr. Halezone</span><span className="w-1.5 h-1.5 md:w-0.5 md:h-0.5 bg-emerald-100 rounded-full"></span><span>{new Date(selectedPost.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
          </div>
          {renderStyledContent(selectedPost.content, selectedPost.image_url)}
          <div className="mt-24 md:mt-16 pt-16 md:pt-10 border-t md:border-t-0.5 border-emerald-50 flex flex-col items-center">
            <div className="mb-10 md:mb-5 text-center"><Leaf size={28} className="text-emerald-100 mx-auto mb-5 md:mb-2 md:w-4 md:h-4" /><p className="serif italic text-gray-400 text-base md:text-[10px]">기록의 끝에서 다시 처음으로</p></div>
            <button onClick={navigateToHome} className="flex items-center bg-emerald-900 hover:bg-black text-white px-14 py-6 md:px-6 md:py-3.5 rounded-[3rem] md:rounded-lg transition-all font-black text-[13px] md:text-[10px] tracking-[0.25em] uppercase shadow-xl hover:scale-105"><ArrowLeft size={22} className="mr-4 md:mr-2 md:w-3.5 md:h-3.5" /><span>Back to Journal List</span></button>
          </div>
        </div>
      );
    }

    if (view === 'LOGIN') return <LoginForm onLoginSuccess={() => setView('LIST')} />;
    if (view === 'WRITE' || view === 'EDIT') {
      return (
        <PostForm 
          post={view === 'EDIT' ? selectedPost : null} 
          onSuccess={() => { 
            fetchPosts(); 
            setToast({ message: view === 'EDIT' ? '기록이 수정되었습니다.' : '새로운 숨결이 기록되었습니다.', type: 'success' });
            setView('LIST'); 
            navigateToHome(); 
          }}
          onError={(msg) => setToast({ message: msg, type: 'error' })}
          onCancel={() => { setView(view === 'EDIT' ? 'DETAIL' : 'LIST'); if(view === 'WRITE') navigateToHome(); }}
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-40 bg-white relative overflow-x-hidden">
      <Header isAdmin={isAdmin} view={view} onNavigate={(v) => { if(v === 'LIST') navigateToHome(); else setView(v); }} onLogout={handleLogout} />
      <main className="max-w-5xl mx-auto px-8 md:px-12">
        {error && <div className="mb-10 p-7 md:p-4 bg-red-50 text-red-600 rounded-[1.5rem] md:rounded-lg flex items-center text-base md:text-xs border border-red-100"><AlertCircle size={24} className="mr-3.5 md:mr-2 md:w-3.5 md:h-3.5" />{error}</div>}
        {renderContent()}
      </main>

      {/* 포스트 연결 모달 */}
      {linkingRequestId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-emerald-950/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] md:rounded-xl p-10 md:p-6 max-w-lg w-full shadow-2xl border border-emerald-50 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8 md:mb-4">
              <h3 className="serif text-2xl md:text-lg font-bold text-gray-900">연구 결과 연결하기</h3>
              <button onClick={() => setLinkingRequestId(null)} className="p-2 md:p-1 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} className="md:w-4 md:h-4" /></button>
            </div>
            <p className="text-gray-500 text-sm md:text-xs mb-6 md:mb-4">이 연구 의뢰를 완료 상태로 변경하고, 발행된 포스트와 연결합니다.</p>
            <div className="max-h-[300px] md:max-h-[200px] overflow-y-auto space-y-3 md:space-y-2 pr-2 custom-scrollbar">
              {posts.map(post => (
                <button 
                  key={post.id}
                  onClick={() => handleLinkPost(post.id)}
                  className="w-full text-left p-4 md:p-2.5 rounded-xl md:rounded-lg border border-emerald-50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between group"
                >
                  <span className="serif text-[15px] md:text-xs font-bold text-gray-800 line-clamp-1">{post.title}</span>
                  <LinkIcon size={16} className="text-emerald-300 group-hover:text-emerald-500 shrink-0 md:w-3" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => {
                // 포스트 없이 그냥 완료 처리
                handleLinkPost(null);
              }}
              className="w-full mt-6 md:mt-4 py-4 md:py-2 bg-gray-50 text-gray-400 rounded-xl md:rounded-lg font-bold text-sm md:text-[10px] hover:bg-gray-100 transition-all"
            >
              연결 없이 완료 처리
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-emerald-950/30 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] md:rounded-xl p-12 md:p-6 max-w-md w-full shadow-2xl border border-emerald-50 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 md:w-12 md:h-12 bg-red-50 rounded-[2rem] md:rounded-lg flex items-center justify-center mx-auto mb-8 md:mb-4"><Trash2 className="text-red-400 md:w-6 md:h-6" size={32} /></div>
            <h3 className="serif text-2xl md:text-lg font-bold text-gray-900 mb-4 md:mb-2">기록을 삭제하시겠습니까?</h3>
            <div className="flex space-x-3.5 md:space-x-2 mt-8 md:mt-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-6 md:py-3 rounded-[1.5rem] md:rounded-md font-black text-gray-400 hover:bg-gray-50 transition-colors text-base md:text-[10px] uppercase">취소</button>
              <button onClick={executeDelete} className="flex-1 py-6 md:py-3 rounded-[1.5rem] md:rounded-md font-black bg-red-500 text-white hover:bg-red-600 transition-all text-base md:text-[10px] uppercase">삭제하기</button>
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
    let newText = isPair ? `[${tag}]${selected}[/${tag}]` : `\n[${tag}]\n`;
    setContent(before + newText + after);
    setTimeout(() => {
      textarea.focus();
      const pos = start + (isPair ? tag.length + 2 : newText.length);
      textarea.setSelectionRange(pos, pos);
    }, 0);
  }, []);

  const handleFormSubmit = useCallback(async (e?: React.FormEvent) => {
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
      onError('기록 실패');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, title, content, imageUrl, post, onSuccess, onError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (!isMod) return;

    switch (e.key.toLowerCase()) {
      case 'h':
        e.preventDefault();
        insertTag('HL', true);
        break;
      case 'b':
        e.preventDefault();
        insertTag('SUB', true);
        break;
      case 'q':
        e.preventDefault();
        insertTag('QUOTE', true);
        break;
      case 's':
        e.preventDefault();
        handleFormSubmit();
        break;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from(STORAGE_BUCKET).upload(`uploads/${fileName}`, file);
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(`uploads/${fileName}`);
      setImageUrl(data.publicUrl);
    } catch (err: any) {
      onError('업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 md:py-6 px-6 md:px-0">
      <div className="flex items-center justify-between mb-14 md:mb-8">
        <h2 className="serif text-3xl md:text-xl font-black text-gray-900">{post ? '숨결 수정' : '새로운 숨결'}</h2>
        <button onClick={onCancel} className="text-gray-400 font-black transition-colors text-base md:text-[10px] py-3 md:py-1.5 px-6 md:px-3.5 bg-gray-50 rounded-[1.5rem] md:rounded-md uppercase tracking-widest">취소</button>
      </div>
      <form onSubmit={handleFormSubmit} className="space-y-14 md:space-y-8" onKeyDown={handleKeyDown}>
        <div className="space-y-4 md:space-y-1.5">
          <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1">Journal Title</label>
          <input type="text" className="w-full text-2xl md:text-lg font-bold border-b-2 md:border-b border-emerald-50 py-5 md:py-2.5 focus:outline-none focus:border-emerald-500 bg-transparent" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="제목을 입력하세요" />
        </div>
        <div className="space-y-6 md:space-y-2.5">
          <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1">Main Visual</label>
          <div className="flex items-center space-x-8 md:space-x-5">
            {imageUrl && <img src={imageUrl} className="w-28 h-28 md:w-20 md:h-20 rounded-[2rem] md:rounded-lg object-cover border border-emerald-50 shadow-xl" />}
            <label className="flex-1 cursor-pointer">
              <div className="w-full h-28 md:h-20 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-[2rem] md:rounded-lg bg-emerald-50/10 hover:bg-emerald-50/40 transition-all">
                {uploading ? <Loader2 className="animate-spin text-emerald-300 md:w-4 md:h-4" size={32} /> : <><ImageIcon className="text-emerald-300 mb-4 md:mb-1 md:w-5 md:h-5" size={32} /><span className="text-[12px] md:text-[9px] text-emerald-800 font-black uppercase tracking-[0.3em]">Image Upload</span></>}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        <div className="space-y-6 md:space-y-2.5">
          <div className="flex items-center justify-between border-b-2 md:border-b border-emerald-50 pb-6 md:pb-2">
            <label className="text-[12px] md:text-[9px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2 md:ml-1">Context</label>
            <div className="flex space-x-3.5 md:space-x-1">
              <button type="button" onClick={() => insertTag('IMAGE')} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md" title="이미지 삽입"><ImageIcon size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('SUB', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md" title="소제목 (Ctrl+B)"><Heading2 size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('QUOTE', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md" title="인용구 (Ctrl+Q)"><Quote size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('HL', true)} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md" title="하이라이트 (Ctrl+H)"><Highlighter size={24} className="md:w-3.5 md:h-3.5" /></button>
              <button type="button" onClick={() => insertTag('HR')} className="p-3.5 md:p-1 text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] md:rounded-md" title="구분선"><Minus size={24} className="md:w-3.5 md:h-3.5" /></button>
            </div>
          </div>
          <textarea ref={textareaRef} className="w-full h-[35rem] md:h-[22rem] focus:outline-none bg-transparent serif text-xl md:text-sm leading-relaxed placeholder:text-gray-200 resize-none" value={content} onChange={(e) => setContent(e.target.value)} required placeholder="당신의 통찰을 자유롭게 남겨주세요..." />
        </div>
        <button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-900 text-white py-7 md:py-4 rounded-[2.5rem] md:rounded-lg font-black hover:bg-black transition-all shadow-lg flex items-center justify-center space-x-5 md:space-x-2 text-lg md:text-sm uppercase tracking-[0.3em]" title="기록 저장 (Ctrl+S)">
          {submitting ? <Loader2 className="animate-spin md:w-4 md:h-4" size={28} /> : <><Send size={24} className="md:w-3.5 md:h-3.5" /><span>Publish Record</span></>}
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
    <div className="max-w-md mx-auto py-40 md:py-24 text-center px-8 md:px-0">
      <div className="mb-12 md:mb-5"><span className="text-[12px] md:text-[9px] font-black tracking-[0.6em] text-emerald-500 uppercase">Administrator</span></div>
      <h2 className="serif text-4xl md:text-2xl font-bold mb-16 md:mb-8 text-gray-900 leading-tight">관리자님,<br/>반갑습니다.</h2>
      <form onSubmit={handleLogin} className="space-y-7 md:space-y-4">
        <input type="password" placeholder="비밀번호" className="w-full px-8 py-7 md:px-4 md:py-3 rounded-[1.5rem] md:rounded-lg border border-emerald-50 bg-emerald-50/5 focus:outline-none text-center text-xl md:text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-7 md:py-3 rounded-[1.5rem] md:rounded-lg font-black hover:bg-black transition-all shadow-xl text-lg md:text-[10px] uppercase tracking-[0.3em]">{loading ? <Loader2 className="animate-spin mx-auto md:w-4 md:h-4" size={28} /> : 'Connect'}</button>
      </form>
    </div>
  );
};

export default App;
