'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '../../../utils/cn';

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: 'xs' | 'sm' | 'md';
  }
>(({ className, size = 'md', ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex shrink-0 overflow-hidden rounded-full',
      size === 'md' && 'h-9 w-9',
      size === 'sm' && 'h-6 w-6',
      size === 'xs' && 'h-4 w-4',
      className,
    )}
    {...props}
  />
));
AvatarRoot.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarBadge = ({
  className,
  status = 'online',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  status: 'online' | 'idle' | 'offline';
}) => {
  return (
    <span
      className={cn(
        'absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-background',
        status === 'online' && 'bg-success',
        status === 'offline' && 'bg-primary-red-400',
        status === 'idle' && 'bg-muted',
      )}
      {...props}
    />
  );
};

type AvatarComponent = typeof AvatarRoot & {
  Image: typeof AvatarImage;
  Fallback: typeof AvatarFallback;
  Badge: typeof AvatarBadge;
};

export const Avatar = AvatarRoot as AvatarComponent;

Avatar.Fallback = AvatarFallback;
Avatar.Image = AvatarImage;
Avatar.Badge = AvatarBadge;
