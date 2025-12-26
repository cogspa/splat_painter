
export type Splat = {
    x: number; y: number; z: number;
    r: number; g: number; b: number;
    a: number;         // opacity
    size: number;      // radius in world units
};

export class SplatStore {
    capacity: number;
    count = 0;

    // packed arrays for GPU upload
    pos: Float32Array;     // xyz
    col: Float32Array;     // rgb
    opa: Float32Array;     // a
    size: Float32Array;    // radius
    id: Uint32Array;       // stable IDs (for future use/picking)

    constructor(capacity = 150_000) {
        this.capacity = capacity;
        this.pos = new Float32Array(capacity * 3);
        this.col = new Float32Array(capacity * 3);
        this.opa = new Float32Array(capacity);
        this.size = new Float32Array(capacity);
        this.id = new Uint32Array(capacity);
    }

    addMany(splats: Splat[]) {
        const toAdd = Math.min(splats.length, this.capacity - this.count);
        for (let i = 0; i < toAdd; i++) {
            this.add(splats[i]);
        }
    }

    add(s: Splat) {
        if (this.count >= this.capacity) return -1;
        const i = this.count++;
        this.pos[i * 3 + 0] = s.x; this.pos[i * 3 + 1] = s.y; this.pos[i * 3 + 2] = s.z;
        this.col[i * 3 + 0] = s.r; this.col[i * 3 + 1] = s.g; this.col[i * 3 + 2] = s.b;
        this.opa[i] = s.a;
        this.size[i] = s.size;
        this.id[i] = i;
        return i;
    }

    paint(ids: number[], rgb: [number, number, number], strength: number) {
        const [R, G, B] = rgb;
        this.captureState(ids);
        for (const i of ids) {
            if (i < 0 || i >= this.count) continue;
            const c = i * 3;
            this.col[c + 0] += (R - this.col[c + 0]) * strength;
            this.col[c + 1] += (G - this.col[c + 1]) * strength;
            this.col[c + 2] += (B - this.col[c + 2]) * strength;
        }
    }

    erase(ids: number[], strength: number) {
        this.captureState(ids);
        for (const i of ids) {
            if (i < 0 || i >= this.count) continue;
            this.opa[i] = Math.max(0, this.opa[i] - strength);
        }
    }

    // Grouped Undo System
    private history: { type: 'add' | 'edit', count?: number, indices?: number[], oldCol?: Float32Array, oldOpa?: Float32Array }[] = [];
    private currentEdit: { indices: Set<number>, oldCol: Map<number, [number, number, number]>, oldOpa: Map<number, number> } | null = null;

    startStroke(type: 'add' | 'edit') {
        if (type === 'add') {
            this.history.push({ type: 'add', count: this.count });
        } else {
            this.currentEdit = { indices: new Set(), oldCol: new Map(), oldOpa: new Map() };
        }
    }

    private captureState(ids: number[]) {
        if (!this.currentEdit) return;
        for (const i of ids) {
            if (this.currentEdit.indices.has(i)) continue;
            this.currentEdit.indices.add(i);
            this.currentEdit.oldCol.set(i, [this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]]);
            this.currentEdit.oldOpa.set(i, this.opa[i]);
        }
    }

    endStroke() {
        if (this.currentEdit) {
            if (this.currentEdit.indices.size > 0) {
                const ids = Array.from(this.currentEdit.indices);
                const oldCol = new Float32Array(ids.length * 3);
                const oldOpa = new Float32Array(ids.length);
                for (let k = 0; k < ids.length; k++) {
                    const i = ids[k];
                    const col = this.currentEdit.oldCol.get(i)!;
                    oldCol[k * 3 + 0] = col[0];
                    oldCol[k * 3 + 1] = col[1];
                    oldCol[k * 3 + 2] = col[2];
                    oldOpa[k] = this.currentEdit.oldOpa.get(i)!;
                }
                this.history.push({ type: 'edit', indices: ids, oldCol, oldOpa });
            }
            this.currentEdit = null;
        }
    }

    undo() {
        const cmd = this.history.pop();
        if (!cmd) return;

        if (cmd.type === 'add' && cmd.count !== undefined) {
            this.count = cmd.count;
        } else if (cmd.type === 'edit' && cmd.indices && cmd.oldCol && cmd.oldOpa) {
            for (let k = 0; k < cmd.indices.length; k++) {
                const i = cmd.indices[k];
                this.col[i * 3 + 0] = cmd.oldCol[k * 3 + 0];
                this.col[i * 3 + 1] = cmd.oldCol[k * 3 + 1];
                this.col[i * 3 + 2] = cmd.oldCol[k * 3 + 2];
                this.opa[i] = cmd.oldOpa[k];
            }
        }
    }

    clear() {
        this.count = 0;
        this.history = [];
    }
}
