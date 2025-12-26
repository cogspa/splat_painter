import { create } from "zustand";

export type ToolType = "spray" | "paint" | "eraser";
export type ModeType = "plane" | "depth";
export type PlaneAxis = "x" | "y" | "z" | "none";

interface AppState {
    tool: ToolType;
    mode: ModeType;
    planeAxis: PlaneAxis;
    planeOffset: number;
    color: string;
    brushSize: number;
    brushRadius: number; // for spray dispersion
    brushDensity: number;
    brushOpacity: number;

    setTool: (tool: ToolType) => void;
    setMode: (mode: ModeType) => void;
    setPlaneAxis: (axis: PlaneAxis) => void;
    setPlaneOffset: (offset: number) => void;
    setColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setBrushRadius: (radius: number) => void;
    setBrushDensity: (density: number) => void;
    setBrushOpacity: (opacity: number) => void;
}

export const useStore = create<AppState>((set) => ({
    tool: "spray",
    mode: "plane",
    planeAxis: "y",
    planeOffset: 0,
    color: "#ff0088",
    brushSize: 0.05,
    brushRadius: 0.2,
    brushDensity: 4,
    brushOpacity: 0.5,

    setTool: (tool) => set({ tool }),
    setMode: (mode) => set({ mode }),
    setPlaneAxis: (planeAxis) => set({ planeAxis }),
    setPlaneOffset: (planeOffset) => set({ planeOffset }),
    setColor: (color) => set({ color }),
    setBrushSize: (brushSize) => set({ brushSize }),
    setBrushRadius: (brushRadius) => set({ brushRadius }),
    setBrushDensity: (brushDensity) => set({ brushDensity }),
    setBrushOpacity: (brushOpacity) => set({ brushOpacity }),
}));
