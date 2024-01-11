import {
  Tab,
  ChakraProps,
  UseTabOptions,
  useColorModeValue,
} from '@chakra-ui/react';
import { Badge } from './ui/badge';
import Link from 'next/link';

type TabButtonProps = UseTabOptions &
  ChakraProps & {
    title: string;
    badge?: number;
    href?: string;
  };

export const TabButton: React.FC<TabButtonProps> = ({
  title,
  badge,
  href,
  ...props
}) => {
  const backgroundColor = useColorModeValue('purple.50', 'whiteAlpha.100');
  const textColor = useColorModeValue('purple.700', 'purple.300');
  const inner = (
    <>
      {title}
      {badge && <Badge className="ml-2">{badge}</Badge>}
    </>
  );

  return (
    <Tab
      px={4}
      py={2}
      _selected={{
        backgroundColor,
        fontWeight: 'bold',
        textColor,
      }}
      _hover={{
        backgroundColor,
        textColor,
      }}
      {...props}
    >
      {href ? (
        <Link shallow href={href}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Tab>
  );
};
