
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Renderer } from './Renderer';
import { SplatStore } from '../scene/SplatStore';
import { useStore } from '../scene/store';
import { BrushEngine } from '../tools/BrushEngine';
import { getRay, intersectPlane, unproject } from '../math/math_utils';
import idVert from './shaders/id.vert.glsl?raw';
import idFrag from './shaders/id.frag.glsl?raw';
import planeVert from './shaders/plane.vert.glsl?raw';
import planeFrag from './shaders/plane.frag.glsl?raw';
import cursorVert from './shaders/cursor.vert.glsl?raw';
import cursorFrag from './shaders/cursor.frag.glsl?raw';

export const GLCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const store = useStore();

    // Scene objects
    const splatStore = useRef(new SplatStore(300000));
    const renderer = useRef<Renderer | null>(null);
    const brushEngine = useRef(new BrushEngine());

    // Three.js basic setup for camera/math
    const camera = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
    const controls = useRef<OrbitControls | null>(null);

    // ID Pass State
    const idProg = useRef<WebGLProgram | null>(null);
    const uIdView = useRef<WebGLUniformLocation | null>(null);
    const uIdProj = useRef<WebGLUniformLocation | null>(null);
    const idFbo = useRef<WebGLFramebuffer | null>(null);
    const idTex = useRef<WebGLTexture | null>(null);
    const depthTex = useRef<WebGLTexture | null>(null);

    // Plane rendering state
    const planeProg = useRef<WebGLProgram | null>(null);
    const planeVao = useRef<WebGLVertexArrayObject | null>(null);

    // Cursor state
    const cursorProg = useRef<WebGLProgram | null>(null);
    const [cursorPos, setCursorPos] = useState<THREE.Vector3 | null>(null);

    const [fps, setFps] = useState(0);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const gl = canvasRef.current.getContext('webgl2', { antialias: true, alpha: false });
        if (!gl) {
            alert("WebGL2 not supported");
            return;
        }

        renderer.current = new Renderer(gl);

        // Setup ID pass program
        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, idVert);
        gl.compileShader(vs);
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, idFrag);
        gl.compileShader(fs);
        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        idProg.current = prog;
        uIdView.current = gl.getUniformLocation(prog, "uView");
        uIdProj.current = gl.getUniformLocation(prog, "uProj");

        // Setup Plane program
        const pvs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(pvs, planeVert);
        gl.compileShader(pvs);
        const pfs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(pfs, planeFrag);
        gl.compileShader(pfs);
        planeProg.current = gl.createProgram()!;
        gl.attachShader(planeProg.current, pvs);
        gl.attachShader(planeProg.current, pfs);
        gl.linkProgram(planeProg.current);

        const pVao = gl.createVertexArray();
        gl.bindVertexArray(pVao);
        const pBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
        // Large quad for the plane
        const pSize = 50;
        const pVerts = new Float32Array([
            -pSize, 0, -pSize,
            pSize, 0, -pSize,
            pSize, 0, pSize,
            -pSize, 0, pSize
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, pVerts, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);
        planeVao.current = pVao;

        // Setup Cursor program
        const cvs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(cvs, cursorVert);
        gl.compileShader(cvs);
        const cfs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(cfs, cursorFrag);
        gl.compileShader(cfs);
        cursorProg.current = gl.createProgram()!;
        gl.attachShader(cursorProg.current, cvs);
        gl.attachShader(cursorProg.current, cfs);
        gl.linkProgram(cursorProg.current);

        camera.current.position.set(2, 2, 5);
        camera.current.lookAt(0, 0, 0);

        controls.current = new OrbitControls(camera.current, canvasRef.current);
        controls.current.enableDamping = true;
        controls.current.mouseButtons = {
            LEFT: -1 as any,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };

        const handleResize = () => {
            const w = containerRef.current!.clientWidth;
            const h = containerRef.current!.clientHeight;
            canvasRef.current!.width = w;
            canvasRef.current!.height = h;
            gl.viewport(0, 0, w, h);
            camera.current.aspect = w / h;
            camera.current.updateProjectionMatrix();

            // Recreate FBO
            if (idFbo.current) gl.deleteFramebuffer(idFbo.current);
            if (idTex.current) gl.deleteTexture(idTex.current);
            if (depthTex.current) gl.deleteTexture(depthTex.current);

            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, w, h, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            idTex.current = tex;

            const dTex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, dTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dTex, 0);
            depthTex.current = dTex;

            idFbo.current = fbo;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        };

        const handleClear = () => {
            splatStore.current.clear();
            renderer.current?.upload(splatStore.current);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'x') { store.setMode('plane'); store.setPlaneAxis('x'); }
            if (e.key.toLowerCase() === 'y') { store.setMode('plane'); store.setPlaneAxis('y'); }
            if (e.key.toLowerCase() === 'z' && !e.metaKey && !e.ctrlKey) { store.setMode('plane'); store.setPlaneAxis('z'); }
            if (e.key.toLowerCase() === 's') { store.setMode('depth'); }

            // Undo: Cmd/Ctrl + Z
            if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                splatStore.current.undo();
                renderer.current?.upload(splatStore.current);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('clear-splats', handleClear);
        window.addEventListener('keydown', handleKeyDown);
        handleResize();

        let lastTime = performance.now();
        let frames = 0;

        const loop = (time: number) => {
            frames++;
            if (time > lastTime + 1000) {
                setFps(Math.round((frames * 1000) / (time - lastTime)));
                lastTime = time;
                frames = 0;
            }

            controls.current?.update();

            const view = camera.current.matrixWorldInverse.elements;
            const proj = camera.current.projectionMatrix.elements;

            // Draw ID/Depth pass
            gl.bindFramebuffer(gl.FRAMEBUFFER, idFbo.current);
            gl.clearBufferuiv(gl.COLOR, 0, new Uint32Array([0, 0, 0, 0]));
            gl.clearBufferfv(gl.DEPTH, 0, new Float32Array([1.0]));
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);

            gl.useProgram(idProg.current);
            gl.uniformMatrix4fv(uIdView.current, false, view);
            gl.uniformMatrix4fv(uIdProj.current, false, proj);

            gl.bindVertexArray(renderer.current!.vao);
            gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, splatStore.current.count);

            // Main Pass
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clearColor(0.05, 0.05, 0.05, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            renderer.current?.draw(
                new Float32Array(view),
                new Float32Array(proj),
                splatStore.current.count
            );

            // Draw Active Plane
            if (store.mode === 'plane' && store.planeAxis !== 'none') {
                gl.useProgram(planeProg.current!);
                const uView = gl.getUniformLocation(planeProg.current!, "uView");
                const uProj = gl.getUniformLocation(planeProg.current!, "uProj");
                const uModel = gl.getUniformLocation(planeProg.current!, "uModel");
                const uColor = gl.getUniformLocation(planeProg.current!, "uColor");
                const uPlaneAxis = gl.getUniformLocation(planeProg.current!, "uPlaneAxis");

                gl.uniformMatrix4fv(uView, false, view);
                gl.uniformMatrix4fv(uProj, false, proj);

                const model = new THREE.Matrix4();
                if (store.planeAxis === 'x') {
                    model.makeRotationZ(Math.PI / 2);
                    model.setPosition(store.planeOffset, 0, 0);
                    gl.uniform3f(uColor, 1.0, 0.2, 0.2);
                    gl.uniform3f(uPlaneAxis, 1, 0, 0);
                } else if (store.planeAxis === 'y') {
                    model.setPosition(0, store.planeOffset, 0);
                    gl.uniform3f(uColor, 0.2, 1.0, 0.2);
                    gl.uniform3f(uPlaneAxis, 0, 1, 0);
                } else if (store.planeAxis === 'z') {
                    model.makeRotationX(Math.PI / 2);
                    model.setPosition(0, 0, store.planeOffset);
                    gl.uniform3f(uColor, 0.2, 0.2, 1.0);
                    gl.uniform3f(uPlaneAxis, 0, 0, 1);
                }

                gl.uniformMatrix4fv(uModel, false, model.elements);
                gl.bindVertexArray(planeVao.current);
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                gl.bindVertexArray(null);
            }

            // Draw Brush Cursor
            if (cursorPos) {
                gl.useProgram(cursorProg.current!);
                const uView = gl.getUniformLocation(cursorProg.current!, "uView");
                const uProj = gl.getUniformLocation(cursorProg.current!, "uProj");
                const uPos = gl.getUniformLocation(cursorProg.current!, "uPos");
                const uSize = gl.getUniformLocation(cursorProg.current!, "uSize");
                const uColor = gl.getUniformLocation(cursorProg.current!, "uColor");

                gl.uniformMatrix4fv(uView, false, view);
                gl.uniformMatrix4fv(uProj, false, proj);
                gl.uniform3f(uPos, cursorPos.x, cursorPos.y, cursorPos.z);
                gl.uniform1f(uSize, store.brushRadius);
                gl.uniform3f(uColor, 1, 1, 1);

                gl.bindVertexArray(renderer.current!.vao); // reuse corner buffer (location 0)
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                gl.bindVertexArray(null);
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('clear-splats', handleClear);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [store.planeAxis, store.planeOffset, store.mode]); // Re-bind keys if store setters change (though they are stable)

    const isPainting = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        isPainting.current = true;
        if (e.button === 0) { // Left click
            splatStore.current.startStroke(store.tool === 'spray' ? 'add' : 'edit');
            processStroke(e);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        updateCursor(e);
        if (isPainting.current) {
            processStroke(e);
        }
    };

    const updateCursor = (e: React.PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gl = canvasRef.current!.getContext('webgl2')!;
        const glY = rect.height - y;

        let p: THREE.Vector3 | null = null;
        if (store.mode === 'plane') {
            const ray = getRay(x, y, camera.current.matrixWorldInverse, camera.current.projectionMatrix, rect.width, rect.height);
            p = intersectPlane(ray.origin, ray.direction, store.planeAxis === 'none' ? 'y' : store.planeAxis as any, store.planeOffset);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, idFbo.current);
            const depthData = new Uint32Array(1);
            gl.readPixels(x, glY, 1, 1, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, depthData);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            const d = depthData[0] / 0xFFFFFFFF;
            if (d < 1.0) {
                p = unproject(x, y, d, camera.current.matrixWorldInverse, camera.current.projectionMatrix, rect.width, rect.height);
            }
        }
        setCursorPos(p);
    };

    const handlePointerUp = () => {
        isPainting.current = false;
        splatStore.current.endStroke();
        brushEngine.current.endStroke();
    };

    const processStroke = (e: React.PointerEvent) => {
        const gl = canvasRef.current!.getContext('webgl2')!;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const glY = rect.height - y; // WebGL Y is bottom-up

        let p: THREE.Vector3 | null = null;

        if (store.mode === 'plane') {
            const ray = getRay(x, y, camera.current.matrixWorldInverse, camera.current.projectionMatrix, rect.width, rect.height);
            p = intersectPlane(ray.origin, ray.direction, store.planeAxis === 'none' ? 'y' : store.planeAxis as any, store.planeOffset);
        } else {
            // Depth mode: read depth from texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, idFbo.current);
            const depthData = new Uint32Array(1);
            gl.readPixels(x, glY, 1, 1, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, depthData);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            const d = depthData[0] / 0xFFFFFFFF;
            if (d < 1.0) {
                p = unproject(x, y, d, camera.current.matrixWorldInverse, camera.current.projectionMatrix, rect.width, rect.height);
            }
        }

        if (!p) return;

        const dabs = brushEngine.current.continueStroke(p);
        if (dabs.length === 0) return;

        const rgb = new THREE.Color(store.color);

        if (store.tool === 'spray') {
            for (const dab of dabs) {
                const batch = [];
                for (let i = 0; i < store.brushDensity; i++) {
                    const theta = Math.random() * Math.PI * 2;
                    const rr = Math.sqrt(Math.random()) * store.brushRadius;
                    batch.push({
                        x: dab.x + Math.cos(theta) * rr,
                        y: dab.y + (Math.random() - 0.5) * store.brushRadius * 0.2, // slight jitter in Y
                        z: dab.z + Math.sin(theta) * rr,
                        r: rgb.r, g: rgb.g, b: rgb.b,
                        a: store.brushOpacity,
                        size: store.brushSize * (0.8 + Math.random() * 0.4)
                    });
                }
                splatStore.current.addMany(batch);
            }
        } else {
            // Recolor or Erase: Read IDs in a small radius
            const radiusPx = Math.max(1, Math.round(store.brushRadius * 50)); // heuristic mapping
            const size = radiusPx * 2;
            const startX = Math.round(x - radiusPx);
            const startY = Math.round(glY - radiusPx);

            gl.bindFramebuffer(gl.FRAMEBUFFER, idFbo.current);
            const idData = new Uint32Array(size * size);
            gl.readPixels(startX, startY, size, size, gl.RED_INTEGER, gl.UNSIGNED_INT, idData);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            const uniqueIds = new Set<number>();
            for (let i = 0; i < idData.length; i++) {
                if (idData[i] > 0) uniqueIds.add(idData[i] - 1);
            }

            if (uniqueIds.size > 0) {
                const ids = Array.from(uniqueIds);
                if (store.tool === 'paint') {
                    splatStore.current.paint(ids, [rgb.r, rgb.g, rgb.b], 0.1);
                } else if (store.tool === 'eraser') {
                    splatStore.current.erase(ids, 0.1);
                }
            }
        }

        renderer.current?.upload(splatStore.current);
    };

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black cursor-crosshair">
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-full block"
            />
            <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none font-mono">
                {fps} FPS | {splatStore.current.count} SPLATS
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-[10px] pointer-events-none uppercase tracking-widest">
                Mouse to paint • Right click to orbit • Scroll to zoom
            </div>
        </div>
    );
};
