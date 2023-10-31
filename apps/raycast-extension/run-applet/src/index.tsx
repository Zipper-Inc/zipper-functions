import { Form, ActionPanel, Action, LaunchProps, Detail, useNavigation, List } from "@raycast/api";
import fetch from "node-fetch";
import { useEffect } from "react";
import { BootInfoResult, InputParams } from "./types/boot-info";

type Values = {
  textfield: string;
  textarea: string;
  datepicker: Date;
  checkbox: boolean;
  dropdown: string;
  tokeneditor: string[];
};

interface AppletArguments {
  appletName: string;
  scriptName?: string;
}

export default function Command(props: LaunchProps<{ arguments: AppletArguments }>) {
  const { scriptName, appletName } = props.arguments;
  const { push } = useNavigation();

  useEffect(() => {
    async function init() {
      if (scriptName) {
        const body = JSON.stringify({ filename: "main.ts" });
        const data = await fetch(`https://zipper.dev/api/bootInfo/${appletName}`, {
          method: "POST",
          body,
        });

        const inputsJson = (await data.json()) as BootInfoResult;
        if (inputsJson.ok) {
          if (inputsJson.data.inputs.length === 0) {
            console.log("=== inputs ===", inputsJson.data.inputs.length);
            // no inputs, need to run the applet
            const appRun = await runApplet({ appletName, scriptName, appletUrlArguments: "" });
            const appJson = (await appRun.json()) as Record<string, string>;
            console.log("--- RUNNED APP ---", appJson);
            if (appJson.ok) {
              push(<AppResults appResults={appJson.data} />);
            }
          }
          push(<InputsForm inputs={inputsJson.data.inputs} handleSubmit={handleSubmit} />);
        }
      }
    }
    init();
  }, []);

  async function runApplet({
    appletName,
    scriptName,
    appletUrlArguments,
  }: {
    appletName: string;
    scriptName?: string;
    appletUrlArguments: string;
  }) {
    const response = await fetch(
      `https://${appletName}.zipper.run/${scriptName || "main.ts"}/api?${appletUrlArguments}`,
      {
        method: "GET",
      },
    );

    return response;
    // return renderMarkdown((await response.json()) as AppResult);
  }

  async function handleSubmit(values: Values) {
    const appletUrlArguments = Object.keys(values)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(values[key as keyof Values]))}`)
      .join("&");

    const response = await runApplet({
      appletName,
      scriptName,
      appletUrlArguments,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = (await response.json()) as Record<string, string>;

    push(<AppResults appResults={data.data} />);
  }

  return null;
}

const InputsForm = ({
  inputs,
  handleSubmit,
}: {
  inputs: InputParams;
  handleSubmit: (values: Values) => Promise<void>;
}) => {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {inputs.map((input) => (
        <Form.TextField key={input.key} id={input.key} title={input.key} />
      ))}
    </Form>
  );
};

interface AppResultsProps {
  appResults: Record<string, object | string | []> | string;
}

const generateListItems = (results: object | string | []) => {
  return Object.entries(results).map(([key, value]) => {
    if (key === "__meta") return null;

    let detail;
    if (typeof value === "object") {
      detail = <List.Item.Detail markdown={`\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``} />;
    } else {
      detail = <List.Item.Detail markdown={String(value)} />;
    }

    return <List.Item key={key} title={key} detail={detail} />;
  });
};

const AppResults = ({ appResults }: AppResultsProps) => {
  const data = appResults; // Directly accessing the "data" field

  if (typeof data === "string") {
    return <Detail markdown={data} />;
  }

  if (typeof data === "object") {
    return <List isShowingDetail>{generateListItems(data)}</List>;
  }

  // Handle any other unexpected data types
  return null;
};
