import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ProgressiveImage({ 
  src, 
  alt, 
  className, 
  placeholderColor = "#2d2e32",
  onLoad,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Reset states when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    setError(true);
    if (props.onError) props.onError();
  };
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Placeholder/Loading state */}
      {!isLoaded && !error && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: placeholderColor }}
        >
          <div className="w-10 h-10 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Actual image */}
      <motion.img 
        src={error ? '/placeholder-image.png' : src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  );
}