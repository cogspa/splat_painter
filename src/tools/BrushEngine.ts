
import { Vector3 } from "three";

export class BrushEngine {
    spacing = 0.05; // world units between dabs
    private lastP: Vector3 | null = null;

    beginStroke(p: Vector3) {
        this.lastP = p.clone();
        return [p.clone()];
    }

    isFirstPoint() {
        return this.lastP === null;
    }

    continueStroke(p: Vector3): Vector3[] {
        if (!this.lastP) return this.beginStroke(p);

        const out: Vector3[] = [];
        const dist = this.lastP.distanceTo(p);

        if (dist < this.spacing) return out;

        const steps = Math.floor(dist / this.spacing);
        for (let i = 1; i <= steps; i++) {
            const t = (i * this.spacing) / dist;
            const interp = new Vector3().lerpVectors(this.lastP, p, t);
            out.push(interp);
        }

        this.lastP.copy(p);
        return out;
    }

    endStroke() {
        this.lastP = null;
    }
}
