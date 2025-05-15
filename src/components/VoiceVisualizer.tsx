"use client";

import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export default function VoiceVisualizer({ isActive }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 16; // Number of bars
    const barWidth = 4; // Width of each bar
    const barSpacing = 2; // Spacing between bars
    const maxBarHeight = canvas.height - 10;

    // Set canvas dimensions to match the parent container
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const totalWidth = bars * (barWidth + barSpacing);
      const startX = (canvas.width - totalWidth) / 2;
      
      for (let i = 0; i < bars; i++) {
        const x = startX + i * (barWidth + barSpacing);
        
        // When active, animated bars with random heights
        // When inactive, static wave pattern
        let height;
        if (isActive) {
          height = Math.random() * maxBarHeight;
        } else {
          // Create a static wave pattern when inactive
          height = Math.sin(i * 0.4) * (maxBarHeight / 4) + (maxBarHeight / 4);
        }
        
        // Draw the bar
        const y = (canvas.height - height) / 2;
        const grd = ctx.createLinearGradient(0, y, 0, y + height);
        
        if (isActive) {
          // Active gradient (blue)
          grd.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
          grd.addColorStop(1, 'rgba(37, 99, 235, 1)');
        } else {
          // Inactive gradient (gray)
          grd.addColorStop(0, 'rgba(209, 213, 219, 0.4)');
          grd.addColorStop(1, 'rgba(156, 163, 175, 0.7)');
        }
        
        ctx.fillStyle = grd;
        ctx.fillRect(x, y, barWidth, height);
        
        // Add rounded caps to the bars
        ctx.fillStyle = isActive ? 'rgba(37, 99, 235, 1)' : 'rgba(156, 163, 175, 0.7)';
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, y, barWidth / 2, 0, Math.PI * 2);
        ctx.arc(x + barWidth / 2, y + height, barWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  return (
    <div className="w-full h-16 flex items-center justify-center">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
