import { Slot } from '@radix-ui/react-slot';
import { ReactNode } from 'react';

interface ListProps<T> {
  data: T[];
  type?: 'ordered' | 'unordered';
  children: (props: T) => ReactNode;
  component?: (props: T) => ReactNode;
}

function List<T>(props: ListProps<T>) {
  const Comp = !props.type ? Slot : props.type === 'unordered' ? 'ul' : 'ol';
  return (
    <Comp>
      {props.data.map((item, index) => (
        <li key={index}>
          {props.component ? props.component(item) : props.children(item)}
        </li>
      ))}
    </Comp>
  );
}

export { List };
