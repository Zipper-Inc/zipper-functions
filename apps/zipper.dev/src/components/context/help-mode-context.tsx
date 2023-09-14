import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from 'react';

interface HelpModeContextProps {
  helpModeEnabled: boolean;
  inspectorEnabled: boolean;
  elementDescription: string | null;
  toggleHelpMode: () => void;
  toggleInspectorMode: () => void;
  setElementDescription: (description: string | null) => void;
  hoveredElement: string | null;
  setHoveredElement: React.Dispatch<React.SetStateAction<string | null>>;
}

const HelpModeContext = createContext<HelpModeContextProps | null>(null);

interface InspectableComponent {
  name: string;
  description: string;
}

interface InspectableComponents {
  [key: string]: InspectableComponent;
}

export const inspectableComponents: InspectableComponents = {
  PlaygroundSidebar: {
    name: 'Sidebar',
    description:
      'The Playground Sidebar is where you can find the code editor and the console.',
  },
  PlaygroundCode: {
    name: 'Editor',
    description: 'The Playground Code Editor is where you can write your code.',
  },
  PreviewPanel: {
    name: 'Preview',
    description: `(if lib file) Since you are not exporting a handler function, there's nothing important here.
    (if handler) You can preview the generated form for your hander function's input and actually run it here to test it out.`,
  },
  ConsoleTab: {
    name: 'Console',
    description: `Anything that you send with console.* as well as save, deploy, and other messages and/or errors that come from Zipper will show up in your Console. `,
  },
  CodeTab: {
    name: 'Code',
    description: `Edit, run, and play with this applet's code in this section.`,
  },
  ScheduleTab: {
    name: 'Schedule',
    description:
      'Use cron syntax or natural language to schedule a run for any handler in this applet.',
  },
  SecretsTab: {
    name: 'Secrets',
    description: `Secrets
      Create and manage environment secrets of this applet. Access them with Deno.env.get('YOUR_SECRET').`,
  },
  RunsTab: {
    name: 'Runs',
    description: `View this applet's run history including inputs, outputs, and who ran it.`,
  },
  VersionsTab: {
    name: 'Versions',
    description: `Publish or rollback to any saved version of this applet..`,
  },
};

export const useHelpMode = () => {
  const context = useContext(HelpModeContext);
  if (context === null) {
    throw new Error('useHelpMode must be used within a HelpModeProvider');
  }
  return context;
};

export const useHelpBorder = () => {
  const {
    helpModeEnabled,
    hoveredElement,
    setHoveredElement,
    setElementDescription,
  } = useHelpMode();

  return {
    style: (componentName: string) => ({
      border:
        helpModeEnabled && hoveredElement === componentName
          ? '4px solid #E5BEEB'
          : 'none',
      boxSizing: 'border-box', // to prevent resizing of the elements when border is applied
    }),
    onMouseEnter: (componentName: string) => () => {
      if (helpModeEnabled) {
        setHoveredElement(componentName);
        setElementDescription(
          inspectableComponents[componentName]?.description || null,
        );
      }
    },
    onMouseLeave: () => () => {
      if (helpModeEnabled) {
        setHoveredElement(null);
        setElementDescription(null);
      }
    },
  };
};

export const HelpModeProvider = ({ children }: { children: any }) => {
  const [helpModeEnabled, setHelpModeEnabled] = useState<boolean>(false);
  const [inspectorEnabled, setInspectorEnabled] = useState<boolean>(false);
  const [elementDescription, setElementDescription] = useState<string | null>(
    null,
  );
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const toggleInspectorMode = () => {
    setInspectorEnabled((prev) => !prev);
  };

  const justToggledRef = useRef(false);

  function toggleHelpMode() {
    justToggledRef.current = true;
    setHelpModeEnabled((prev) => !prev);
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (helpModeEnabled && !justToggledRef.current) {
        toggleHelpMode();
      }
      justToggledRef.current = false;
    };

    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [helpModeEnabled]);

  return (
    <HelpModeContext.Provider
      value={{
        helpModeEnabled,
        inspectorEnabled,
        elementDescription,
        toggleHelpMode,
        toggleInspectorMode,
        setElementDescription,
        hoveredElement,
        setHoveredElement,
      }}
    >
      {children}
    </HelpModeContext.Provider>
  );
};
