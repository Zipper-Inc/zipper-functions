/** @jsx Zipper.JSX.createElement */
// 👆🏽 ESZip will automatically insert these pragmas to make Zipper JSX work

import { Row, Column } from '../../lib/components/stack.ts';

export function handler() {
  return (
    <Row>
      <Column>test</Column>
      <Column>123</Column>
    </Row>
  );
}
