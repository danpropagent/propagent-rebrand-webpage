import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;

      if (dotRef.current) {
        dotRef.current.style.left = `${clientX}px`;
        dotRef.current.style.top = `${clientY}px`;
      }

      if (outlineRef.current) {
        outlineRef.current.animate({
          left: `${clientX}px`,
          top: `${clientY}px`
        }, { duration: 500, fill: "forwards" });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        ref={dotRef}
        className="fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block mix-blend-difference"
      />
      <div 
        ref={outlineRef}
        className="fixed w-10 h-10 border border-white/50 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-[width,height] duration-200 hidden md:block mix-blend-difference"
      />
    </>
  );
};

export default CustomCursor;