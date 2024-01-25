import React from 'react';
import { cn } from '../../utils/cn';

const Divider = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn('h-px w-full bg-border', className)}
    {...props}
  />
));

Divider.displayName = 'Divider';

export { Divider };
