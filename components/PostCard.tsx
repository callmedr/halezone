
import React from 'react';
import { Post } from '../types';
import { Calendar } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // 커스텀 태그 제거 로직: [IMAGE], [HR], [HL]...[/HL] 등을 모두 빈 문자열로 대체
  const cleanDescription = post.content
    .replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '') // 태그 자체를 제거
    .replace(/\s+/g, ' ') // 불필요한 공백/줄바꿈 정리
    .trim();

  return (
    <article 
      className="group cursor-pointer transition-all duration-500"
      onClick={() => onClick(post)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-5 bg-white shadow-sm border border-emerald-50/50 flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-900/0 group-hover:bg-emerald-900/5 transition-all duration-500 z-10"></div>
        {post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-100 bg-[#f8fafc] group-hover:bg-lime-50 transition-colors">
            <span className="serif italic text-sm font-medium tracking-widest text-emerald-200">HALEZONE</span>
          </div>
        )}
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 shadow-sm border border-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            READ MORE
          </span>
        </div>
      </div>
      <div className="px-1">
        <div className="flex items-center text-[11px] font-semibold text-emerald-500/70 mb-2 space-x-1 uppercase tracking-wider">
          <Calendar size={12} className="text-lime-500" />
          <span>{formattedDate}</span>
        </div>
        <h3 className="serif text-xl font-bold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="mt-3 text-gray-400 text-sm line-clamp-2 leading-relaxed font-light">
          {cleanDescription}
        </p>
      </div>
    </article>
  );
};

export default PostCard;
