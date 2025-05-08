import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProgressiveImage from './ProgressiveImage';

export default function MasonryPostGrid({ posts }) {
  const [columns, setColumns] = useState(3);
  
  // Responsive column adjustment
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1);
      } else if (window.innerWidth < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Distribute posts into columns
  const getPostsInColumns = () => {
    const result = Array.from({ length: columns }, () => []);
    
    posts.forEach((post, index) => {
      result[index % columns].push(post);
    });
    
    return result;
  };
  
  const columnedPosts = getPostsInColumns();
  
  return (
    <div className="flex gap-4 w-full">
      {columnedPosts.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4 flex-1">
          {column.map(post => (
            <motion.div
              key={post.id}
              className="relative rounded-xl overflow-hidden bg-[#1a1b1d] shadow-lg"
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/post/${post.id}`} className="block">
                <div className="aspect-auto min-h-[200px] bg-black flex items-center justify-center">
                  <ProgressiveImage
                    src={post.image}
                    alt={`Post by ${post.user?.displayName || 'Anonymous'}`}
                    className="w-full h-auto object-contain"
                    placeholderColor="#121212"
                  />
                </div>
                
                <div className="p-3 bg-gradient-to-b from-[#1e1f23] to-[#18191c]">
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src={post.user?.photoURL || '/default-avatar.png'} 
                      alt={post.user?.displayName || 'User'} 
                      className="w-8 h-8 rounded-full object-cover border border-purple-500"
                    />
                    <span className="text-white text-sm font-medium truncate">
                      {post.user?.displayName || 'Anonymous'}
                    </span>
                  </div>
                  
                  {post.text && (
                    <p className="text-gray-300 text-sm line-clamp-2 mt-1">
                      {post.text}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-heart"></i>
                        {post.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-comment"></i>
                        {post.commentCount || 0}
                      </span>
                    </div>
                    <span>{new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}