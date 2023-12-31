"use strict";

import * as cg from "./cg.js";
import * as m4 from "./glmjs/mat4.js";
import * as twgl from "./twgl-full.module.js";
import * as v3 from "./glmjs/vec3.js";
import * as v4 from "./glmjs/vec4.js";
async function main() {
  const ambientLight = document.querySelector("#ambient");
  const lightTheta = document.querySelector("#theta");
  const gl = document.querySelector("#canvitas").getContext("webgl2");

  if (!gl) return undefined !== console.log("WebGL 2.0 not supported");
  let autorotate = true;
  twgl.setDefaults({ attribPrefix: "a_" });

  let fragSrc = await cg.fetchText("glsl/fragmentSrc.frag");
  let vertSrc = await cg.fetchText("glsl/vertexSrc.vert");
  const objProgramInfo = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);
  const obj = await cg.loadObj("models/crate/crate.obj", gl, objProgramInfo);
  fragSrc = await cg.fetchText("glsl/ls.frag");
  vertSrc = await cg.fetchText("glsl/ls.vert");
  const lsProgramInfo = twgl.createProgramInfo(gl, [vertSrc, fragSrc]);
  const lightCube = await cg.loadObj("models/cubito/cubito.obj", gl, lsProgramInfo);

  const cam = new cg.Cam([0, 0, 6], 25);
  let aspect = 16.0 / 9.0;
  let deltaTime = 0.0;
  let lastTime = 0.0;
  let theta = 0.0;

  const world = m4.create();
  const projection = m4.create();
  const rotationAxis = new Float32Array([0, 1, 0]);
  const temp = v3.create();
  const one = v3.fromValues(1, 1, 1);
  const initial_light_pos = v3.fromValues(3.0, 0, 0);
  const origin = v4.create();
  const light_position = v3.create();

  const coords = {
    u_world: world,
    u_projection: projection,
    u_view: cam.viewM4,
  };
  const light0 = {
    "u_light.ambient": v3.create(0),
    "u_light.cutOff": Math.cos(Math.PI / 15.0),
    "u_light.direction": cam.lookAt,
    "u_light.position": cam.pos,
    u_viewPosition: cam.pos,
  };

  const light1 = {
    u_lightColor: v3.fromValues(1, 1, 0),
  };

  ambientLight.oninput = () => {
    const value = ambientLight.value;
    light0["u_light.ambient"][0] = value / 100.0;
    light0["u_light.ambient"][1] = value / 100.0;
    light0["u_light.ambient"][2] = value / 100.0;
  };
  
  lightTheta.oninput = () => {
    const value = lightTheta.value;
    theta = (value * Math.PI) / 180.0;
  };

  const numObjs = 100;
  const positions = new Array(numObjs);
  const rndb = (a, b) => Math.random() * (b - a) + a;
  for (let i = 0; i < numObjs; ++i) {
    positions[i] = [rndb(-13.0, 13.0), rndb(-13.0, 13.0), rndb(-13.0, 13.0)];
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  function render(elapsedTime) {
    elapsedTime *= 1e-3;
    deltaTime = elapsedTime - lastTime;
    lastTime = elapsedTime;

    if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      aspect = gl.canvas.width / gl.canvas.height;
    }
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (autorotate) theta += deltaTime;
    if (theta > Math.PI * 2) theta -= Math.PI * 2;
    m4.identity(world);
    m4.rotate(world, world, theta, rotationAxis);
    m4.translate(world, world, initial_light_pos);
    v3.transformMat4(light_position, origin, world);

    m4.identity(projection);
    m4.perspective(projection, cam.zoom, aspect, 0.1, 100);

    gl.useProgram(objProgramInfo.program);
    twgl.setUniforms(objProgramInfo, light0);

    for (const pos of positions) {
      m4.identity(world);
      m4.scale(world, world, v3.scale(temp, one, 1));
      m4.translate(world, world, pos);
      m4.rotate(world, world, theta, rotationAxis);
      twgl.setUniforms(objProgramInfo, coords);
      for (const { bufferInfo, vao, material } of obj) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(objProgramInfo, {}, material);
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    //no importa

    m4.identity(world);
    m4.translate(world, world, light_position);
    m4.scale(world, world, v3.scale(temp, one, 0.025));

    gl.useProgram(lsProgramInfo.program);
    twgl.setUniforms(lsProgramInfo, coords);
    twgl.setUniforms(lsProgramInfo, light1);
    for (const { bufferInfo, vao } of lightCube) {
      gl.bindVertexArray(vao);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  document.addEventListener("keydown", (e) => {
    /**/ if (e.key === "w") cam.processKeyboard(cg.FORWARD, deltaTime);
    else if (e.key === "a") cam.processKeyboard(cg.LEFT, deltaTime);
    else if (e.key === "s") cam.processKeyboard(cg.BACKWARD, deltaTime);
    else if (e.key === "d") cam.processKeyboard(cg.RIGHT, deltaTime);
    else if (e.key === "r") autorotate = !autorotate;
  });
  document.addEventListener("mousemove", (e) => cam.movePov(e.x, e.y));
  document.addEventListener("mousedown", (e) => cam.startMove(e.x, e.y));
  document.addEventListener("mouseup", () => cam.stopMove());
  document.addEventListener("wheel", (e) => cam.processScroll(e.deltaY));
}
main();
