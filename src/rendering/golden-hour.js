// Full-scene GPU pass at the native pixel-art resolution, before integer upscaling.
export const GOLDEN_VERTEX = `attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
export const GOLDEN_FRAGMENT = `precision mediump float;
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_time;
varying vec2 v_uv;
vec3 bright(vec2 p){vec3 c=texture2D(u_scene,p).rgb;return c*smoothstep(.69,.95,dot(c,vec3(.2126,.7152,.0722)));}
void main(){
 vec3 original=texture2D(u_scene,v_uv).rgb;
 float luminance=dot(original,vec3(.2126,.7152,.0722));
 vec3 balance=mix(vec3(.93,.965,1.025),vec3(1.075,1.025,.925),smoothstep(.08,.84,luminance));
 vec3 colour=original*balance;
 vec2 pixel=1./u_resolution;
 vec3 bloom=(bright(v_uv+vec2(pixel.x*2.,0.))+bright(v_uv-vec2(pixel.x*2.,0.))+bright(v_uv+vec2(0.,pixel.y*2.))+bright(v_uv-vec2(0.,pixel.y*2.)))*.25;
 colour+=bloom*vec3(1.,.79,.48)*.055;
 vec2 sunlight=v_uv-vec2(-.15,1.15);
 float proximity=exp(-dot(sunlight,sunlight)*1.8);
 float ray=pow(.5+.5*sin(atan(sunlight.y,sunlight.x)*33.+u_time*.035),10.);
 colour+=vec3(1.,.66,.27)*(proximity*.032+ray*exp(-length(sunlight)*1.1)*.045);
 vec2 edge=(v_uv-.5)*1.4142;
 colour*=1.-.07*smoothstep(.32,1.,dot(edge,edge));
 gl_FragColor=vec4(clamp(colour,0.,1.),1.);
}`;
export function createGoldenHour(width = 640, height = 400) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  let gl,
    program,
    texture,
    buffer,
    timeLocation,
    lost = false,
    destroyed = false;
  const reducedMotion = globalThis.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );
  function build() {
    function shader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw Error("Lighting shader compilation failed");
      }
      return shader;
    }
    const vertex = shader(gl.VERTEX_SHADER, GOLDEN_VERTEX),
      fragment = shader(gl.FRAGMENT_SHADER, GOLDEN_FRAGMENT);
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("Lighting shader link failed");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(gl.getUniformLocation(program, "u_scene"), 0);
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
    timeLocation = gl.getUniformLocation(program, "u_time");
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }
  try {
    gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (gl) build();
  } catch {
    program = null;
  }
  const onLost = (event) => {
    event.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    if (destroyed) return;
    try {
      build();
      lost = false;
    } catch {
      program = null;
    }
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const fallback = document.createElement("canvas");
  fallback.width = width;
  fallback.height = height;
  const context = fallback.getContext("2d");
  context.imageSmoothingEnabled = false;
  const wash = context.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, "#f0bb6d");
  wash.addColorStop(1, "#605b83");
  return {
    get mode() {
      return gl && program && !lost ? "webgl" : "canvas2d";
    },
    draw(source, time = 0, enabled = true) {
      if (!enabled || destroyed) return source;
      if (gl && program && !lost) {
        gl.useProgram(program);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          source,
        );
        gl.uniform1f(timeLocation, reducedMotion?.matches ? 0 : time % 3600);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return canvas;
      }
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.drawImage(source, 0, 0);
      context.globalCompositeOperation = "soft-light";
      context.globalAlpha = 0.18;
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      return fallback;
    },
    destroy() {
      destroyed = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (gl) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    },
  };
}
