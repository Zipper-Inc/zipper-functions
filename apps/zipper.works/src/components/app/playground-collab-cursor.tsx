import { useRef, MutableRefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as monaco from 'monaco-editor';
import randomColor from 'randomcolor';

import { Avatar } from '../avatar';
import { useOther } from '~/liveblocks.config';
import { Box, Flex, keyframes } from '@chakra-ui/react';

const blink = keyframes`
  0% {
    opacity: 0;
  }

  100 % {
    opacity: 100%;
  }
`;
export interface Position {
  lineNumber: number;
  column: number;
}

export const selectionToPosition = (selection: monaco.Selection): Position => ({
  lineNumber: selection.positionLineNumber,
  column: selection.positionColumn,
});

export class MonacoCursorWidget {
  private id: string;
  private position: Position = {
    lineNumber: -1,
    column: -1,
  };
  private domNode: HTMLDivElement | undefined;

  constructor({ id, selection }: { id: number; selection: monaco.Selection }) {
    this.id = id.toString();
    this.position = selectionToPosition(selection);
  }

  getId() {
    return `cursor-${this.id}`;
  }

  getDataAttr() {
    return `data-cursor-id`;
  }

  getPosition() {
    return {
      position: this.position,
      preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
    };
  }

  getDomNode() {
    if (!this.domNode) {
      const div = document.createElement('div');
      div.setAttribute(this.getDataAttr(), this.id.toString());
      div.style.position = 'relative';
      this.domNode = div;
    }
    return this.domNode;
  }

  setPosition(selection: monaco.Selection) {
    this.position = selectionToPosition(selection);
  }
}

export function PlaygroundCollabCursor({
  connectionId,
  editorRef,
}: {
  connectionId: number;
  editorRef: MutableRefObject<monaco.editor.IStandaloneCodeEditor | undefined>;
}) {
  const { userId, selection } = useOther(connectionId, (u) => ({
    userId: u.id,
    selection: u.presence.selection as unknown as monaco.Selection,
  }));
  const cursorWidgetRef = useRef<MonacoCursorWidget>();
  const timeoutRef = useRef<number>();

  const [isAvatarShowing, setIsAvatarShowing] = useState(true);

  const color = randomColor({ seed: `${userId}--${connectionId}` });

  const showAvatar = () => {
    setIsAvatarShowing(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => setIsAvatarShowing(false),
      2000,
    );
  };

  const createWidget = () => {
    if (cursorWidgetRef.current || !selection || !editorRef.current) return;

    cursorWidgetRef.current = new MonacoCursorWidget({
      id: connectionId,
      selection,
    });
    editorRef.current.addContentWidget(cursorWidgetRef.current);
    showAvatar();
  };

  const moveWidget = () => {
    if (!cursorWidgetRef.current || !selection || !editorRef.current) return;

    cursorWidgetRef.current.setPosition(selection);
    editorRef.current.layoutContentWidget(cursorWidgetRef.current);
    showAvatar();
  };

  const destroyWidget = () => {
    if (!cursorWidgetRef.current || !editorRef.current) return;

    editorRef.current.removeContentWidget(cursorWidgetRef.current);
    cursorWidgetRef.current = undefined;
  };

  // onUnmount
  useEffect(() => {
    createWidget();
    // cleanup
    return () => destroyWidget();
  }, []);

  useEffect(() => {
    // Create widget for the first time, and add it to editor
    if (!cursorWidgetRef.current) createWidget();
    else moveWidget();
  }, [connectionId, editorRef.current, cursorWidgetRef.current, selection]);

  return cursorWidgetRef.current ? (
    <>
      {createPortal(
        <>
          <Flex
            position="absolute"
            top={-4}
            left="-10px"
            height={5}
            width={5}
            borderRadius="full"
            backgroundColor={color}
            justifyContent="center"
            alignItems="center"
            opacity={isAvatarShowing ? '100%' : '0%'}
            transition="opacity ease 100ms"
          >
            <Avatar userId={userId} height={4} width={4} />
          </Flex>

          <Box
            fontWeight="medium"
            position="absolute"
            top={-1}
            left={'-1px'}
            color={color}
            animation={
              isAvatarShowing ? undefined : `${blink} 1s steps(2) infinite`
            }
            onMouseEnter={showAvatar}
          >
            |
          </Box>
        </>,
        cursorWidgetRef.current?.getDomNode(),
      )}
    </>
  ) : null;
}
