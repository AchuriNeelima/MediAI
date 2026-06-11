import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const FALLBACK_BACKGROUNDS = [
  'from-blue-600 to-indigo-600',
  'from-teal-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-fuchsia-600',
  'from-emerald-500 to-teal-600',
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function getBackground(name: string) {
  const hash = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_BACKGROUNDS[hash % FALLBACK_BACKGROUNDS.length];
}

interface UserAvatarProps {
  name: string;
  src?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({ name, src, className, imageClassName, fallbackClassName }: UserAvatarProps) {
  const initials = getInitials(name);
  const background = getBackground(name);

  return (
    <Avatar className={cn('overflow-hidden', className)}>
      {src && <AvatarImage src={src} alt={name} className={imageClassName} />}
      <AvatarFallback className={cn('text-white font-bold', `bg-gradient-to-br ${background}`, fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}