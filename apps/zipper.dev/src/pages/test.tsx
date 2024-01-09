import { Button, Dropdown } from '@zipper/ui';
import Header from '~/components/layouts/header';

export default function TestPage() {
  return (
    <div className="w-screen">
      <Button variant="secondary">hey</Button>

      <Dropdown.Root>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Label>My Account</Dropdown.Label>
          <Dropdown.Separator />
          <Dropdown.Item>Profile</Dropdown.Item>
          <Dropdown.Item>Billing</Dropdown.Item>
          <Dropdown.Item>Team</Dropdown.Item>
          <Dropdown.Item>Subscription</Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>

      <Header />
    </div>
  );
}
