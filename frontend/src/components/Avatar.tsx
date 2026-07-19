'use client';

import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-sm',
};

/** Circular initials badge used anywhere a participant/speaker needs a visual identity. */
export default function Avatar({ name, color, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      title={name}
      style={{ backgroundColor: color }}
      className={`
        flex flex-shrink-0 items-center justify-center rounded-full
        border-2 border-white font-semibold text-white
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}
