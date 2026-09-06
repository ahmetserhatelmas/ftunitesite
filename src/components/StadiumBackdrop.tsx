import React from 'react';

const SRC = {
  night: '/bg/stadium-night.jpg',
  stands: '/bg/stadium-stands.jpg',
  pitch: '/bg/pitch.jpg',
} as const;

export const StadiumBackdrop: React.FC<{
  variant?: keyof typeof SRC;
  overlayClassName?: string;
}> = ({ variant = 'night', overlayClassName = 'bg-slate-950/68' }) => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden>
    <img src={SRC[variant]} alt="" className="h-full w-full object-cover" />
    <div className={`absolute inset-0 ${overlayClassName}`} />
  </div>
);
