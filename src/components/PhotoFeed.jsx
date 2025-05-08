import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { FaHeart, FaComment, FaBookmark, FaShare } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Cache utility functions
const imageCache = {
  get: (key) => {
    try {
      const cachedData = localStorage.getItem(`img_cache_${key}`);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache expires after 24 hours
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`img_cache_${key}`);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  },
  set: (key, data) => {
    try {
      localStorage.setItem(`img_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting cache:', error);
      // If localStorage is full, clear older items
      if (error.name === 'QuotaExceededError') {
        clearOldCache();
      }
    }
  }
};

// Clear older cache items if storage is full
const clearOldCache = () => {
  const cacheKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('img_cache_')) {
      cacheKeys.push(key);
    }
  }
  
  // Sort by timestamp and remove oldest 20%
  if (cacheKeys.length > 0) {
    const sortedKeys = cacheKeys.sort((a, b) => {
      const aData = JSON.parse(localStorage.getItem(a));
      const bData = JSON.parse(localStorage.getItem(b));
      return aData.timestamp - bData.timestamp;
    });
    
    const toRemove = Math.max(1, Math.floor(sortedKeys.length * 0.2));
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(sortedKeys[i]);
    }
  }
};



const PhotoFeed = ({ posts, onPhotoClick }) => {
  const [hoveredPost, setHoveredPost] = useState(null);
  const [imageAspectRatios, setImageAspectRatios] = useState({});
  const [imageDimensions, setImageDimensions] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [visiblePosts, setVisiblePosts] = useState([]);
  const [focusedPost, setFocusedPost] = useState(null);
  const [cachedImages, setCachedImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef(null);
  const observerRef = useRef(null);
  const imageObserverRef = useRef(null);


    // Remove all other loading effects and keep only this one
    useEffect(() => {
      if (posts && Array.isArray(posts)) {
        setIsLoading(false);
      }
    }, [posts]);

  // Preload images that are in viewport
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      imageObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const postId = entry.target.dataset.postId;
              const post = posts.find(p => p.id === postId);
              
              if (post && post.image) {
                // Check if image is already in memory cache
                if (!cachedImages[post.id]) {
                  // Check localStorage cache first
                  const cachedData = imageCache.get(post.id);
                  
                  if (cachedData) {
                    // Use cached aspect ratio and mark as loaded
                    setImageAspectRatios(prev => ({...prev, [post.id]: cachedData.aspectRatio}));
                    setImagesLoaded(prev => ({...prev, [post.id]: true}));
                    setCachedImages(prev => ({...prev, [post.id]: true}));
                  } else {
                    // Load image if not in cache
                    const img = new Image();
                    img.onload = () => {
                      const aspectRatio = img.width / img.height;
                      
                      // Store in state
                      setImageDimensions(prev => ({...prev, [post.id]: { width: img.width, height: img.height }}));
                      setImageAspectRatios(prev => ({...prev, [post.id]: aspectRatio}));
                      setImagesLoaded(prev => ({...prev, [post.id]: true}));
                      
                      // Store in localStorage cache
                      imageCache.set(post.id, {
                        aspectRatio,
                        dimensions: { width: img.width, height: img.height }
                      });
                      
                      setCachedImages(prev => ({...prev, [post.id]: true}));
                    };
                    
                    // Add error handling
                    img.onerror = () => {
                      setImagesLoaded(prev => ({...prev, [post.id]: true}));
                      console.error(`Failed to load image for post ${post.id}`);
                    };
                    
                    // Set src to start loading
                    img.src = post.image;
                  }
                }
              }
            }
          });
        },
        { 
          rootMargin: "200px 0px", // Start loading images 200px before they enter viewport
          threshold: 0.01
        }
      );
      
      // Observe all post elements for image preloading
      const postElements = document.querySelectorAll('.post-item');
      postElements.forEach(el => imageObserverRef.current.observe(el));
      
      return () => {
        if (imageObserverRef.current) {
          imageObserverRef.current.disconnect();
        }
      };
    }
  }, [posts, cachedImages]);

  // Set up intersection observer for animation on scroll
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const postId = entry.target.dataset.postId;
              if (postId && !visiblePosts.includes(postId)) {
                setVisiblePosts(prev => [...prev, postId]);
              }
              
              // Set focused post based on visibility ratio
              if (entry.intersectionRatio > 0.8) {
                setFocusedPost(postId);
              }
            }
          });
        },
        { 
          threshold: [0.1, 0.5, 0.8, 1.0],
          rootMargin: "0px 0px -10% 0px"
        }
      );

      // Observe all post elements
      const postElements = document.querySelectorAll('.post-item');
      postElements.forEach(el => observerRef.current.observe(el));

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [posts, visiblePosts]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  // Determine if image is landscape, portrait, or square
  const getImageOrientation = (aspectRatio) => {
    if (!aspectRatio) return 'square';
    if (aspectRatio > 1.2) return 'landscape';
    if (aspectRatio < 0.8) return 'portrait';
    return 'square';
  };

  // Calculate optimal height for different image types - INCREASED HEIGHTS
  const getOptimalHeight = (orientation) => {
    switch (orientation) {
      case 'landscape': return '260px'; // Increased from 220px
      case 'portrait': return '380px';  // Increased from 320px
      case 'square': return '300px';    // Increased from 260px
      default: return '280px';          // Increased from 240px
    }
  };

  // Custom loading animation component with improved performance
  const LoadingAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 backdrop-blur-[2px]">
      <svg className="w-12 h-12" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="rgba(168, 85, 247, 0.4)"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#a855f7"
          strokeWidth="4"
          strokeDasharray="80"
          strokeDashoffset="60"
          className="animate-[dash_1.5s_ease-in-out_infinite]"
        />
      </svg>
    </div>
  );



  // Keep only one simple loading effect:
  useEffect(() => {
    setIsLoading(!posts?.length);
  }, [posts]);

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b black min-h-screen">
      <motion.div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 auto-rows-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence>
          {posts?.filter(post => post.image).map((post) => {
            const aspectRatio = imageAspectRatios[post.id];
            const orientation = getImageOrientation(aspectRatio);
            const isFocused = focusedPost === post.id;
            const isVisible = visiblePosts.includes(post.id);
            
            // Determine grid span based on orientation - ADJUSTED FOR BETTER FIT
            const gridClass = orientation === 'landscape' 
              ? 'sm:col-span-2 row-span-1' 
              : orientation === 'portrait'
                ? 'col-span-1 row-span-2'
                : 'col-span-1 row-span-1';
                
            return (
              <motion.div
                key={post.id}
                data-post-id={post.id}
                className={`relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-900 to-black group ${gridClass} post-item`}
                style={{
                  height: getOptimalHeight(orientation),
                  maxWidth: '100%',
                }}
                variants={itemVariants}
                initial="hidden"
                animate={isVisible ? "show" : "hidden"}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
                  transition: { duration: 0.3 }
                }}
                onHoverStart={() => setHoveredPost(post.id)}
                onHoverEnd={() => setHoveredPost(null)}
                onClick={() => onPhotoClick(post)}
                layoutId={`post-${post.id}`}
              >
                {/* Loading indicator - using SVG for better performance */}
                {!imagesLoaded[post.id] && <LoadingAnimation />}
                
                {/* Image container with proper aspect ratio preservation */}
                <motion.div 
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  initial={{ filter: 'blur(8px)', scale: 1.05 }}
                  animate={{ 
                    filter: imagesLoaded[post.id] ? 'blur(0px)' : 'blur(8px)',
                    scale: imagesLoaded[post.id] ? 1 : 1.05,
                    transition: { duration: 0.4, ease: "easeOut" }
                  }}
                >
                  <motion.img
                    src={post.image}
                    alt={post.text || "Post image"}
                    className="w-full h-full object-contain md:object-cover transition-all duration-500"
                    style={{ 
                      filter: isFocused ? 'brightness(1.05) contrast(1.05)' : 'brightness(0.85) contrast(1.0)',
                    }}
                    animate={{
                      scale: hoveredPost === post.id ? 1.05 : isFocused ? 1.02 : 1,
                      transition: { duration: 0.5, ease: "easeOut" }
                    }}
                    loading="lazy"
                    decoding="async"
                    fetchpriority={isVisible ? "high" : "low"}
                    onLoad={() => {
                      setImagesLoaded(prev => ({...prev, [post.id]: true}));
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.png';
                      setImagesLoaded(prev => ({...prev, [post.id]: true}));
                    }}
                  />
                </motion.div>

                {/* User profile info - always visible */}
                <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent flex items-center gap-2 z-10">
                  {/* Make profile picture clickable */}
                  <Link 
                    to={`/profile/${post.user?.uid}`}
                    onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
                    className="cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <motion.img 
                      src={post.user?.photoURL || '/default-avatar.png'} 
                      alt={post.user?.displayName || "User"} 
                      className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg"
                      whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                      animate={{ 
                        borderColor: isFocused ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                        transition: { duration: 0.3 }
                      }}
                      loading="lazy"
                    />
                  </Link>
                  
                  {/* Make username clickable */}
                  <Link 
                    to={`/profile/${post.user?.uid}`}
                    onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
                    className="text-white font-medium text-sm truncate hover:underline cursor-pointer"
                  >
                    <motion.span
                      animate={{ 
                        color: isFocused ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
                        textShadow: isFocused ? '0 0 8px rgba(168, 85, 247, 0.5)' : 'none',
                        transition: { duration: 0.3 }
                      }}
                    >
                      {post.user?.displayName || "Anonymous"}
                    </motion.span>
                  </Link>
                </div>

                {/* Gradient overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />

                {/* Post info overlay */}
                <motion.div 
                  className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                >
                  {/* Bottom section - Post stats */}
                  <motion.div 
                    className="flex justify-between items-end mt-auto"
                    initial={{ y: 20, opacity: 0 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex gap-3">
                      <motion.div 
                        className="flex items-center gap-1 text-white text-xs md:text-sm"
                        whileHover={{ scale: 1.1, color: "#f472b6" }}
                      >
                        <FaHeart className="text-pink-500" />
                        <span>{post.likes?.length || 0}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-1 text-white text-xs md:text-sm"
                        whileHover={{ scale: 1.1, color: "#60a5fa" }}
                      >
                        <FaComment className="text-blue-400" />
                        <span>{post.comments?.length || 0}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center gap-1 text-white text-xs md:text-sm"
                        whileHover={{ scale: 1.1, color: "#34d399" }}
                      >
                        <FaShare className="text-green-400" />
                      </motion.div>
                    </div>
                    {post.text && (
                      <motion.div 
                        className="max-w-[80%] line-clamp-2 text-white text-xs md:text-sm font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {post.text}
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Focus indicator */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ 
                    boxShadow: isFocused ? 'inset 0 0 0 3px rgba(168, 85, 247, 0.6)' : 'inset 0 0 0 0px transparent',
                    transition: { duration: 0.4 }
                  }}
                />
                
                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
                  initial={{ left: '-100%', opacity: 0 }}
                  whileHover={{ 
                    left: '100%', 
                    opacity: 0.5,
                    transition: { duration: 0.8, ease: "easeInOut" }
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PhotoFeed;
