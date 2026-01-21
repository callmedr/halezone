
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

  const cleanDescription = post.content
    .replace(/\[\/?(?:HL|SUB|QUOTE|IMAGE|HR)\]/gs, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <article 
      className="group cursor-pointer transition-all duration-500 mb-4"
      onClick={() => onClick(post)}
    >
      <div className="relative aspect-[16/9] md:aspect-[16/10] overflow-hidden rounded-[2.5rem] mb-6 md:mb-10 bg-white shadow-md border border-emerald-50/50 flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-950/0 group-hover:bg-emerald-950/5 transition-all duration-500 z-10"></div>
        {post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-100 bg-[#fbfcfd] group-hover:bg-lime-50/30 transition-colors">
            <span className="serif italic text-sm md:text-lg font-black tracking-[0.4em] text-emerald-100/60 uppercase">Halezone Archive</span>
          </div>
        )}
        <div className="absolute top-6 right-6 z-20">
          <span className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl text-[12px] md:text-[14px] font-black text-emerald-900 shadow-xl border border-emerald-50/50 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 uppercase tracking-widest">
            Open Record
          </span>
        </div>
      </div>
      <div className="px-4 md:px-6">
        <div className="flex items-center text-[13px] md:text-[15px] font-black text-emerald-500/80 mb-4 space-x-3 uppercase tracking-[0.2em]">
          <Calendar size={14} className="text-lime-500" />
          <span>{formattedDate}</span>
        </div>
        <h3 className="serif text-2xl md:text-4xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight md:leading-snug mb-5">
          {post.title}
        </h3>
        <p className="text-gray-500 text-lg md:text-xl line-clamp-2 leading-relaxed font-light">
          {cleanDescription}
        </p>
      </div>
    </article>
  );
};

export default PostCard;
