import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../utils/cn';
import React, { ReactNode } from 'react';
import { Show } from './show';

const groupStyles = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },

    spacing: {
      sm: '',
      md: '',
      lg: '',
      xl: '',
    },
  },

  defaultVariants: {
    spacing: 'md',
    direction: 'row',
  },

  compoundVariants: [
    {
      direction: 'column',
      spacing: 'sm',
      className: '-space-y-5',
    },
    {
      direction: 'column',
      spacing: 'md',
      className: '-space-y-4',
    },
    {
      direction: 'column',
      spacing: 'lg',
      className: '-space-y-3',
    },
    {
      direction: 'column',
      spacing: 'xl',
      className: '-space-y-2',
    },
    {
      direction: 'row',
      spacing: 'sm',
      className: '-space-x-5',
    },
    {
      direction: 'row',
      spacing: 'md',
      className: '-space-x-4',
    },
    {
      direction: 'row',
      spacing: 'lg',
      className: '-space-x-3',
    },
    {
      direction: 'row',
      spacing: 'xl',
      className: '-spacing-x-2',
    },
  ],
});

export interface GroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof groupStyles> {
  children: React.ReactElement[];
  limit?: number;
  offset?: ReactNode;
}

export function Group({
  direction,
  spacing,
  children,
  className,
  offset,
  limit,
  ...props
}: GroupProps) {
  if (!children) {
    return null;
  }

  const execiveChildren = !!limit && children.length >= limit;

  const filteredChildren = execiveChildren
    ? children.filter((_, index) => index + 1 <= limit)
    : children;

  return (
    <div
      className={cn(groupStyles({ direction, spacing }), className)}
      {...props}
    >
      {React.Children.map(
        filteredChildren as React.ReactElement[],
        (child, index) => (
          <React.Fragment>
            {React.cloneElement(child, {
              ...child.props,
              key: index,
            })}
          </React.Fragment>
        ),
      )}
      <Show when={!!offset && execiveChildren}>{offset}</Show>
    </div>
  );
}
