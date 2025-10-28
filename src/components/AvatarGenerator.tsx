import { FC } from 'react';
import { cn } from '@/lib/utils';

interface AvatarGeneratorProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

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
 * Utility function to generate a consistent color based on name
 */
const getAvatarColor = (name: string): string => {
  if (!name) return 'bg-gray-500';

  // Generate a hash from the name for consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a color index
  const colorIndex = Math.abs(hash) % 8;

  const colors = [
    'bg-blue-500',      // Blue
    'bg-blue-600',      // Blue darker
    'bg-indigo-500',    // Indigo
    'bg-indigo-600',    // Indigo darker
    'bg-sky-500',       // Sky blue
    'bg-sky-600',       // Sky blue darker
    'bg-cyan-500',      // Cyan
    'bg-cyan-600',      // Cyan darker
  ];

  return colors[colorIndex];
};

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
 * AvatarGenerator component that creates avatars from user initials
 */
export const AvatarGenerator: FC<AvatarGeneratorProps> = ({
  name,
  size = 'md',
  className
}) => {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(name);
  const sizeClasses = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full text-white font-semibold',
        backgroundColor,
        sizeClasses,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
};

/**
 * Avatar with fallback to user icon
 */
export const UserAvatar: FC<AvatarGeneratorProps & {
  showFallback?: boolean;
  fallbackIcon?: React.ReactNode;
}> = ({
  name,
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

    return <AvatarGenerator name={name} size={size} className={className} />;
  };
