/* FERNANDOCOSTA — capa cinematográfica: shader, revelados, vídeo, menú */
(function () {
  'use strict';
  var menos = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pulso = 0;            // 0..1 lo mueve el audio o el scroll
  var suave = 0;

  /* ---------- 1. shader de la portada ---------- */
  var lienzo = document.getElementById('lienzo');
  if (lienzo) {
    var gl = lienzo.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (gl) {
      var fuente = [
        'attribute vec2 p;',
        'void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
      ].join('\n');
      var frag = [
        'precision highp float;',
        'uniform float t; uniform vec2 res; uniform float pul;',
        'float azar(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
        'void main(){',
        '  vec2 uv = gl_FragCoord.xy / res;',
        '  vec2 c = uv - 0.5;',
        '  float r = length(c);',
        '  float borde = smoothstep(0.22, 0.82, r);',
        '  vec3 col = vec3(0.0);',
        '  col.r += 0.20 * pul * borde * sin(uv.y * 42.0 + t * 1.7);',
        '  col.b += 0.26 * pul * borde * sin(uv.y * 33.0 - t * 1.2);',
        '  float g = azar(uv * res * 0.45 + t * 60.0);',
        '  col += (g - 0.5) * 0.06;',
        '  col += vec3(0.10, 0.55, 0.85) * pul * 0.06 * exp(-r * 2.0);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n');
      function compila(tipo, codigo) {
        var s = gl.createShader(tipo);
        gl.shaderSource(s, codigo); gl.compileShader(s);
        return s;
      }
      var prog = gl.createProgram();
      gl.attachShader(prog, compila(gl.VERTEX_SHADER, fuente));
      gl.attachShader(prog, compila(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog); gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      var pos = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      var uT = gl.getUniformLocation(prog, 't');
      var uRes = gl.getUniformLocation(prog, 'res');
      var uPul = gl.getUniformLocation(prog, 'pul');
      function talla() {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        lienzo.width = Math.floor(lienzo.clientWidth * dpr);
        lienzo.height = Math.floor(lienzo.clientHeight * dpr);
        gl.viewport(0, 0, lienzo.width, lienzo.height);
        gl.uniform2f(uRes, lienzo.width, lienzo.height);
      }
      window.addEventListener('resize', talla);
      talla();
      var t0 = performance.now();
      (function bucle(t) {
        suave += (pulso - suave) * 0.08;
        gl.uniform1f(uT, (t - t0) / 1000);
        gl.uniform1f(uPul, suave);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!menos) requestAnimationFrame(bucle);
      })(t0);
    }
  }
  window.__pusarPulso = function (v) { pulso = Math.max(0, Math.min(1, v)); };

  /* ---------- 2. precarga ---------- */
  var carga = document.getElementById('carga');
  function quitaCarga() { if (carga) carga.classList.add('fuera'); }
  var barra = carga && carga.querySelector('i');
  if (barra) barra.style.width = '100%';
  window.addEventListener('load', function () { setTimeout(quitaCarga, menos ? 0 : 800); });
  setTimeout(quitaCarga, 4000);

  /* ---------- 3. cabecera y pulso por scroll ---------- */
  var cabeza = document.getElementById('cabeza');
  function alScroll() {
    if (cabeza) cabeza.classList.toggle('pegada', window.scrollY > 60);
    if (!window.__audioActivo) window.__pusarPulso(Math.min(1, window.scrollY / (window.innerHeight * 1.1)) * 0.55);
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* ---------- 4. revelados y letras ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.entrada').forEach(function (e) { io.observe(e); });

  var titulo = document.getElementById('titulo');
  if (titulo) {
    var txt = titulo.textContent.trim();
    titulo.textContent = '';
    txt.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? '\u00a0' : ch;
      s.style.animationDelay = (0.3 + i * 0.06).toFixed(2) + 's';
      titulo.appendChild(s);
    });
  }

  /* ---------- 5. vídeos: se cargan al pulsar ---------- */
  document.querySelectorAll('.video').forEach(function (v) {
    v.addEventListener('click', function () {
      var id = v.dataset.id;
      if (!id || v.querySelector('iframe')) return;
      var mete = function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
        f.title = v.dataset.titulo || 'Vídeo';
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
        f.allowFullscreen = true;
        v.appendChild(f);
      };
      if (document.startViewTransition) document.startViewTransition(mete); else mete();
    });
  });

  /* ---------- 6. menú móvil ---------- */
  var hamb = document.getElementById('hamb'), movil = document.getElementById('movil');
  if (hamb && movil) {
    hamb.addEventListener('click', function () {
      var abierto = movil.classList.toggle('abierto');
      hamb.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });
    movil.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { movil.classList.remove('abierto'); });
    });
  }

  /* ---------- 7. botones que se acercan al ratón ---------- */
  if (window.matchMedia('(pointer: fine)').matches && !menos) {
    document.querySelectorAll('.boton').forEach(function (b) {
      b.addEventListener('mousemove', function (ev) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((ev.clientX - r.left - r.width / 2) * 0.10).toFixed(1) + 'px,' + ((ev.clientY - r.top - r.height / 2) * 0.16).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- 8. formulario de contratación ---------- */
  var f = document.getElementById('book');
  if (f) f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var cuerpo = ['Nombre: ' + g('nom'), 'Correo: ' + g('mail'), 'Tipo: ' + g('tipo'),
      'Ciudad: ' + g('ciudad'), 'Fecha: ' + g('fecha'), 'Caché: ' + g('cache'), '', g('msg')].join('\n');
    window.location.href = 'mailto:?subject=' + encodeURIComponent('Web — ' + (g('tipo') || 'contacto')) +
      '&body=' + encodeURIComponent(cuerpo);
  });
})();
