import { useRef, useState } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import StoryboardCard from './StoryboardCard';

interface Frame {
  frame: number;
  scene: string;
  visualDescription: string;
  dialogue?: string;
  imageUrl?: string;
}

interface Storyboard {
  _id: string;
  title: string;
  description?: string;
  genre?: string;
  thumbnailUrl: string | null;
  frameCount: number;
  duration: string;
  createdAt: string;
  frames: Frame[];
  compiledVideoUrl?: string;
}

interface StoryboardRowProps {
  title: string;
  storyboards: Storyboard[];
  onCardClick: (storyboard: Storyboard) => void;
  onPlayVideo?: (videoUrl: string) => void;
}

export default function StoryboardRow({ title, storyboards, onCardClick, onPlayVideo }: StoryboardRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  if (storyboards.length === 0) return null;

  // Drag-to-scroll handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Wheel handler for horizontal scroll
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    // Allow horizontal scroll with shift+wheel or touchpad horizontal gesture
    if (e.deltaX !== 0 || e.shiftKey) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.shiftKey ? e.deltaY : e.deltaX;
    }
  };

  return (
    <div className="mb-8 w-full">
      <h2 className="text-xl font-semibold text-white mb-4 px-4 sm:px-8">{title}</h2>
      <div
        ref={scrollContainerRef}
        className="relative w-full cinema-scroll-container scrollbar-hide"
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        <div className="flex flex-nowrap gap-4 px-4 sm:px-8 pb-4">
          {storyboards.map((sb) => (
            <StoryboardCard 
              key={sb._id} 
              storyboard={sb} 
              onClick={() => onCardClick(sb)}
              onPlayVideo={onPlayVideo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
