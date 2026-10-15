/* FERNANDOCOSTA — el pulso: la web late con el ritmo.
   En la demo el ritmo lo genera la propia web (120 BPM). Con el máster
   del artista, este mismo analizador late con su tema real. */
(function () {
  'use strict';
  var boton = document.getElementById('activar');
  var lienzo = document.getElementById('pulso');
  if (!boton || !lienzo) return;
  var ctx2d = lienzo.getContext('2d');
  var audio = null, analizador = null, datos = null, maestro = null;
  var siguiente = 0, paso = 0, tempo = 120, encendido = false;

  function talla() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    lienzo.width = lienzo.clientWidth * dpr;
    lienzo.height = lienzo.clientHeight * dpr;
  }
  window.addEventListener('resize', talla); talla();

  function golpe(t) {
    var o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    o.connect(g); g.connect(maestro); o.start(t); o.stop(t + 0.36);
  }
  function chasquido(t) {
    var b = audio.createBuffer(1, 2048, audio.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < 2048; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / 2048);
    var s = audio.createBufferSource(); s.buffer = b;
    var f = audio.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    var g = audio.createGain(); g.gain.value = 0.16;
    s.connect(f); f.connect(g); g.connect(maestro); s.start(t);
  }
  function programa() {
    while (siguiente < audio.currentTime + 0.25) {
      if (paso % 4 === 0) golpe(siguiente);
      if (paso % 4 === 2) chasquido(siguiente);
      if (paso % 2 === 1) chasquido(siguiente);
      siguiente += 30 / tempo;
      paso++;
    }
    var f = new Uint8Array(analizador.frequencyBinCount);
    analizador.getByteFrequencyData(f);
    var suma = 0;
    for (var i = 0; i < f.length; i++) suma += f[i];
    var energia = Math.min(1, (suma / f.length) / 42);
    if (window.__pusarPulso) window.__pusarPulso(energia);
    var w = lienzo.width, h = lienzo.height;
    ctx2d.clearRect(0, 0, w, h);
    ctx2d.fillStyle = 'rgba(117,213,253,0.10)';
    var barras = 64;
    for (var k = 0; k < barras; k++) {
      var v = f[Math.floor(k * (f.length * 0.5) / barras)] / 255;
      var bh = Math.max(2, v * h * 0.86);
      ctx2d.fillStyle = k % 8 === 0 ? 'rgba(220,151,2,0.95)' : 'rgba(117,213,253,' + (0.25 + v * 0.7) + ')';
      ctx2d.fillRect(k * (w / barras), h - bh, Math.max(2, w / barras - 3), bh);
    }
    ctx2d.strokeStyle = 'rgba(238,244,248,0.35)'; ctx2d.lineWidth = 1;
    ctx2d.beginPath(); ctx2d.moveTo(0, h - energia * h * 0.8); ctx2d.lineTo(w, h - energia * h * 0.8); ctx2d.stroke();
    requestAnimationFrame(programa);
  }
  boton.addEventListener('click', function () {
    if (!encendido) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      maestro = audio.createGain(); maestro.gain.value = 0.5;
      analizador = audio.createAnalyser(); analizador.fftSize = 512;
      maestro.connect(analizador); analizador.connect(audio.destination);
      siguiente = audio.currentTime + 0.1; paso = 0;
      encendido = true; window.__audioActivo = true;
      boton.textContent = 'Parar el pulso';
      programa();
    } else {
      window.__audioActivo = false; encendido = false;
      if (audio) audio.close();
      boton.textContent = 'Encender el pulso';
      ctx2d.clearRect(0, 0, lienzo.width, lienzo.height);
    }
  });
})();
