import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black flex justify-center w-full">
      <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-3xl min-h-screen shadow-2xl shadow-black relative overflow-hidden flex flex-col border-x border-zinc-900 z-10">
        
        {/* Ambient Glow inside the mobile frame only */}
        <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] bg-primary-500/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10 flex flex-col flex-1 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
