import { useRef, MutableRefObject, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import * as monaco from 'monaco-editor';

import { Avatar } from '../avatar';
import { useOther } from '~/liveblocks.config';
import { Box, Divider } from '@chakra-ui/react';

export interface Position {
  lineNumber: number;
  column: number;
}

enum WidgetType {
  Avatar = 'avatar',
  Cursor = 'cursor',
}

export const selectionToPosition = (
  selection: monaco.Selection,
  type: WidgetType,
): Position => ({
  lineNumber: selection.positionLineNumber,
  column: type === 'cursor' ? selection.positionColumn : 1,
});

export class MonacoCursorWidget {
  private id: string;
  private type: WidgetType;
  private position: Position = {
    lineNumber: -1,
    column: -1,
  };
  private domNode: HTMLDivElement | undefined;

  constructor({
    id,
    selection,
    type,
  }: {
    id: number;
    selection: monaco.Selection;
    type: WidgetType;
  }) {
    this.id = id.toString();
    this.type = type;
    this.position = selectionToPosition(selection, type);
  }

  getId() {
    return `${this.type}-${this.id}`;
  }

  getDataAttr() {
    return `data-${this.type}-id`;
  }

  getType() {
    return this.type;
  }

  getPosition() {
    return {
      position: this.position,
      preference:
        this.type === WidgetType.Avatar
          ? [monaco.editor.OverlayWidgetPositionPreference.TOP_CENTER]
          : [monaco.editor.ContentWidgetPositionPreference.EXACT],
    };
  }

  getDomNode() {
    if (!this.domNode) {
      const div = document.createElement('div');
      div.setAttribute(this.getDataAttr(), this.id.toString());
      div.innerText = this.type === WidgetType.Avatar ? '😭' : '|';
      this.domNode = div;
    }
    return this.domNode;
  }

  setPosition(selection: monaco.Selection) {
    this.position = selectionToPosition(selection, this.type);
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
  const widgetRefs = useRef<Record<WidgetType, any>>();

  const getWidgets = () => Object.values(widgetRefs.current || {});

  const createWidgets = () => {
    console.log('trying create widgets', {
      w: widgetRefs.current,
      s: selection,
      e: editorRef.current,
    });
    if (widgetRefs.current || !selection || !editorRef.current) return;

    console.log('creating widgets');

    widgetRefs.current = {
      [WidgetType.Avatar]: new MonacoCursorWidget({
        id: connectionId,
        selection,
        type: WidgetType.Avatar,
      }) as unknown as monaco.editor.IOverlayWidget,
      [WidgetType.Cursor]: new MonacoCursorWidget({
        id: connectionId,
        selection,
        type: WidgetType.Cursor,
      }) as unknown as monaco.editor.IContentWidget,
    };

    editorRef.current.addOverlayWidget(widgetRefs.current[WidgetType.Avatar]);
    editorRef.current.addContentWidget(widgetRefs.current[WidgetType.Cursor]);
  };

  const moveWidgets = () => {
    console.log('trying move widgets', {
      w: widgetRefs.current,
      s: selection,
      e: editorRef.current,
    });
    if (!widgetRefs.current || !selection || !editorRef.current) return;

    console.log('moving widgets');

    widgetRefs.current[WidgetType.Avatar].setPosition(selection);
    editorRef.current.layoutOverlayWidget(
      widgetRefs.current[WidgetType.Avatar],
    );

    widgetRefs.current[WidgetType.Cursor].setPosition(selection);
    editorRef.current.layoutContentWidget(
      widgetRefs.current[WidgetType.Cursor],
    );
  };

  const destroyWidgets = () => {
    console.log('trying destroy widgets', {
      w: widgetRefs.current,
      s: selection,
      e: editorRef.current,
    });
    if (!widgetRefs.current || !editorRef.current) return;

    console.log('destroying widgets');
    editorRef.current.removeOverlayWidget(
      widgetRefs.current[WidgetType.Avatar],
    );
    editorRef.current.removeContentWidget(
      widgetRefs.current[WidgetType.Cursor],
    );

    widgetRefs.current = undefined;
  };

  // onUnmount
  useEffect(() => {
    createWidgets();
    // cleanup
    return () => destroyWidgets();
  }, []);

  useEffect(() => {
    // Create widget for the first time, and add it to editor
    if (!widgetRefs.current) createWidgets();
    else moveWidgets();
  }, [connectionId, editorRef.current, widgetRefs.current, selection]);

  return widgetRefs.current ? (
    <>
      {createPortal(
        <Avatar
          userId={userId}
          height={4}
          width={4}
          key={`${connectionId}-${WidgetType.Avatar}`}
        />,
        widgetRefs.current[WidgetType.Avatar].getDomNode(),
      )}
      {createPortal(
        <Divider
          orientation="vertical"
          display="block"
          height={2}
          width={1}
          color="red"
          key={`${connectionId}-${WidgetType.Cursor}`}
        />,
        widgetRefs.current[WidgetType.Cursor].getDomNode(),
      )}
    </>
  ) : null;
}
