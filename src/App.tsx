
import React from 'react';
import { GLCanvas } from './gl/GLCanvas';
import { Toolbar } from './ui/Toolbar';
import { Sliders } from './ui/Sliders';

function App() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex">
      {/* Background Canvas */}
      <GLCanvas />

      {/* Floating UI: Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-4">
        <Toolbar />
      </div>

      {/* Floating UI: Right */}
      <div className="absolute top-4 right-4 flex flex-col gap-4">
        <Sliders />
      </div>

      {/* App Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <h1 className="text-white/20 text-sm font-bold tracking-[0.5em] uppercase">Splat Painter</h1>
      </div>
    </div>
  );
}

export default App;
