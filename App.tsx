
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
  Clock,
  BookOpen,
  CheckCircle,
  Link as LinkIcon,
  ArrowRight,
  Award,
  Microscope,
  ChevronDown,
  ChevronUp,
  Mail,
  Share2,
  MessageCircle,
  Sparkles
} from 'lucide-react';

const DOCTOR_PHOTO_URL = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/gateway.PNG";
const LOGO_IMAGE_URL = "https://byiaqutzcfwgxiwvmqlx.supabase.co/storage/v1/object/public/board/uploads/hale_logo.PNG";
const POSTS_PER_PAGE = 10;

// 1. 게시글 하단 '인장(Seal)' 크기 설정
const FOOTER_SEAL_SIZE = "w-80 h-80"; 

// 2. 메인 화면 최하단 '푸터 로고' 크기 설정
const MAIN_FOOTER_LOGO_SIZE = "w-80 h-80";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('MAIN');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [recentReferrers, setRecentReferrers] = useState<any[]>([]);

  const [requestContent, setRequestContent] = useState('');
  const [requests, setRequests] = useState<BlogRequest[]>([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [linkingRequestId, setLinkingRequestId] = useState<any | null>(null);

  // 포스트 하단 질문 관련 상태
  const [postQuestionContent, setPostQuestionContent] = useState('');
  const [isSubmittingPostQuestion, setIsSubmittingPostQuestion] = useState(false);
  const [postQuestionSuccess, setPostQuestionSuccess] = useState(false);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
      setShowTopButton(winScroll > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [searchQuery]);

  const navigateToPost = (id: any) => {
    scrollPosRef.current = window.scrollY;
    window.location.hash = `/post/${id}`;
  };

  const navigateToHome = () => { window.location.hash = '/'; };
  const navigateToLab = () => { window.location.hash = '/lab'; };
  const navigateToArchive = () => { window.location.hash = '/archive'; };

  const handleRouting = useCallback(() => {
    const path = window.location.hash.slice(1);
    if (path.startsWith('/post/')) {
      const id = decodeURIComponent(path.replace('/post/', ''));
      const foundPost = posts.find(p => String(p.id) === id);
      if (foundPost) {
        setSelectedPost(foundPost);
        setView('DETAIL');
        setPostQuestionSuccess(false);
        setPostQuestionContent('');
        window.scrollTo(0, 0);
      } else if (!isInitialLoading && posts.length > 0) {
        setSelectedPost(null);
        setView('DETAIL'); 
      }
    } else if (path === '/lab') {
      setView('LAB');
      setSelectedPost(null);
    } else if (path === '/archive') {
      setView('LIST');
      setSelectedPost(null);
    } else {
      setView('MAIN');
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
        window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' });
      }, 10);
      return () => clearTimeout(timeout);
    } else if (view === 'MAIN' || view === 'LAB') {
      window.scrollTo(0, 0);
    }
  }, [view, isInitialLoading]);

  // Social Card & Meta Tag Optimization
  useEffect(() => {
    const baseTitle = "Halezone: 숨결의 온도";
    const defaultDesc = "서울대병원 산부인과를 수료한 전임의 박영수가 데이터 기반으로 해석하는 전문 의학 인사이트 블로그입니다.";
    const defaultImg = LOGO_IMAGE_URL;
    const baseUrl = window.location.origin + window.location.pathname;

    let newTitle = baseTitle;
    let newDesc = defaultDesc;
    let newImg = defaultImg;
    let canonicalUrl = baseUrl + window.location.hash;

    if (view === 'DETAIL' && selectedPost) {
      newTitle = `[Halezone Insight] ${selectedPost.title}`;
      const plainContent = selectedPost.content.replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '').replace(/\s+/g, ' ').trim();
      newDesc = plainContent.substring(0, 160) + (plainContent.length > 160 ? "..." : "");
      if (selectedPost.image_url) newImg = selectedPost.image_url;
    } else if (view === 'LAB') {
      newTitle = "의학 연구소 | Halezone";
      newDesc = "박영수 전문의에게 궁금한 의학 정보를 직접 의뢰하세요. 최신 논문을 바탕으로 답변해 드립니다.";
    } else if (view === 'LIST') {
      newTitle = "기록보관소 | Halezone";
      newDesc = "박영수 전문의가 정립한 명료한 의학 지식의 아카이브입니다.";
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
    updateMeta('meta[property="og:url"]', canonicalUrl);

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
      try { 
        await supabase.from('visitor_logs').insert([{
          referrer: document.referrer || null,
          page_url: window.location.href
        }]); 
      } catch (e) {}
    };
    recordVisit();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchVisitorCount = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase.from('visitor_logs').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
      setVisitorCount(count);
    } catch (e) {}
  }, [isAdmin]);

  const fetchRecentReferrers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await supabase
        .from('visitor_logs')
        .select('referrer, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentReferrers(data || []);
    } catch (e) {}
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchVisitorCount();
      fetchRecentReferrers();
    }
  }, [isAdmin, fetchVisitorCount, fetchRecentReferrers]);

  const getReferrerName = (url: string | null) => {
    if (!url) return "직접 유입 / 북마크";
    try {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes("naver.com")) return "네이버 검색";
      if (lowerUrl.includes("google.com")) return "구글 검색";
      if (lowerUrl.includes("instagram.com")) return "인스타그램";
      if (lowerUrl.includes("facebook.com")) return "페이스북";
      if (lowerUrl.includes("t.co")) return "트위터(X)";
      if (lowerUrl.includes("halezone.com")) return "내부 이동";
      return new URL(url).hostname;
    } catch (e) {
      return "기타 유입";
    }
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('blog').select('*').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err: any) { setError(err.message); } finally { setIsInitialLoading(false); setLoading(false); }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('blog_requests').select('*').order('created_at', { ascending: false });
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
  };

  // Smart Sharing Function
  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: view === 'DETAIL' ? `[Halezone] 전문의 박영수의 의학 통찰: ${selectedPost?.title}` : "전문의 박영수의 의학 인사이트 블로그, Halezone",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast({ message: '통찰의 링크가 클립보드에 복사되었습니다.', type: 'success' });
      }
    } catch (err) {
      // User cancelled
    }
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
    } finally { setIsSubmittingRequest(false); }
  };

  const handlePostQuestionSubmit = async () => {
    if (!postQuestionContent.trim() || !selectedPost) return;
    setIsSubmittingPostQuestion(true);
    try {
      const fullContent = `[${selectedPost.title}에 대한 질문] ${postQuestionContent}`;
      const { error } = await supabase.from('blog_requests').insert([{ content: fullContent }]);
      if (error) throw error;
      setPostQuestionSuccess(true);
      setPostQuestionContent('');
      fetchRequests(); 
    } catch (err) {
      setToast({ message: '질문 전송 실패. 잠시 후 다시 시도해주세요.', type: 'error' });
    } finally { setIsSubmittingPostQuestion(false); }
  };

  const updateRequestStatus = async (requestId: any, currentStatus: RequestStatus) => {
    if (!isAdmin) return;
    let nextStatus: RequestStatus;
    if (currentStatus === 'PENDING') nextStatus = 'REVIEWING';
    else if (currentStatus === 'REVIEWING') { setLinkingRequestId(requestId); return; }
    else nextStatus = 'PENDING';
    try {
      const { error } = await supabase.from('blog_requests').update({ status: nextStatus, post_id: nextStatus === 'PENDING' ? null : undefined }).eq('id', requestId);
      if (error) throw error;
      fetchRequests();
    } catch (e) { setToast({ message: '상태 변경 실패', type: 'error' }); }
  };

  const handleLinkPost = async (postId: any) => {
    if (!linkingRequestId) return;
    try {
      const { error } = await supabase.from('blog_requests').update({ status: 'COMPLETED', post_id: postId || null }).eq('id', linkingRequestId);
      if (error) throw error;
      setToast({ message: '연구 결과가 연결되었습니다.', type: 'success' });
      setLinkingRequestId(null);
      fetchRequests();
    } catch (e) { setToast({ message: '연결 실패', type: 'error' }); }
  };

  const deleteRequest = async (requestId: any) => {
    if (!isAdmin) return;
    if (!confirm('이 의뢰를 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('blog_requests').delete().eq('id', requestId);
      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setToast({ message: '의뢰가 삭제되었습니다.', type: 'success' });
    } catch (e) { setToast({ message: '삭제 실패', type: 'error' }); }
  };

  const getStatusInfo = (status: RequestStatus) => {
    const iconClass = "w-3 h-3 shrink-0";
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
      navigateToArchive();
    } catch (err: any) { setToast({ message: '삭제 실패', type: 'error' }); } finally { setLoading(false); }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + POSTS_PER_PAGE);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStyledContent = (content: string, imageUrl: string | null) => {
    const ImageComponent = () => imageUrl ? (
      <div className="relative group my-8 md:my-6 animate-in fade-in zoom-in duration-1000">
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-100/30 to-lime-100/30 rounded-[2rem] blur-2xl opacity-50"></div>
        <img 
          src={imageUrl} 
          loading="lazy"
          className="relative w-full rounded-[1.5rem] md:rounded-lg shadow-md border border-emerald-50 object-cover max-h-[450px] md:max-h-[550px]" 
          alt="Post content" 
        />
      </div>
    ) : null;
    const parts = content.split(/(\[IMAGE\]|\[HR\]|\[QUOTE\].*?\[\/QUOTE\]|\[HL\].*?\[\/HL\]|\[SUB\].*?\[\/SUB\])/gs);
    return (
      <div className="serif text-[1.25rem] md:text-[1.1rem] leading-[1.8] md:leading-[1.65] text-gray-700 space-y-6 md:space-y-4">
        {parts.map((part, index) => {
          if (part === '[IMAGE]') return <ImageComponent key={index} />;
          if (part === '[HR]') return <div key={index} className="relative flex items-center justify-center my-10 md:my-6 py-4 md:py-2 overflow-hidden"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div></div><div className="relative bg-white px-6"><Leaf size={20} className="text-emerald-400 fill-emerald-50 transform -rotate-12 md:w-3.5 md:h-3.5" /></div></div>;
          if (part.startsWith('[QUOTE]')) return <blockquote key={index} className="my-8 md:my-4 pl-6 md:pl-4 pr-5 md:pr-2.5 py-6 md:py-3 bg-emerald-50/40 border-l-[4px] border-emerald-300 rounded-r-2xl md:rounded-r-md italic text-emerald-900/80 whitespace-pre-wrap text-[1.15rem] md:text-[1rem] leading-relaxed">{part.replace(/\[\/?QUOTE\]/g, '')}</blockquote>;
          if (part.startsWith('[HL]')) return <mark key={index} className="bg-emerald-100/60 text-emerald-900 px-1 rounded-sm whitespace-pre-wrap">{part.replace(/\[\/?HL\]/g, '')}</mark>;
          if (part.startsWith('[SUB]')) return <h3 key={index} className="text-[1.5rem] md:text-[1.3rem] font-bold text-gray-900 mt-10 md:mt-5 mb-5 md:mb-2.5 pt-6 md:pt-2 border-t border-emerald-50 whitespace-pre-wrap leading-tight">{part.replace(/\[\/?SUB\]/g, '')}</h3>;
          return <span key={index} className="whitespace-pre-wrap">{part}</span>;
        })}
        {!content.includes('[IMAGE]') && imageUrl && <ImageComponent />}
        
        <div className="pt-20 pb-10 flex flex-col items-center">
           <div className="w-16 h-1 bg-emerald-100 rounded-full mb-8"></div>
           <div className="relative group">
              <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-30 group-hover:scale-150 transition-transform duration-700"></div>
              <img 
                src={LOGO_IMAGE_URL} 
                className={`${FOOTER_SEAL_SIZE} relative z-10 transition-all duration-500 cursor-help group-hover:scale-110`} 
                alt="Halezone Seal" 
              />
           </div>
           <p className="mt-4 text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.6em]">Official Record · Halezone</p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isInitialLoading) return (
      <div className="flex flex-col items-center justify-center py-48 animate-in fade-in duration-700">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl animate-pulse opacity-40"></div>
          <img 
            src={LOGO_IMAGE_URL} 
            className="w-24 h-24 relative z-10 animate-pulse-gentle object-contain" 
            alt="Halezone Loading" 
          />
        </div>
        <p className="text-emerald-800/40 text-[10px] tracking-[0.5em] uppercase font-black">Halezone Insight</p>
      </div>
    );

    if (view === 'MAIN') {
      return (
        <div className="animate-in fade-in duration-1000 py-10 md:py-16">
          <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1 space-y-8">
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-emerald-50 rounded-full">
                <Award size={16} className="text-emerald-500" />
                <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Medical Insight Specialist</span>
              </div>
              <h1 className="serif text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-relaxed">
                서울대의대 박영수 전문의가<br/>
                <span className="text-emerald-600">의학의 숨결</span>을 해석합니다.
              </h1>
              <p className="text-gray-500 text-lg md:text-xl font-light leading-relaxed max-w-xl">
                서울대학교 의과대학을 졸업하고 서울대병원 산부인과에서 임상을 수련한 전문의 박영수입니다. 
                어려운 의학 지식을 쉽고 따뜻한 지혜로 바꾸어, 당신의 숨결이 한결 더 편안해질 수 있는 작은 통찰들을 기록합니다.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">SNU Medical College</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">SNU Hospital OBGYN</span>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute -inset-10 bg-gradient-to-br from-emerald-100/50 to-lime-100/50 rounded-full blur-[80px] opacity-60"></div>
                <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-white transform rotate-2">
                  <img src={DOCTOR_PHOTO_URL} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="박영수 전문의" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-emerald-50 animate-bounce-slow">
                   <Quote className="text-emerald-200 mb-2" size={24} />
                   <p className="serif text-sm italic text-gray-600">"가장 명료한 지식은<br/>가장 따뜻한 위로가 됩니다."</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div 
              onClick={navigateToLab}
              className="group relative h-80 rounded-[3rem] bg-emerald-900 overflow-hidden cursor-pointer shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_white_0%,_transparent_70%)]"></div>
              </div>
              <div className="relative h-full flex flex-col items-center justify-center p-12 text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-md group-hover:scale-110 transition-transform duration-500">
                   <Microscope size={32} className="text-emerald-300" />
                </div>
                <h3 className="serif text-3xl font-bold mb-4">연구소</h3>
                <p className="text-emerald-100/60 font-light text-sm mb-10 leading-relaxed">당신의 사소한 숨결 하나까지 귀 기울입니다.<br/>평소 궁금했던 건강 고민들을 따뜻한 지혜로 풀어드립니다</p>
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300">
                   <span>Enter Lab</span>
                   <ArrowRight size={14} />
                </div>
              </div>
            </div>

            <div 
              onClick={navigateToArchive}
              className="group relative h-80 rounded-[3rem] bg-white border border-emerald-100 overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-white"></div>
              <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                   <BookOpen size={32} className="text-emerald-600" />
                </div>
                <h3 className="serif text-3xl font-bold text-gray-900 mb-4">기록보관소</h3>
                <p className="text-gray-400 font-light text-sm mb-10 leading-relaxed">당신의 오늘이 어제보다 더 건강하기를 바라는 마음으로,<br/>한 문장 한 문장 소중히 쌓아 올린 지식의 숲입니다.</p>
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">
                   <span>Open Archive</span>
                   <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>

          <footer className="relative -mx-8 md:-mx-12 px-8 md:px-12 py-24 bg-emerald-50/30 rounded-t-[4rem] border-t border-emerald-100 flex flex-col items-center text-center">
             <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-emerald-200 rounded-full blur-3xl opacity-20 group-hover:scale-125 transition-transform duration-1000"></div>
                <img src={LOGO_IMAGE_URL} className={`${MAIN_FOOTER_LOGO_SIZE} relative z-10 object-contain`} alt="Halezone Logo Footer" />
             </div>
             <h2 className="serif text-2xl md:text-3xl font-bold text-emerald-900 mb-4">가장 명료한 지식은<br className="md:hidden" /> 가장 따뜻한 위로가 됩니다</h2>
             <p className="text-gray-400 font-light mb-12 max-w-md mx-auto text-sm leading-relaxed">박영수 전문의는 의학적 전문성이 당신의 일상에 스며들어 더 건강한 내일을 만들 수 있도록 매일 연구하고 기록합니다.</p>
             
             <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-16">
                <a href="mailto:callmedoctorpark@gmail.com" className="group flex items-center space-x-4 bg-white px-8 py-4 rounded-full shadow-lg border border-emerald-50 hover:border-emerald-200 transition-all hover:-translate-y-1">
                   <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Mail size={18} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest leading-none mb-1">Contact Inquiry</p>
                      <p className="text-sm font-bold text-emerald-900">callmedoctorpark@gmail.com</p>
                   </div>
                </a>
                
                {/* Main Page Branding Share Button */}
                <button 
                  onClick={handleShare}
                  className="group flex items-center space-x-4 bg-emerald-900 px-8 py-4 rounded-full shadow-lg border border-emerald-800 hover:bg-black transition-all hover:-translate-y-1"
                >
                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-emerald-200 group-hover:text-white transition-colors">
                      <Share2 size={18} />
                   </div>
                   <div className="text-left text-white">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Spread Insight</p>
                      <p className="text-sm font-bold">Halezone 공유하기</p>
                   </div>
                </button>
             </div>

             <div className="w-16 h-0.5 bg-emerald-100 rounded-full mb-8"></div>
             <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.5em]">© {new Date().getFullYear()} HALEZONE · ALL RIGHTS RESERVED</p>
                <p className="text-[9px] text-gray-300 font-medium">Design & Content by Dr. Youngsoo Park</p>
             </div>
          </footer>
        </div>
      );
    }

    if (view === 'LAB') {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 py-10">
          <div className="max-w-[42rem] mx-auto text-center mb-16">
            <div className="inline-flex items-center space-x-3 px-4 py-2 bg-emerald-50 rounded-full mb-6">
              <Compass size={16} className="text-emerald-500" />
              <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest">Medical Insight Lab</span>
            </div>
            <h2 className="serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">무엇을 대신 연구해드릴까요?</h2>
            <p className="text-gray-400 text-lg md:text-base font-light max-w-lg mx-auto leading-relaxed">
              박영수 전문의가 최신 의학 논문과 공신력 있는 데이터를 기반으로,<br/>당신의 건강한 일상을 위한 명료한 답을 찾아드립니다.
            </p>
          </div>
          <div className="max-w-[42rem] mx-auto">
            <div className="bg-white border border-emerald-100 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-emerald-100/50 mb-16">
              <textarea 
                className="w-full h-48 md:h-40 bg-emerald-50/20 border border-emerald-50 rounded-[1.5rem] p-8 md:p-6 focus:outline-none focus:ring-2 focus:ring-emerald-200 serif text-xl md:text-base text-gray-800 placeholder:text-gray-300 resize-none transition-all mb-8"
                placeholder="궁금한 증상, 약물 정보, 혹은 최신 의료 소식 등 무엇이든 적어주세요."
                value={requestContent}
                onChange={(e) => setRequestContent(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Leaf size={16} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Evidence-Based Clinical Analysis</span>
                </div>
                <button 
                  onClick={handleRequestSubmit}
                  disabled={isSubmittingRequest || !requestContent.trim()}
                  className="flex items-center space-x-3 bg-emerald-900 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-lg hover:bg-black disabled:bg-emerald-200 transition-all hover:scale-105"
                >
                  {isSubmittingRequest ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span>연구 의뢰하기</span>
                </button>
              </div>
            </div>
            {requests.length > 0 && (
              <div className="animate-in fade-in duration-1000">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h4 className="serif text-xl font-bold text-emerald-900">진행 중인 연구 브리핑</h4>
                  <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Live Updates</div>
                </div>
                <div className="space-y-4">
                  {requests.map((req) => {
                    const status = getStatusInfo(req.status);
                    return (
                      <div key={req.id} onClick={() => !isAdmin && req.post_id && navigateToPost(req.post_id)} className={`group flex items-center justify-between p-6 rounded-3xl border bg-white transition-all ${!isAdmin && req.post_id ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 border-emerald-50' : 'cursor-default border-gray-50'}`}>
                        <div className="flex-1 pr-6"><p className="text-gray-700 text-base md:text-sm line-clamp-2 font-light leading-relaxed mb-1">{req.content}</p><span className="text-[10px] text-gray-300 font-black tracking-tighter uppercase">ID: {String(req.id).slice(0, 8)}</span></div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); if(isAdmin) updateRequestStatus(req.id, req.status); }} className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-[11px] font-black transition-all ${status.color}`}>
                            {status.icon}<span className="uppercase tracking-widest">{status.text}</span>
                          </button>
                          {isAdmin && <button onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); }} className="p-2 text-gray-200 hover:text-red-400"><X size={16} /></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (view === 'LIST') {
      return (
        <div className="animate-in fade-in duration-700 py-10">
          <div className="max-w-[42rem] mx-auto text-center mb-16">
            <div className="inline-flex items-center space-x-3 px-4 py-2 bg-lime-50 rounded-full mb-6"><BookOpen size={16} className="text-lime-600" /><span className="text-lime-700 font-black text-[10px] uppercase tracking-widest">Medical Insight Archive</span></div>
            <h2 className="serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">지식의 기록</h2>
            <p className="text-gray-400 text-lg md:text-base font-light max-w-lg mx-auto leading-relaxed">박영수 전문의가 정돈한 명료한 통찰을 만나보세요.</p>
          </div>
          <div className="max-w-[42rem] mx-auto mb-16 relative group">
            <div className="relative flex items-center bg-white border border-emerald-50 rounded-full px-8 py-5 shadow-xl focus-within:shadow-2xl focus-within:border-emerald-300 transition-all duration-300 z-10">
              <Search size={22} className="text-emerald-400 mr-5" />
              <input type="text" placeholder="어떤 숨결을 찾으시나요?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-300 text-lg font-light" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="p-2 text-emerald-200"><X size={20} /></button>}
            </div>
            {isAdmin && (
              <div className="mt-8 flex flex-col items-center space-y-4">
                <button onClick={handleLogout} className="flex items-center space-x-2 px-6 py-2 text-[11px] font-black tracking-widest text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all border border-transparent hover:border-emerald-100 uppercase"><LogOut size={14} /><span>Admin Logout</span></button>
                {visitorCount !== null && <div className="flex items-center space-x-2 px-6 py-2 bg-emerald-50/40 rounded-full border border-emerald-100/30"><Users size={14} className="text-emerald-400" /><span className="serif text-[11px] font-bold text-emerald-800">Today's Visits: <span className="text-emerald-500">{visitorCount}</span></span></div>}
                
                {isAdmin && recentReferrers.length > 0 && (
                  <div className="w-full max-w-xs mt-4 p-5 bg-white rounded-[2rem] border border-emerald-50 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <Compass size={14} className="text-emerald-400" />
                      <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.3em]">최근 유입 경로</p>
                    </div>
                    <ul className="space-y-3">
                      {recentReferrers.map((log, i) => (
                        <li key={i} className="flex items-center justify-between text-[11px] group">
                          <span className="font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">{getReferrerName(log.referrer)}</span>
                          <span className="text-gray-300 font-medium">{new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {visiblePosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                {visiblePosts.map(post => <PostCard key={post.id} post={post} onClick={() => navigateToPost(post.id)} />)}
              </div>
              
              {visibleCount < filteredPosts.length && (
                <div className="mt-24 flex justify-center animate-in fade-in slide-in-from-bottom-2">
                  <button 
                    onClick={handleLoadMore}
                    className="group relative flex items-center space-x-4 bg-white border border-emerald-100 px-12 py-5 rounded-full shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-full bg-emerald-50/30 scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                    <span className="relative z-10 text-[11px] font-black text-emerald-900 uppercase tracking-[0.3em]">기록 더 불러오기</span>
                    <ChevronDown size={18} className="relative z-10 text-emerald-400 group-hover:translate-y-1 transition-transform" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-28 text-center"><p className="serif italic text-gray-400 mb-12 text-lg">기록을 찾을 수 없습니다.</p><button onClick={() => setSearchQuery('')} className="px-10 py-4 bg-emerald-900 text-white rounded-full text-xs font-black uppercase shadow-xl">Show All Records</button></div>
          )}
        </div>
      );
    }

    if (view === 'DETAIL') {
      if (!selectedPost) return <div className="max-w-2xl mx-auto py-32 text-center"><h2 className="serif text-4xl font-bold text-gray-900 mb-6">길을 잃으셨나요?</h2><button onClick={navigateToArchive} className="px-12 py-5 bg-emerald-900 text-white rounded-full font-black text-xs tracking-widest uppercase shadow-xl">Back to Archive</button></div>;
      return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 pt-10">
          <div className="flex items-center justify-between mb-12">
            <div className="flex space-x-3">
              <button onClick={() => window.history.back()} className="flex items-center bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-100 px-6 py-3 rounded-full transition-all text-emerald-800 font-black text-[11px] tracking-widest uppercase"><ArrowLeft size={16} className="mr-2" /><span>Return</span></button>
              
              {/* DETAIL View Share Button */}
              <button 
                onClick={handleShare}
                className="flex items-center bg-white hover:bg-emerald-900 hover:text-white border border-emerald-100 px-6 py-3 rounded-full transition-all text-emerald-800 font-black text-[11px] tracking-widest uppercase"
                title="공유하기"
              >
                <Share2 size={16} className="mr-2" />
                <span>Share</span>
              </button>
            </div>
            
            {isAdmin && <div className="flex space-x-2"><button onClick={() => setView('EDIT')} className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-full"><Edit size={20} /></button><button onClick={() => setShowDeleteModal(true)} className="p-3 text-red-400 hover:bg-red-50 rounded-full"><Trash2 size={20} /></button></div>}
          </div>
          <div className="mb-4"><span className="text-[11px] font-black tracking-[0.5em] text-emerald-500 uppercase">Archive No. {String(selectedPost.id).slice(0, 6)}</span></div>
          <h1 className="serif text-[2.5rem] md:text-[2.2rem] font-bold text-gray-900 mb-8 leading-tight">{selectedPost.title}</h1>
          <div className="text-gray-400 text-xs mb-12 flex items-center justify-between border-b border-emerald-50/50 pb-6"><div className="flex items-center space-x-4"><span className="font-black text-gray-900 uppercase tracking-tighter">박영수 전문의</span><span>{new Date(selectedPost.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div></div>
          
          {/* Post Content */}
          {renderStyledContent(selectedPost.content, selectedPost.image_url)}

          {/* New: Post Context Question Section */}
          <div className="mt-24 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-[3rem] p-8 md:p-12 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} className="text-emerald-900" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="serif text-2xl font-bold text-gray-900">사유의 숲에서 마주한 당신의 물음</h3>
                    <p className="text-emerald-700/60 text-sm font-medium">이 글의 내용 중 더 깊이 알고 싶은 부분이 있으신가요?</p>
                  </div>
                </div>

                {!postQuestionSuccess ? (
                  <div className="space-y-6">
                    <textarea 
                      className="w-full h-32 bg-white border border-emerald-50 rounded-[1.5rem] p-6 focus:outline-none focus:ring-2 focus:ring-emerald-200 serif text-lg text-gray-800 placeholder:text-gray-300 resize-none transition-all shadow-inner"
                      placeholder="사소한 질문이라도 괜찮습니다. 당신의 숨결을 남겨주세요."
                      value={postQuestionContent}
                      onChange={(e) => setPostQuestionContent(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={handlePostQuestionSubmit}
                        disabled={isSubmittingPostQuestion || !postQuestionContent.trim()}
                        className="flex items-center space-x-3 bg-emerald-900 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black disabled:bg-emerald-200 transition-all hover:-translate-y-1"
                      >
                        {isSubmittingPostQuestion ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span>질문 건네기</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center animate-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-md border border-emerald-50">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="serif text-xl font-bold text-gray-900 mb-2">질문이 소중하게 전달되었습니다</p>
                    <p className="text-gray-400 text-sm">박영수 전문의가 연구 후 '연구소(LAB)' 섹션에 답변을 남겨드립니다.</p>
                    <button 
                      onClick={() => setPostQuestionSuccess(false)}
                      className="mt-8 text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-200 pb-1"
                    >
                      추가 질문하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Doctor Profile Card */}
          <div className="p-8 md:p-10 bg-white rounded-[3rem] border border-emerald-50 shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-10 text-center md:text-left">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg shrink-0"><img src={DOCTOR_PHOTO_URL} loading="lazy" className="w-full h-full object-cover" /></div>
            <div className="space-y-4">
              <h4 className="serif text-2xl font-bold text-gray-900">박영수 전문의</h4>
              <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-widest">서울대학교 의과대학 졸업 · 서울대병원 전임의 수료</p>
              <p className="text-sm text-gray-500 leading-relaxed">이 기록은 임상 데이터와 최신 문헌을 바탕으로 박영수 전문의가 직접 검토하고 작성하였습니다.</p>
              <div className="flex justify-center md:justify-start pt-2"><div className="w-12 h-0.5 bg-emerald-100"></div></div>
            </div>
          </div>
          
          <div className="mt-24 flex flex-col items-center"><button onClick={navigateToArchive} className="flex items-center bg-emerald-900 hover:bg-black text-white px-10 py-5 rounded-full transition-all font-black text-xs tracking-widest uppercase shadow-xl"><ArrowLeft size={18} className="mr-3" /><span>Archive Home</span></button></div>
        </div>
      );
    }

    if (view === 'LOGIN') return <LoginForm onLoginSuccess={() => setView('MAIN')} />;
    if (view === 'WRITE' || view === 'EDIT') return <PostForm post={view === 'EDIT' ? selectedPost : null} onSuccess={() => { fetchPosts(); setToast({ message: view === 'EDIT' ? '기록이 수정되었습니다.' : '새로운 숨결이 기록되었습니다.', type: 'success' }); navigateToArchive(); }} onError={(msg) => setToast({ message: msg, type: 'error' })} onCancel={() => { setView(view === 'EDIT' ? 'DETAIL' : 'MAIN'); if(view === 'WRITE') navigateToHome(); }} />;
    return null;
  };

  return (
    <div className="min-h-screen pb-20 bg-white relative overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-1.5 z-[100] pointer-events-none">
        <div className="h-full bg-emerald-600 transition-all duration-100" style={{ width: `${scrollProgress}%` }}></div>
        {scrollProgress > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md border border-emerald-50 transition-all duration-100" style={{ left: `calc(${scrollProgress}% - 8px)` }}>
            <img src={LOGO_IMAGE_URL} className="w-4 h-4 object-contain" alt="P" />
          </div>
        )}
      </div>

      <Header isAdmin={isAdmin} view={view} onNavigate={(v) => { if(v === 'MAIN') navigateToHome(); else if(v === 'LIST') navigateToArchive(); else if(v === 'LAB') navigateToLab(); else setView(v); }} onLogout={handleLogout} />
      
      <main className="max-w-6xl mx-auto px-8 md:px-12">{error && <div className="mt-10 p-6 bg-red-50 text-red-600 rounded-2xl flex items-center border border-red-100"><AlertCircle size={20} className="mr-3" />{error}</div>}{renderContent()}</main>
      
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-10 right-10 z-[80] w-14 h-14 md:w-12 md:h-12 bg-white rounded-full shadow-2xl border border-emerald-50 flex items-center justify-center transition-all duration-500 group overflow-hidden ${showTopButton ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <div className="absolute inset-0 bg-emerald-900 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <img src={LOGO_IMAGE_URL} className="w-6 h-6 md:w-5 md:h-5 relative z-10 object-contain group-hover:hidden" alt="T" />
        <ChevronUp size={24} className="hidden group-hover:block relative z-10 text-white animate-bounce-slow" />
      </button>

      {linkingRequestId && <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-emerald-950/20 backdrop-blur-sm"><div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-emerald-50"><div className="flex items-center justify-between mb-8"><h3 className="serif text-2xl font-bold text-gray-900">연구 결과 연결하기</h3><button onClick={() => setLinkingRequestId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button></div><div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">{posts.map(post => <button key={post.id} onClick={() => handleLinkPost(post.id)} className="w-full text-left p-4 rounded-2xl border border-emerald-50 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between group"><span className="serif text-base font-bold text-gray-800 line-clamp-1">{post.title}</span><LinkIcon size={16} className="text-emerald-300" /></button>)}</div><button onClick={() => handleLinkPost(null)} className="w-full mt-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-sm">연결 없이 완료 처리</button></div></div>}
      {showDeleteModal && <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-emerald-950/30 backdrop-blur-xl animate-in fade-in duration-300"><div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-emerald-50 text-center"><div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8"><Trash2 className="text-red-400" size={32} /></div><h3 className="serif text-2xl font-bold text-gray-900 mb-4">기록을 삭제하시겠습니까?</h3><div className="flex space-x-4 mt-8"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-5 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-colors text-sm uppercase">취소</button><button onClick={executeDelete} className="flex-1 py-5 rounded-2xl font-black bg-red-500 text-white hover:bg-red-600 transition-all text-sm uppercase">삭제하기</button></div></div></div>}
      {toast && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-10 fade-in duration-500 w-[calc(100%-4rem)] max-w-sm"><div className={`flex items-center justify-center space-x-4 px-6 py-4 rounded-2xl shadow-2xl border-2 ${toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-red-50 text-red-600 border-red-100'}`}><CheckCircle2 size={20} /><span className="text-sm font-black">{toast.message}</span></div></div>}
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
      case 'h': e.preventDefault(); insertTag('HL', true); break;
      case 'b': e.preventDefault(); insertTag('SUB', true); break;
      case 'q': e.preventDefault(); insertTag('QUOTE', true); break;
      case 's': e.preventDefault(); handleFormSubmit(); break;
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
    <div className="max-w-3xl mx-auto py-10 px-6 md:px-0">
      <div className="flex items-center justify-between mb-14">
        <h2 className="serif text-3xl font-black text-gray-900">{post ? '숨결 수정' : '새로운 숨결'}</h2>
        <button onClick={onCancel} className="text-gray-400 font-black transition-colors text-xs py-3 px-6 bg-gray-50 rounded-full uppercase tracking-widest">취소</button>
      </div>
      <form onSubmit={handleFormSubmit} className="space-y-12" onKeyDown={handleKeyDown}>
        <div className="space-y-4">
          <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2">Journal Title</label>
          <input type="text" className="w-full text-2xl font-bold border-b-2 border-emerald-50 py-4 focus:outline-none focus:border-emerald-500 bg-transparent" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="제목을 입력하세요" />
        </div>
        <div className="space-y-6">
          <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2">Main Visual</label>
          <div className="flex items-center space-x-6">
            {imageUrl && <img src={imageUrl} className="w-24 h-24 rounded-3xl object-cover border border-emerald-50 shadow-xl" />}
            <label className="flex-1 cursor-pointer">
              <div className="w-full h-24 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-3xl bg-emerald-50/10 hover:bg-emerald-50/40 transition-all">
                {uploading ? <Loader2 size={18} className="animate-spin text-emerald-300" /> : <><ImageIcon className="text-emerald-300 mb-2" /><span className="text-[10px] text-emerald-800 font-black uppercase tracking-[0.3em]">Image Upload</span></>}
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-emerald-50 pb-4">
            <label className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] ml-2">Context</label>
            <div className="flex space-x-2">
              <button type="button" onClick={() => insertTag('IMAGE')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="이미지 삽입"><ImageIcon size={20} /></button>
              <button type="button" onClick={() => insertTag('SUB', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="소제목"><Heading2 size={20} /></button>
              <button type="button" onClick={() => insertTag('QUOTE', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="인용구"><Quote size={20} /></button>
              <button type="button" onClick={() => insertTag('HL', true)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="하이라이트"><Highlighter size={20} /></button>
              <button type="button" onClick={() => insertTag('HR')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full" title="구분선"><Minus size={20} /></button>
            </div>
          </div>
          <textarea ref={textareaRef} className="w-full h-[30rem] focus:outline-none bg-transparent serif text-xl leading-relaxed placeholder:text-gray-200 resize-none" value={content} onChange={(e) => setContent(e.target.value)} required placeholder="당신의 통찰을 자유롭게 남겨주세요..." />
        </div>
        <button type="submit" disabled={submitting || uploading} className="w-full bg-emerald-900 text-white py-6 rounded-3xl font-black hover:bg-black transition-all shadow-lg flex items-center justify-center space-x-4 text-sm uppercase tracking-[0.3em]">
          {submitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /><span>Publish Record</span></>}
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
    <div className="max-md mx-auto py-40 text-center px-8 md:px-0">
      <div className="mb-8 text-emerald-500 font-black tracking-[0.6em] uppercase text-[10px]">Administrator</div>
      <h2 className="serif text-4xl font-bold mb-12 text-gray-900 leading-tight">관리자님,<br/>반갑습니다.</h2>
      <form onSubmit={handleLogin} className="space-y-6">
        <input type="password" placeholder="비밀번호" className="w-full px-8 py-5 rounded-2xl border border-emerald-50 bg-emerald-50/5 focus:outline-none text-center text-xl" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl text-xs uppercase tracking-[0.3em]">{loading ? <Loader2 className="animate-spin mx-auto" /> : 'Connect'}</button>
      </form>
    </div>
  );
};

export default App;
