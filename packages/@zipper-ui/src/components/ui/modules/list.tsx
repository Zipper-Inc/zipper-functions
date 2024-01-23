import { Slot } from '@radix-ui/react-slot';
import React, { ReactNode } from 'react';

interface ListProps<T> {
  data: T[] | undefined;
  as?: 'ul' | 'ol' | 'nav';
  children?: (props: T, index: number) => ReactNode;
  component?: (props: T, index: number) => ReactNode;
  className?: string;
}

function List<T>(props: ListProps<T>) {
  const Comp = !props.as ? React.Fragment : !!props.as ? props.as : Slot;

  return (
    <Comp {...(Comp === React.Fragment ? {} : { className: props.className })}>
      {props.data &&
        props.data.map((item, index) => {
          const key = index;

          return (
            <React.Fragment key={key}>
              {(props.component || props.children)?.(item, index)}
            </React.Fragment>
          );
        })}
    </Comp>
  );
}

export { List };
