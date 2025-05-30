import React, { useRef, useState } from 'react';

interface DraggableTextOverlayProps {
  text: string;
  position: { x: number; y: number };
  color: string;
  size: number;
  rotation: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const DraggableTextOverlay: React.FC<DraggableTextOverlayProps> = ({
  text,
  position,
  color,
  size,
  rotation,
  onPositionChange,
  containerRef
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!textRef.current || !containerRef.current) return;
    
    textRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    
    const textRect = textRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    dragOffset.current = {
      x: e.clientX - (textRect.left + textRect.width / 2),
      y: e.clientY - (textRect.top + textRect.height / 2)
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !textRef.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const textRect = textRef.current.getBoundingClientRect();
    
    const newX = ((e.clientX - dragOffset.current.x - containerRect.left) / containerRect.width) * 100;
    const newY = ((e.clientY - dragOffset.current.y - containerRect.top) / containerRect.height) * 100;
    
    const textWidthPercent = (textRect.width / containerRect.width) * 100;
    const textHeightPercent = (textRect.height / containerRect.height) * 100;
    
    const paddingPercent = 2;
    
    const clampedX = Math.max(
      (textWidthPercent / 2) + paddingPercent,
      Math.min(100 - (textWidthPercent / 2) - paddingPercent, newX)
    );
    const clampedY = Math.max(
      (textHeightPercent / 2) + paddingPercent,
      Math.min(100 - (textHeightPercent / 2) - paddingPercent, newY)
    );
    
    onPositionChange({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!textRef.current) return;
    
    textRef.current.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  if (!text) return null;

  return (
    <div
      ref={textRef}
      className={`absolute cursor-move whitespace-pre-wrap break-words text-center transition-all duration-100
        ${isDragging ? 'opacity-90 scale-105 shadow-xl ring-2 ring-primary/40' : ''}`}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        color: color,
        fontSize: `${size}px`,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        maxWidth: '90%',
        padding: '8px',
        borderRadius: '4px',
        zIndex: 20,
        backgroundColor: isDragging ? 'rgba(0,0,0,0.1)' : 'transparent',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {text}
      {isDragging && (
        <>
          <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/40 rounded pointer-events-none"></div>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-blue-500 rounded-full"></div>
        </>
      )}
    </div>
  );
};
