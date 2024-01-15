import { ChatWindow } from './ChatWindow';

export default function AgentsPage() {
  return (
    <ChatWindow
      endpoint="api/ai"
      // emptyStateComponent={InfoCard}
      showIngestForm={true}
      showIntermediateStepsToggle={true}
      emoji="🤖"
      titleText="Zippy"
    ></ChatWindow>
  );
}
