import React, { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarGenerator } from '@/components/AvatarGenerator';
import { cn } from '@/lib/utils';

interface SmartAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
  fallbackIcon?: React.ReactNode;
}

/**
 * Size configurations for different avatar sizes
 */
const sizeConfig = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg',
};

/**
 * SmartAvatar component that shows uploaded avatar if available, 
 * otherwise falls back to name-based avatar
 */
export const SmartAvatar: FC<SmartAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className,
  showFallback = true,
  fallbackIcon
}) => {
  // If we have an uploaded avatar URL, use the shadcn Avatar component
  if (avatarUrl) {
    return (
      <Avatar className={cn(sizeConfig[size], className)}>
        <AvatarImage
          src={avatarUrl}
          alt={name}
          className="object-cover"
        />
        <AvatarFallback className="text-white font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
    );
  }

  // If no uploaded avatar, use the AvatarGenerator
  return (
    <AvatarGenerator
      name={name}
      size={size}
      className={className}
    />
  );
};

/**
 * Utility function to generate initials from a name
 */
const getInitials = (name: string): string => {
  if (!name) return '?';

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

/**
 * SmartUserAvatar with fallback to user icon when no name provided
 */
export const SmartUserAvatar: FC<SmartAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className,
  showFallback = true,
  fallbackIcon
}) => {
  if (!name && showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
          sizeConfig[size],
          className
        )}
      >
        {fallbackIcon || (
          <svg
            className="h-1/2 w-1/2"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <SmartAvatar
      name={name}
      avatarUrl={avatarUrl}
      size={size}
      className={className}
    />
  );
};
