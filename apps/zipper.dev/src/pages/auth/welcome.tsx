import FoundersNote from '~/components/founders-note';
import { NextPageWithLayout } from '../_app';

const Welcome: NextPageWithLayout = () => <FoundersNote />;

export default Welcome;

Welcome.header = () => <></>;
