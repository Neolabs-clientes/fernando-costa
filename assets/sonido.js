/* FERNANDOCOSTA — el latido: la web late con su música */
(function () {
  var audio = document.getElementById('clip');
  var boton = document.getElementById('activar');
  var lienzo = document.getElementById('pulso');
  var estado = document.getElementById('estado');
  if (!audio || !boton || !lienzo) return;
  var ctx = null, an = null, datos = null, raf = null, sonando = false;
  function prepara() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    var fuente = ctx.createMediaElementSource(audio);
    an = ctx.createAnalyser();
    an.fftSize = 512;
    an.smoothingTimeConstant = 0.78;
    datos = new Uint8Array(an.frequencyBinCount);
    fuente.connect(an);
    an.connect(ctx.destination);
  }
  function pinta() {
    an.getByteFrequencyData(datos);
    var g = 0, i;
    for (i = 0; i < 8; i++) g += datos[i];
    var energia = Math.min(1, (g / 8) / 185);
    if (window.__pusarPulso) window.__pusarPulso(energia);
    var c = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    c.clearRect(0, 0, W, H);
    var n = 46, ancho = W / n;
    for (i = 0; i < n; i++) {
      var v = datos[Math.floor(i * (datos.length * 0.55) / n)] / 255;
      var h = Math.max(3, v * H * 0.88);
      c.fillStyle = (i % 4 === 0) ? '#dc9702' : 'rgba(117,213,253,' + (0.30 + v * 0.65).toFixed(2) + ')';
      c.fillRect(i * ancho + ancho * 0.24, H - h, ancho * 0.52, h);
    }
    raf = requestAnimationFrame(pinta);
  }
  function enciende() {
    prepara();
    if (ctx.state === 'suspended') ctx.resume();
    audio.play();
    sonando = true;
    boton.textContent = 'Pausar el latido';
    if (estado) estado.textContent = 'sonando';
    if (!raf) raf = requestAnimationFrame(pinta);
  }
  function apaga() {
    audio.pause();
    sonando = false;
    boton.textContent = 'Encender el latido';
    if (estado) estado.textContent = 'en pausa';
  }
  boton.addEventListener('click', function () { sonando ? apaga() : enciende(); });
  audio.addEventListener('ended', apaga);
})();
