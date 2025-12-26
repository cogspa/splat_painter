
import { useStore } from '../scene/store';
import type { ToolType, ModeType } from '../scene/store';
import { Paintbrush, SprayCan, Eraser, Move3d, Layers } from 'lucide-react';

export const Toolbar: React.FC = () => {
    const store = useStore();

    return (
        <div className="flex flex-col gap-4 p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Tools</label>
                <div className="grid grid-cols-1 gap-2">
                    <ToolButton
                        active={store.tool === 'spray'}
                        onClick={() => store.setTool('spray')}
                        icon={<SprayCan size={18} />}
                        label="Spray"
                    />
                    <ToolButton
                        active={store.tool === 'paint'}
                        onClick={() => store.setTool('paint')}
                        icon={<Paintbrush size={18} />}
                        label="Recolor"
                    />
                    <ToolButton
                        active={store.tool === 'eraser'}
                        onClick={() => store.setTool('eraser')}
                        icon={<Eraser size={18} />}
                        label="Erase"
                    />
                    <ToolButton
                        active={store.tool === 'shape'}
                        onClick={() => store.setTool('shape')}
                        icon={<Move3d size={18} />}
                        label="Shapes"
                    />
                </div>
            </div>

            {store.tool === 'shape' && (
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Primitive</label>
                    <div className="grid grid-cols-2 gap-1">
                        {(['sphere', 'box', 'tube', 'plane'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => store.setShapeType(s)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${store.shapeType === s ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="h-px bg-white/10 mx-1" />

            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Mode</label>
                <div className="grid grid-cols-1 gap-2">
                    <ToolButton
                        active={store.mode === 'plane'}
                        onClick={() => store.setMode('plane')}
                        icon={<Move3d size={18} />}
                        label="Ground"
                    />
                    <ToolButton
                        active={store.mode === 'depth'}
                        onClick={() => store.setMode('depth')}
                        icon={<Layers size={18} />}
                        label="Surface"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Plane</label>
                <div className="grid grid-cols-3 gap-1">
                    <button
                        onClick={() => { store.setMode('plane'); store.setPlaneAxis('x'); }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${store.mode === 'plane' && store.planeAxis === 'x' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >X</button>
                    <button
                        onClick={() => { store.setMode('plane'); store.setPlaneAxis('y'); }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${store.mode === 'plane' && store.planeAxis === 'y' ? 'bg-green-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >Y</button>
                    <button
                        onClick={() => { store.setMode('plane'); store.setPlaneAxis('z'); }}
                        className={`px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all ${store.mode === 'plane' && store.planeAxis === 'z' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >Z</button>
                </div>
                <div className="px-1 py-1">
                    <input
                        type="range" min={-5} max={5} step={0.1} value={store.planeOffset}
                        onChange={(e) => store.setPlaneOffset(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full accent-white/40"
                    />
                    <div className="flex justify-between text-[8px] text-white/20 mt-1 uppercase">
                        <span>Offset</span>
                        <span>{store.planeOffset.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/10 mx-1" />

            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Color</label>
                <input
                    type="color"
                    value={store.color}
                    onChange={(e) => store.setColor(e.target.value)}
                    className="w-full h-10 bg-transparent rounded-lg cursor-pointer overflow-hidden border-none"
                />
            </div>

            <div className="h-px bg-white/10 mx-1" />

            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-tighter text-white/40 font-bold px-1">Actions</label>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('clear-splats'))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-red-500/80 hover:text-red-500 border border-red-500/20"
                >
                    <Eraser size={18} />
                    <span className="text-sm font-medium pr-2 text-xs">Clear Scene</span>
                </button>
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        title={label}
        className={`
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
      ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'hover:bg-white/5 text-white/60 hover:text-white'}
    `}
    >
        {icon}
        <span className="text-sm font-medium pr-2">{label}</span>
    </button>
);
