import { cn } from '../../utils/cn';
import React, { ReactNode } from 'react';

interface Group {
  children: ReactNode[];
  className?: string;
}

export function Group(props: Group) {
  return (
    <div className={cn('flex items-center relative', props?.className)}>
      {props.children.map((child, index) => (
        <div key={index} className={cn(`z-${index + 1} -ml-2`)}>
          {child}
        </div>
      ))}
    </div>
  );
}
