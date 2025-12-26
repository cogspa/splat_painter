
import { Matrix4, Vector3, Vector4 } from "three";

export function unproject(
    xPx: number, yPx: number,
    depth01: number,
    view: Matrix4, proj: Matrix4,
    viewportW: number, viewportH: number
) {
    // NDC: -1 to 1
    const x = (xPx / viewportW) * 2 - 1;
    const y = 1 - (yPx / viewportH) * 2; // Flip Y
    const z = depth01 * 2 - 1;

    const invVP = new Matrix4().multiplyMatrices(proj, view).invert();
    const p = new Vector4(x, y, z, 1).applyMatrix4(invVP);

    if (p.w === 0) return new Vector3(0, 0, 0);
    return new Vector3(p.x / p.w, p.y / p.w, p.z / p.w);
}

export function intersectPlane(
    rayOrigin: Vector3,
    rayDir: Vector3,
    axis: "x" | "y" | "z",
    offset: number
) {
    const normal = new Vector3();
    if (axis === "x") normal.set(1, 0, 0);
    else if (axis === "y") normal.set(0, 1, 0);
    else if (axis === "z") normal.set(0, 0, 1);

    const denom = normal.dot(rayDir);
    if (Math.abs(denom) < 1e-6) return null;

    const t = (offset - normal.dot(rayOrigin)) / denom;
    if (t < 0) return null;

    return new Vector3().copy(rayOrigin).add(rayDir.multiplyScalar(t));
}

export function intersectGroundPlane(
    rayOrigin: Vector3,
    rayDir: Vector3,
    planeY = 0
) {
    return intersectPlane(rayOrigin, rayDir, "y", planeY);
}

export function getRay(
    xPx: number, yPx: number,
    view: Matrix4, proj: Matrix4,
    viewportW: number, viewportH: number
) {
    const x = (xPx / viewportW) * 2 - 1;
    const y = 1 - (yPx / viewportH) * 2;

    const invVP = new Matrix4().multiplyMatrices(proj, view).invert();

    const pNear = new Vector4(x, y, -1, 1).applyMatrix4(invVP);
    const pFar = new Vector4(x, y, 1, 1).applyMatrix4(invVP);

    const near = new Vector3(pNear.x / pNear.w, pNear.y / pNear.w, pNear.z / pNear.w);
    const far = new Vector3(pFar.x / pFar.w, pFar.y / pFar.w, pFar.z / pFar.w);

    const dir = new Vector3().subVectors(far, near).normalize();
    return { origin: near, direction: dir };
}
