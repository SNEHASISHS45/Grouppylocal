import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function ImageZoomModal({ isOpen, onClose, imageSrc, alt = "Image" }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const handleWheel = (e) => {
    e.preventDefault();
    const newScale = e.deltaY > 0 
      ? Math.max(0.5, scale - 0.1) 
      : Math.min(5, scale + 0.1);
    setScale(newScale);
  };
  
  const handleDoubleClick = () => {
    if (scale !== 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };
  
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={!isDragging ? onClose : undefined}
        >
          <motion.div
            className="relative w-full h-full overflow-hidden"
            onWheel={handleWheel}
          >
            <motion.img
              src={imageSrc}
              alt={alt}
              className="absolute transform-origin-center cursor-move"
              style={{ 
                scale,
                x: position.x,
                y: position.y,
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
              drag
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              dragElastic={0.1}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDoubleClick={handleDoubleClick}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
          
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 z-50"
            onClick={onClose}
          >
            <FaTimes size={24} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/50 px-4 py-2 rounded-full text-white text-sm">
            Double-click to zoom • Scroll to adjust zoom • Drag to pan
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}