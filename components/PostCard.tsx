
import React from 'react';
import { Post } from '../types';
import { Calendar } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const cleanDescription = post.content
    .replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <article 
      className="group cursor-pointer transition-all duration-500 mb-2 md:mb-0"
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] md:aspect-[16/10] overflow-hidden rounded-[2rem] md:rounded-lg mb-5 md:mb-3 bg-white shadow-md border border-emerald-50/50 flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-950/0 group-hover:bg-emerald-950/5 transition-all duration-500 z-10"></div>
        {post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-100 bg-[#fbfcfd] group-hover:bg-lime-50/30 transition-colors">
            <span className="serif italic text-sm md:text-[9px] font-black tracking-[0.4em] text-emerald-100/60 uppercase">Halezone Archive</span>
          </div>
        )}
        <div className="absolute top-4 right-4 md:top-2.5 md:right-2.5 z-20">
          <span className="bg-white/95 backdrop-blur-md px-5 py-2.5 md:px-2.5 md:py-1 rounded-lg md:rounded-md text-[11px] md:text-[8px] font-black text-emerald-900 shadow-xl border border-emerald-50/50 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 uppercase tracking-widest">
            Open Record
          </span>
        </div>
      </div>
      <div className="px-3 md:px-0.5">
        <div className="flex items-center text-[11px] md:text-[9px] font-black text-emerald-500/80 mb-2.5 md:mb-1 space-x-2 uppercase tracking-[0.2em]">
          <Calendar size={12} className="text-lime-500 md:w-2.5 md:h-2.5" />
          <span>{formattedDate}</span>
        </div>
        <h3 className="serif text-xl md:text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight md:leading-snug mb-3 md:mb-1.5">
          {post.title}
        </h3>
        <p className="text-gray-500 text-base md:text-[11px] line-clamp-2 leading-relaxed font-light">
          {cleanDescription}
        </p>
      </div>
    </article>
  );
};

export default PostCard;
