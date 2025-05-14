import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoverFlowSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface CoverFlowProps {
  sections: CoverFlowSection[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
}

const CoverFlow: React.FC<CoverFlowProps> = ({ sections, activeIndex, onIndexChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the position and rotation for each item
  const getItemStyle = (index: number) => {
    const isActive = index === activeIndex;
    const diff = index - activeIndex;
    
    // Position items in a 3D space
    return {
      zIndex: isActive ? 10 : 10 - Math.abs(diff),
      opacity: isActive ? 1 : 0.7 - Math.min(Math.abs(diff) * 0.15, 0.6),
      scale: isActive ? 1 : 0.85 - Math.min(Math.abs(diff) * 0.05, 0.3),
      x: diff * -50, // Horizontal offset
      rotateY: diff * 45, // Rotation around Y axis
      filter: isActive ? 'none' : 'brightness(0.7)',
    };
  };

  // Navigate through the coverflow
  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeIndex > 0) {
      onIndexChange(activeIndex - 1);
    } else if (direction === 'next' && activeIndex < sections.length - 1) {
      onIndexChange(activeIndex + 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col" ref={containerRef}>
      {/* Cover Flow Carousel */}
      <div className="flex-1 relative overflow-hidden" style={{ perspective: '1200px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                className={`absolute w-[80%] h-[80%] bg-gradient-to-br border border-white/20 backdrop-blur-sm shadow-2xl cursor-pointer
                  ${index === activeIndex ? 
                    'from-indigo-600/30 to-purple-600/30' : 
                    'from-slate-800/30 to-slate-900/30'}`}
                style={{ 
                  borderRadius: '16px', 
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center center',
                }}
                animate={getItemStyle(index)}
                transition={{ 
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
                onClick={() => onIndexChange(index)}
              >
                {/* Content */}
                <div className="absolute inset-0 p-6 overflow-auto">
                  <h3 className="text-xl font-semibold text-white/90 mb-4 flex items-center">
                    <div className="p-2 bg-white/10 rounded-full mr-2">
                      <span className="text-white/80">{index + 1}</span>
                    </div>
                    {section.title}
                  </h3>
                  <div>{section.content}</div>
                </div>

                {/* Reflection effect */}
                <div 
                  className="absolute left-0 right-0 bottom-0 h-[30%] opacity-40" 
                  style={{ 
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1))',
                    transform: 'rotateX(180deg) translateY(1px)',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)'
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 pb-6 pt-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full disabled:opacity-50"
          onClick={() => navigate('prev')}
          disabled={activeIndex === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
        
        <div className="text-white/80">
          {activeIndex + 1} / {sections.length}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full disabled:opacity-50"
          onClick={() => navigate('next')}
          disabled={activeIndex === sections.length - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default CoverFlow;