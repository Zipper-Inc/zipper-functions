import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import { Analytics } from '~/components/analytics';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const isHomePage = this.props.__NEXT_DATA__.page === '/home';

    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          {isHomePage && <Analytics />}
        </body>
      </Html>
    );
  }
}

export default MyDocument;
