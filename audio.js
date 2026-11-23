(function (global) {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var noiseBuffer = null;
  var inspectBuffer = null;
  var inspectDecodePromise = null;
  var activeInspectSource = null;
  var fallbackAudio = null;
  var muted = false;
  var lastTearAt = 0;
  var lastHoverAt = 0;
  var lastTugAt = 0;
  var lastBrushAt = 0;

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function decodeInspectAudio() {
    if (inspectBuffer || inspectDecodePromise || !ctx) return;
    var uri = global.AGY_INSPECT_AUDIO;
    if (!uri) return;
    try {
      var commaIdx = uri.indexOf(',');
      var b64 = commaIdx >= 0 ? uri.slice(commaIdx + 1) : uri;
      var bin = global.atob(b64);
      var len = bin.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      inspectDecodePromise = ctx.decodeAudioData(bytes.buffer).then(function (buf) {
        inspectBuffer = buf;
        return buf;
      }).catch(function () {
        inspectDecodePromise = null;
        return null;
      });
    } catch (e) {
      inspectDecodePromise = null;
    }
  }

  function ensureContext() {
    var AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 0.72;
      masterGain.connect(ctx.destination);
      buildNoiseBuffer();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    decodeInspectAudio();
    return ctx;
  }

  function buildNoiseBuffer() {
    if (!ctx || noiseBuffer) return;
    var duration = 1.5;
    var length = Math.floor(ctx.sampleRate * duration);
    noiseBuffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var data = noiseBuffer.getChannelData(ch);
      for (var i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
  }

  function playNote(freq, startTime, duration, type, volume, endFreq) {
    if (!ctx || !masterGain || muted) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.012, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  function playNoiseSlice(startTime, duration, filterType, freqStart, freqEnd, q, volume) {
    if (!ctx || !masterGain || !noiseBuffer || muted) return;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    var maxOffset = Math.max(0.01, noiseBuffer.duration - duration - 0.02);
    var offset = Math.random() * maxOffset;

    var filter = ctx.createBiquadFilter();
    filter.type = filterType || 'bandpass';
    filter.Q.value = q || 1.8;
    filter.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd && freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, freqEnd), startTime + duration);
    }

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.008, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start(startTime, offset, duration + 0.01);
  }

  function unlock() {
    ensureContext();
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, ctx.currentTime, 0.02);
    }
    if (muted) {
      stopInspectSound();
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function playTearGrain(velocity, progress) {
    if (muted) return;
    var nowMs = performance.now();
    if (nowMs - lastTearAt < 32) return;
    lastTearAt = nowMs;

    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    var vel = clamp(velocity || 0, 0, 1);
    var prog = clamp(progress || 0, 0, 1);
    var dur = 0.026 + (1 - vel) * 0.024;
    var centerFreq = 2400 + vel * 3200 + prog * 900 + (Math.random() - 0.5) * 450;
    var vol = 0.08 + vel * 0.14;

    playNoiseSlice(t, dur, 'bandpass', centerFreq, centerFreq * 1.15, 2.8, vol);
    // Crisp metallic foil micro-crackle transient
    playNoiseSlice(t + 0.004, 0.016, 'highpass', 5200 + vel * 1600, 6800, 1.1, vol * 0.55);
  }

  function playTearRebound() {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    playNoiseSlice(t, 0.115, 'bandpass', 3000, 1100, 2.2, 0.14);
    playNote(240, t, 0.09, 'triangle', 0.045, 165);
  }

  function playTug() {
    if (muted) return;
    var nowMs = performance.now();
    if (nowMs - lastTugAt < 180) return;
    lastTugAt = nowMs;

    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    playNote(160, t, 0.08, 'sine', 0.055, 210);
  }

  function playShakeRattle() {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    var freqs = [1950, 2650, 3150];
    for (var i = 0; i < freqs.length; i++) {
      playNoiseSlice(t + i * 0.055, 0.022, 'highpass', freqs[i], freqs[i] * 0.85, 1.4, 0.095);
    }
  }

  function playPackBurst(isGodPack) {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;

    // Punchy pressure pop + crisp air burst
    playNote(190, t, 0.145, 'sine', 0.28, 44);
    playNoiseSlice(t, 0.13, 'bandpass', 2200, 750, 0.9, 0.22);

    // Ascending crystalline arpeggio
    var notes = isGodPack
      ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0]
      : [523.25, 659.25, 783.99, 987.77, 1174.66];

    for (var i = 0; i < notes.length; i++) {
      var st = t + 0.05 + i * (isGodPack ? 0.062 : 0.055);
      playNote(notes[i], st, isGodPack ? 0.34 : 0.24, i % 2 === 0 ? 'triangle' : 'sine', isGodPack ? 0.095 : 0.07);
    }
  }

  function playOrbitalDeal() {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;

    // Silky rising wind sweep + 5 staggered crystalline chimes
    playNoiseSlice(t, 0.58, 'bandpass', 750, 2900, 1.4, 0.085);
    var chimes = [523.25, 587.33, 659.25, 783.99, 1046.5];
    for (var i = 0; i < chimes.length; i++) {
      playNote(chimes[i], t + 0.09 + i * 0.088, 0.28, i % 2 === 0 ? 'sine' : 'triangle', 0.052);
    }
  }

  function playCardFlip(rarity) {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;

    var impactGainMap = {
      common: 0.36,
      rare: 0.40,
      holo: 0.43,
      ultra: 0.46,
      secret: 0.50
    };
    var heavyVol = impactGainMap[rarity] || 0.40;

    // Action-game heavy-hit sub-bass thud + mid punch + crisp transient crack
    playNote(155, t, 0.19, 'sine', heavyVol, 36);
    playNote(310, t, 0.095, 'triangle', heavyVol * 0.55, 72);
    playNoiseSlice(t, 0.095, 'bandpass', 1900, 480, 1.3, heavyVol * 0.6);

    // Rarity crystalline chime chord layered right after the strike
    if (rarity === 'common') {
      playNote(523.25, t + 0.035, 0.24, 'sine', 0.085);
    } else if (rarity === 'rare') {
      playNote(523.25, t + 0.035, 0.28, 'triangle', 0.085);
      playNote(783.99, t + 0.08, 0.32, 'sine', 0.09);
    } else if (rarity === 'holo') {
      var holoNotes = [523.25, 659.25, 783.99, 987.77];
      for (var i = 0; i < holoNotes.length; i++) {
        playNote(holoNotes[i], t + 0.035 + i * 0.048, 0.35, 'triangle', 0.08);
      }
    } else if (rarity === 'ultra') {
      var ultraNotes = [392.0, 493.88, 587.33, 739.99, 880.0];
      for (var j = 0; j < ultraNotes.length; j++) {
        playNote(ultraNotes[j], t + 0.03 + j * 0.045, 0.44, 'triangle', 0.09);
      }
    } else {
      // secret: rapid 6-note prismatic cascade
      var secretNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      for (var k = 0; k < secretNotes.length; k++) {
        playNote(secretNotes[k], t + 0.028 + k * 0.042, 0.5, k % 2 === 0 ? 'triangle' : 'sine', 0.095);
      }
    }
  }

  function playPackChickHover(velocity, stepIdx) {
    if (muted) return;
    var nowMs = performance.now();
    if (nowMs - lastBrushAt < 135) return;
    lastBrushAt = nowMs;

    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    var vel = clamp(velocity || 0.65, 0, 1);

    // Same pentatonic crystalline chime scale as pack opening
    var scale = [523.25, 659.25, 783.99, 987.77, 1174.66];
    var idx = typeof stepIdx === 'number'
      ? Math.abs(stepIdx) % scale.length
      : Math.floor(Math.random() * scale.length);
    var freq = scale[idx];

    playNote(freq, t, 0.24, idx % 2 === 0 ? 'triangle' : 'sine', 0.06 + vel * 0.035);
    playNoiseSlice(t, 0.036, 'bandpass', 2600 + vel * 1800, 4200, 2.0, 0.03);
  }

  function playHoverTick() {
    if (muted) return;
    var nowMs = performance.now();
    if (nowMs - lastHoverAt < 95) return;
    lastHoverAt = nowMs;

    var c = ensureContext();
    if (!c) return;
    playNote(880, c.currentTime, 0.02, 'sine', 0.024);
  }

  function stopInspectSound() {
    if (activeInspectSource) {
      try {
        activeInspectSource.stop();
      } catch (e) {}
      activeInspectSource = null;
    }
    if (fallbackAudio) {
      try {
        fallbackAudio.pause();
        fallbackAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  function playInspectSound() {
    if (muted) return;
    stopInspectSound();

    var c = ensureContext();
    if (c && inspectBuffer && masterGain) {
      var src = c.createBufferSource();
      var g = c.createGain();
      src.buffer = inspectBuffer;
      g.gain.value = 1.05;
      src.connect(g);
      g.connect(masterGain);
      src.onended = function () {
        if (activeInspectSource === src) activeInspectSource = null;
      };
      activeInspectSource = src;
      src.start(0);
      return;
    }

    var audioSrc = global.AGY_INSPECT_AUDIO || 'assets/audio/inspect.mp3';
    try {
      if (!fallbackAudio) {
        fallbackAudio = new global.Audio(audioSrc);
      } else {
        fallbackAudio.currentTime = 0;
      }
      fallbackAudio.volume = 0.72;
      fallbackAudio.play().catch(function () {});
    } catch (e) {}
  }

  function playUiClick() {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    playNote(640, t, 0.032, 'triangle', 0.045, 420);
  }

  global.AgyAudio = {
    unlock: unlock,
    setMuted: setMuted,
    isMuted: isMuted,
    playTearGrain: playTearGrain,
    playTearRebound: playTearRebound,
    playTug: playTug,
    playShakeRattle: playShakeRattle,
    playPackBurst: playPackBurst,
    playOrbitalDeal: playOrbitalDeal,
    playCardFlip: playCardFlip,
    playPackChickHover: playPackChickHover,
    playInspectSound: playInspectSound,
    playHoverTick: playHoverTick,
    playUiClick: playUiClick
  };
})(window);
