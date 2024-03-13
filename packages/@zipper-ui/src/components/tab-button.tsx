import {
  Tab,
  ChakraProps,
  UseTabOptions,
  useColorModeValue,
} from '@chakra-ui/react';
import { Badge } from './ui/common/badge';
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
      fontWeight="medium"
      position="relative"
      rounded="2px"
      _selected={{
        backgroundColor,
        textColor,
        _after: {
          position: 'absolute',
          height: '1px',
          content: "''",
          width: '100%',
          bottom: '-1rem',
          left: 0,
          background: 'primary',
          zIndex: 20,
        },
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
