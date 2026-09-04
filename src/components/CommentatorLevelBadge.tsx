import React from 'react';
import { useApp } from '../context/AppContext';

interface CommentatorLevelBadgeProps {
  authorName: string;
  likesHint?: number;
  size?: 'xs' | 'sm';
  showTitle?: boolean;
  className?: string;
}

export const CommentatorLevelBadge: React.FC<CommentatorLevelBadgeProps> = ({
  authorName,
  likesHint = 0,
  size = 'xs',
  showTitle = false,
  className = '',
}) => {
  const { getAuthorLevel } = useApp();
  const levelInfo = getAuthorLevel(authorName, likesHint);

  const sizeClasses = size === 'xs' ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold rounded-md border ${levelInfo.bg} ${levelInfo.border} text-slate-700 dark:text-slate-200 ${sizeClasses} ${className}`}
      title={`Seviye ${levelInfo.level} • ${levelInfo.title}`}
    >
      <span>{levelInfo.badgeEmoji}</span>
      <span>Lv.{levelInfo.level}</span>
      {showTitle && <span className="font-sans font-medium text-slate-500">• {levelInfo.title}</span>}
    </span>
  );
};
