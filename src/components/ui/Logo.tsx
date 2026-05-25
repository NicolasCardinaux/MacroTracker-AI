import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 'w-8 h-8', text: 'text-2xl', gap: 'gap-2' },
    lg: { icon: 'w-12 h-12', text: 'text-4xl', gap: 'gap-3' },
    xl: { icon: 'w-16 h-16', text: 'text-5xl', gap: 'gap-4' },
  };

  return (
    <div className={`flex items-center ${sizes[size].gap} ${className}`}>
      {/* Icon */}
      <div className={`relative flex items-center justify-center ${sizes[size].icon}`}>
        {/* Glow */}
        <div className="absolute inset-0 bg-primary-500 blur-md opacity-30 rounded-full animate-pulse"></div>
        {/* Base Shape: Hexagon (Tech/AI) + Leaf (Nutrition/Health) */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-full h-full"
        >
          {/* Hexagon/Tech Border */}
          <path 
            d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z" 
            stroke="url(#gradientPrimary)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Inner Leaf/DNA/Evolution Line */}
          <path 
            d="M12 2V22M12 12C15 12 17.5 9.5 17.5 6.5M12 12C9 12 6.5 14.5 6.5 17.5" 
            stroke="url(#gradientAccent)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="gradientPrimary" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" /> {/* emerald-500 */}
              <stop offset="1" stopColor="#059669" /> {/* emerald-600 */}
            </linearGradient>
            <linearGradient id="gradientAccent" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" /> {/* emerald-400 */}
              <stop offset="1" stopColor="#a7f3d0" /> {/* emerald-200 */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <h1 className={`font-black tracking-tight text-white ${sizes[size].text}`}>
          Macro<span className="text-primary-500">Tracker</span> <span className="font-light text-zinc-400">AI</span>
        </h1>
      )}
    </div>
  );
};
