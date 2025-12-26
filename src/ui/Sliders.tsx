
import React from 'react';
import { useStore } from '../scene/store';

export const Sliders: React.FC = () => {
    const store = useStore();

    return (
        <div className="flex flex-col gap-6 p-6 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-64">
            <Slider
                label="Splat Size"
                value={store.brushSize}
                min={0.01} max={0.5} step={0.01}
                onChange={store.setBrushSize}
            />
            <Slider
                label="Brush Radius"
                value={store.brushRadius}
                min={0.05} max={1.0} step={0.05}
                onChange={store.setBrushRadius}
            />
            <Slider
                label="Density"
                value={store.brushDensity}
                min={1} max={20} step={1}
                onChange={store.setBrushDensity}
            />
            <Slider
                label="Opacity"
                value={store.brushOpacity}
                min={0.1} max={1.0} step={0.05}
                onChange={store.setBrushOpacity}
            />
        </div>
    );
};

const Slider: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</label>
            <span className="text-[10px] font-mono text-white/60 bg-white/5 px-1.5 py-0.5 rounded">{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full transition-all duration-200 accent-blue-500 hover:accent-blue-400"
        />
    </div>
);
