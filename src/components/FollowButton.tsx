import React, { useState } from 'react';
import { UserPlus, UserCheck, Check, UserMinus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FollowButtonProps {
  authorName?: string;
  targetAuthorName?: string;
  authorAvatar?: string;
  targetAvatar?: string;
  authorFanOf?: string;
  targetFanOf?: string;
  authorTeamId?: string;
  targetTeamId?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'light' | 'dark' | 'emerald' | 'subtle';
  theme?: 'light' | 'dark';
  className?: string;
  showText?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  authorName,
  targetAuthorName,
  authorAvatar,
  targetAvatar,
  authorFanOf,
  targetFanOf,
  authorTeamId,
  targetTeamId,
  size = 'xs',
  variant,
  theme,
  className = '',
  showText = true,
}) => {
  const { isFollowingUser, toggleFollowUser, userProfile } = useApp();
  const [isHovered, setIsHovered] = useState(false);

  const effectiveName = (authorName || targetAuthorName || '').trim();
  const effectiveAvatar = authorAvatar || targetAvatar;
  const effectiveFanOf = authorFanOf || targetFanOf;
  const effectiveTeamId = authorTeamId || targetTeamId;
  const effectiveVariant = variant || (theme === 'dark' ? 'dark' : 'light');

  if (!effectiveName) return null;

  // Don't show follow button for self
  const isSelf =
    effectiveName.toLowerCase() === userProfile.name?.trim().toLowerCase() ||
    (userProfile.nickname && effectiveName.toLowerCase() === userProfile.nickname.trim().toLowerCase());

  if (isSelf) return null;

  const isFollowing = isFollowingUser(effectiveName);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFollowUser(effectiveName, {
      avatar: effectiveAvatar,
      fanOf: effectiveFanOf,
      teamId: effectiveTeamId,
    });
  };

  // Size styling
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1 rounded-lg font-bold',
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl font-bold',
    md: 'px-3.5 py-1.5 text-xs gap-2 rounded-xl font-black',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  // Variant styling
  let styleClasses = '';
  if (isFollowing) {
    if (isHovered) {
      styleClasses = 'bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white shadow-2xs';
    } else {
      styleClasses = effectiveVariant === 'dark'
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-2xs'
        : 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs';
    }
  } else {
    if (effectiveVariant === 'dark') {
      styleClasses = 'bg-slate-800/90 text-slate-200 border border-slate-600/70 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 shadow-2xs';
    } else if (effectiveVariant === 'emerald') {
      styleClasses = 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs';
    } else if (effectiveVariant === 'subtle') {
      styleClasses = 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-200/80 shadow-2xs';
    } else {
      // light default
      styleClasses = 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 shadow-2xs';
    }
  }

  return (
    <button
      type="button"
      id={`follow-btn-${effectiveName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`inline-flex items-center justify-center tracking-tight transition-all duration-150 cursor-pointer shrink-0 ${sizeClasses} ${styleClasses} ${className}`}
      title={isFollowing ? `${effectiveName} takipten çıkar` : `${effectiveName} takip et`}
    >
      {isFollowing ? (
        isHovered ? (
          <>
            <UserMinus className={iconSizes} />
            {showText && <span>Bırak</span>}
          </>
        ) : (
          <>
            <UserCheck className={iconSizes} />
            {showText && <span>Takipte</span>}
          </>
        )
      ) : (
        <>
          <UserPlus className={iconSizes} />
          {showText && <span>Takip Et</span>}
        </>
      )}
    </button>
  );
};
