import { useGameStore } from "./store/gameStore";
import { MainMenu } from "./components/MainMenu";
import { Lobby } from "./components/Lobby";
import { Game } from "./components/Game";
import { Results } from "./components/Results";

export function App() {
  const phase = useGameStore((s) => s.phase);
  const inviteCode = useGameStore((s) => s.inviteCode);

  if (!inviteCode) {
    return <MainMenu />;
  }

  switch (phase) {
    case "LOBBY":
      return <Lobby />;
    case "STARTING":
    case "ACTIVE":
    case "EXTRACTION":
      return <Game />;
    case "RESULTS":
    case "FAILED":
      return <Results />;
    default:
      return <MainMenu />;
  }
}
