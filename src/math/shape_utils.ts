import * as THREE from 'three';
import type { Splat } from '../scene/SplatStore';

export function generateSplatShape(
    type: 'sphere' | 'box' | 'tube' | 'plane',
    center: THREE.Vector3,
    radius: number,
    color: THREE.Color,
    opacity: number,
    splatSize: number,
    density: number
): Splat[] {
    const splats: Splat[] = [];
    const count = Math.floor(density * 100);

    for (let i = 0; i < count; i++) {
        let p = new THREE.Vector3();

        if (type === 'sphere') {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            p.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
        } else if (type === 'box') {
            // Random point on box surface
            const face = Math.floor(Math.random() * 6);
            const r1 = Math.random() * 2 - 1;
            const r2 = Math.random() * 2 - 1;
            if (face === 0) p.set(radius, r1 * radius, r2 * radius);
            else if (face === 1) p.set(-radius, r1 * radius, r2 * radius);
            else if (face === 2) p.set(r1 * radius, radius, r2 * radius);
            else if (face === 3) p.set(r1 * radius, -radius, r2 * radius);
            else if (face === 4) p.set(r1 * radius, r2 * radius, radius);
            else p.set(r1 * radius, r2 * radius, -radius);
        } else if (type === 'tube') {
            const theta = Math.random() * Math.PI * 2;
            const h = (Math.random() - 0.5) * radius * 2;
            p.set(
                radius * Math.cos(theta),
                h,
                radius * Math.sin(theta)
            );
        } else if (type === 'plane') {
            p.set(
                (Math.random() - 0.5) * radius * 2,
                0,
                (Math.random() - 0.5) * radius * 2
            );
        }

        splats.push({
            x: center.x + p.x,
            y: center.y + p.y,
            z: center.z + p.z,
            r: color.r,
            g: color.g,
            b: color.b,
            a: opacity,
            size: splatSize
        });
    }

    return splats;
}
