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



function PhotoFeed({ posts, onPhotoClick }) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {posts.map(post => (
        <div key={post.id} className="relative">
          <img
            src={post.imageUrl}
            alt={post.description}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover rounded-lg"
            onLoad={(e) => {
              e.target.classList.add('loaded');
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default PhotoFeed;
