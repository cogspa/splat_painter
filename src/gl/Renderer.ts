
import splatVert from "./shaders/splat.vert.glsl?raw";
import splatFrag from "./shaders/splat.frag.glsl?raw";

export class Renderer {
    gl: WebGL2RenderingContext;

    prog!: WebGLProgram;
    vao!: WebGLVertexArrayObject;

    uView!: WebGLUniformLocation;
    uProj!: WebGLUniformLocation;

    // instance buffers
    bPos!: WebGLBuffer;
    bCol!: WebGLBuffer;
    bOpa!: WebGLBuffer;
    bSize!: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.init();
    }

    private init() {
        const gl = this.gl;

        const prog = createProgram(gl, splatVert, splatFrag);
        this.prog = prog;

        this.uView = gl.getUniformLocation(prog, "uView")!;
        this.uProj = gl.getUniformLocation(prog, "uProj")!;

        // Quad corners for instancing (Triangle Fan: -1,-1 -> 1,-1 -> 1,1 -> -1,1)
        const corners = new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, 1
        ]);

        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);

        // aCorner (Location 0)
        const bCorner = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, bCorner);
        gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Instance buffers
        this.bPos = gl.createBuffer()!;
        this.bCol = gl.createBuffer()!;
        this.bOpa = gl.createBuffer()!;
        this.bSize = gl.createBuffer()!;

        bindInstanced(gl, this.bPos, 1, 3); // iPos loc 1
        bindInstanced(gl, this.bCol, 2, 3); // iCol loc 2
        bindInstanced(gl, this.bOpa, 3, 1); // iOpa loc 3
        bindInstanced(gl, this.bSize, 4, 1); // iSize loc 4

        gl.bindVertexArray(null);
        this.vao = vao;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    upload(store: { pos: Float32Array, col: Float32Array, opa: Float32Array, size: Float32Array, count: number }) {
        const gl = this.gl;
        const n = store.count;
        if (n === 0) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bPos);
        gl.bufferData(gl.ARRAY_BUFFER, store.pos.subarray(0, n * 3), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bCol);
        gl.bufferData(gl.ARRAY_BUFFER, store.col.subarray(0, n * 3), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bOpa);
        gl.bufferData(gl.ARRAY_BUFFER, store.opa.subarray(0, n), gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bSize);
        gl.bufferData(gl.ARRAY_BUFFER, store.size.subarray(0, n), gl.DYNAMIC_DRAW);
    }

    draw(view: Float32Array, proj: Float32Array, count: number) {
        const gl = this.gl;
        if (count === 0) return;

        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.uView, false, view);
        gl.uniformMatrix4fv(this.uProj, false, proj);

        gl.bindVertexArray(this.vao);
        gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, count);
        gl.bindVertexArray(null);
    }
}

function bindInstanced(gl: WebGL2RenderingContext, buf: WebGLBuffer, loc: number, size: number) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(loc, 1); // This makes it per-instance
}

function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) {
    const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(p) || "link failed");
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return p;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || "compile failed");
    }
    return s;
}
