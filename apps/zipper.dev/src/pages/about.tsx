import { VStack } from '@chakra-ui/react';
import Header from '~/components/header';
import { NextPageWithLayout } from './_app';
import Footer from '~/components/footer';

const variants = {
  initial: {
    clipPath: `polygon(0 0, 0% ${75}%, 100% 0%)`,
  },
  whileHover: {
    clipPath: `polygon(0 0, 0% 100%, 100% 0%)`,
  },
};

const AboutPage: NextPageWithLayout = () => {
  return (
    <>
      <VStack height="100vh">
        <Footer />
      </VStack>
    </>
  );
};

AboutPage.header = () => <Header showOrgSwitcher={true} showDivider={false} />;

export default AboutPage;
