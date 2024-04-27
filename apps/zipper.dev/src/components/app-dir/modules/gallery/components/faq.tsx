'use client';
import { Accordion } from '@zipper/ui';

const GalleryFAQ: React.FC = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
      <Accordion.Item value="item-1" className="border-t border-border">
        <Accordion.Trigger className="font-semibold font-sans">
          What are Applets?
        </Accordion.Trigger>
        <Accordion.Content>
          Applets are web-services that have been built and deployed on Zipper.
          Applets can be forked and customized to your needs.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger className="font-semibold font-sans">
          What is Zipper?
        </Accordion.Trigger>
        <Accordion.Content>
          Zipper is a platform for building web services using simple Typescript
          functions. We take care of UI, APIs, and auth for you.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
};

export { GalleryFAQ };
