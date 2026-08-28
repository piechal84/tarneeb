import { useSyncExternalStore } from 'react';
import './App.css';
import BuildMenu from './components/BuildMenu';
import GameOverModal from './components/GameOverModal';
import ResourceBar from './components/ResourceBar';
import UnitPanel from './components/UnitPanel';
import { kelkaStore } from './game/store';
import GameCanvas from './render/Canvas';

export default function App() {
  useSyncExternalStore(kelkaStore.subscribeHud, kelkaStore.getHudSnapshot);

  return (
    <div className="app-root">
      <header className="title-bar">
        <h1>🌿 Kelka Frontlines</h1>
        <span className="subtitle">a Grow a Garden RTS</span>
      </header>
      <ResourceBar />
      <div className="main-area">
        <BuildMenu />
        <div className="canvas-wrap">
          <GameCanvas />
        </div>
        <UnitPanel />
      </div>
      <GameOverModal />
    </div>
  );
}
