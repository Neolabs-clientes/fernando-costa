/* FERNANDOCOSTA — el latido: suena la canción y la web late con ella.
   El sonido sale por 'clip' (nunca se toca) y el analizador lee 'clave'
   (mudo), para que nunca pueda quedarse en silencio. */
(function () {
  var clip = document.getElementById('clip');
  var clave = document.getElementById('clave');
  var boton = document.getElementById('activar');
  var lienzo = document.getElementById('pulso');
  var estado = document.getElementById('estado');
  if (!clip || !boton || !lienzo) return;
  var ctx = null, an = null, datos = null, raf = null, sonando = false, mudo = 0;
  function prepara() {
    if (ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var fuente = ctx.createMediaElementSource(clave);
      an = ctx.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.72;
      datos = new Uint8Array(an.frequencyBinCount);
      var silencio = ctx.createGain();
      silencio.gain.value = 0;
      fuente.connect(an);
      an.connect(silencio);
      silencio.connect(ctx.destination);
      clave.muted = false;
    } catch (e) { ctx = null; an = null; datos = null; clave.muted = true; }
  }
  function pinta() {
    var energia = 0, i, j;
    if (an && datos) {
      an.getByteFrequencyData(datos);
      var suma = 0;
      for (i = 0; i < 8; i++) suma += datos[i];
      energia = Math.min(1, (suma / 8) / 185);
      mudo = energia < 0.02 ? mudo + 1 : 0;
    } else { mudo = 999; }
    if (mudo > 45) energia = 0.45 + 0.35 * Math.abs(Math.sin(performance.now() / 500));
    if (window.__pusarPulso) window.__pusarPulso(energia);
    var g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height, barras = 48, ancho = W / barras;
    g.clearRect(0, 0, W, H);
    for (j = 0; j < barras; j++) {
      var v = datos ? datos[Math.floor(j * (datos.length * 0.55) / barras)] / 255 : energia;
      var h = Math.max(3, v * H * 0.86);
      g.fillStyle = (j % 4 === 0) ? '#dc9702' : 'rgba(117,213,253,' + (0.35 + v * 0.6) + ')';
      g.fillRect(j * ancho + ancho * 0.22, H - h, ancho * 0.56, h);
    }
    if (sonando && ctx && clip.currentTime - clave.currentTime > 0.3) clave.currentTime = clip.currentTime;
    raf = requestAnimationFrame(pinta);
  }
  function enciende() {
    prepara();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    clip.volume = 0.9;
    try { clip.currentTime = 0; } catch (e) {}
    clip.play();
    if (ctx) { try { clave.currentTime = 0; clave.play(); } catch (e) {} }
    sonando = true;
    boton.textContent = 'Pausar la canción';
    if (estado) estado.textContent = 'sonando';
    if (!raf) raf = requestAnimationFrame(pinta);
  }
  function apaga() {
    sonando = false;
    clip.pause();
    try { clave.pause(); } catch (e) {}
    boton.textContent = 'Poner la canción';
    if (estado) estado.textContent = 'en pausa';
  }
  boton.addEventListener('click', function () { sonando ? apaga() : enciende(); });
  clip.addEventListener('ended', apaga);
})();