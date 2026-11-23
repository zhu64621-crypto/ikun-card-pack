(function (global) {
  'use strict';

  var STORAGE_KEY = 'ikun_cardpack_v1';
  var TEAR_SEGS = 96;
  var FLAP_SLICES = 24;
  var RIM_COUNT = 18;

  // DOM Elements
  var htmlEl = document.documentElement;
  var backdropEl = document.querySelector('.backdrop');
  var stageEl = document.getElementById('stage');
  var sceneEl = document.getElementById('scene');
  var groundEl = document.getElementById('ground');
  var flowEl = document.getElementById('flow');
  var packEl = document.getElementById('pack');
  var rimsEl = document.getElementById('pack-rims');
  var sealGlowEl = document.getElementById('seal-glow');
  var orbEl = document.getElementById('pack-orb');
  var pupils = Array.prototype.slice.call(orbEl.querySelectorAll('.pupil'));
  var eyes = Array.prototype.slice.call(orbEl.querySelectorAll('.eye'));
  var lipEl = document.getElementById('tear-lip');
  var flapEl = document.getElementById('pack-flap');
  var hitEl = document.getElementById('hit');
  var cardsLayerEl = document.getElementById('cards-layer');

  var actionsEl = document.getElementById('actions');
  var btnFlipAll = document.getElementById('btn-flip-all');
  var btnAgain = document.getElementById('btn-again');

  var btnTheme = document.getElementById('btn-theme');
  var themeIco = document.getElementById('theme-ico');
  var themeLabel = document.getElementById('theme-label');
  var btnGod = document.getElementById('btn-god');
  var godLabel = document.getElementById('god-label');
  var btnAlbum = document.getElementById('btn-album');
  var albumCountEl = document.getElementById('album-count');
  var btnMute = document.getElementById('btn-mute');
  var muteIco = document.getElementById('mute-ico');
  var modePill = document.getElementById('mode-pill');
  var modeLabel = document.getElementById('mode-label');
  var hintPill = document.getElementById('hint-pill');
  var toastPill = document.getElementById('toast-pill');
  var godBanner = document.getElementById('god-banner');

  var fxCanvas = document.getElementById('fx');
  var fxCtx = fxCanvas.getContext('2d');

  var inspectModal = document.getElementById('inspect-modal');
  var inspectClose = document.getElementById('inspect-close');
  var inspectCardStage = document.getElementById('inspect-card-stage');
  var inspectRarity = document.getElementById('inspect-rarity');
  var inspectSymbol = document.getElementById('inspect-symbol');
  var inspectNumber = document.getElementById('inspect-number');
  var inspectName = document.getElementById('inspect-name');
  var inspectCnTitle = document.getElementById('inspect-cntitle');
  var inspectFlavor = document.getElementById('inspect-flavor');
  var inspectStats = document.getElementById('inspect-stats');

  var albumModal = document.getElementById('album-modal');
  var albumClose = document.getElementById('album-close');
  var btnResetAlbum = document.getElementById('btn-reset-album');
  var albumGrid = document.getElementById('album-grid');
  var albumProgressText = document.getElementById('album-progress-text');

  // Persistent Album State
  var album = loadAlbum();

  // Pack & Interaction State
  var state = {
    theme: 'dark',
    godArmed: false,
    packGod: false,
    opened: false,
    autoTearing: false,
    packCards: [],
    tearPts: [],
    tearCut: 0,
    tearDir: 1,
    curlTension: 0,
    curlVel: 0,
    flapFly: 0,
    flapFlyVel: 0,
    packDropY: 0,
    packDropAlpha: 1,

    // Pack spring physics
    px: 0,
    py: 0,
    pvx: 0,
    pvy: 0,
    ptx: 0,
    pty: 0,
    rx: 0,
    ry: 0,
    rz: 0,
    rvx: 0,
    rvy: 0,
    rvz: 0,
    rtx: 0,
    rty: 0,
    rtz: 0,
    sx: 1,
    sy: 1,
    svx: 0,
    svy: 0,
    stx: 1,
    sty: 1,

    // Pointer hover
    cursorNormX: 0,
    cursorNormY: 0,
    eyeX: 0,
    eyeY: 0,
    nextBlinkAt: performance.now() + 2600,
    orbHovering: false,
    orbLastX: null,
    orbLastY: null,
    orbNoteIdx: 0,

    // Gesture tracking
    drag: null,
    lastShakeAt: 0,
    toastTimer: 0,
    shake: { mag: 0, elapsed: 0, dur: 0 }
  };

  var plySlices = [];
  var cardStates = [];
  var particles = [];
  var ripples = [];
  var inspectState = null;

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function loadAlbum() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            packsOpened: Number(parsed.packsOpened) || 0,
            owned: parsed.owned && typeof parsed.owned === 'object' ? parsed.owned : {}
          };
        }
      }
    } catch (e) {}
    return { packsOpened: 0, owned: {} };
  }

  function saveAlbum() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(album));
    } catch (e) {}
    updateAlbumBadge();
  }

  function updateAlbumBadge() {
    var unique = 0;
    for (var i = 0; i < global.AGY_CARDS.length; i++) {
      if ((album.owned[global.AGY_CARDS[i].id] || 0) > 0) unique++;
    }
    albumCountEl.textContent = unique + '/' + global.AGY_CARDS.length;
  }

  function showToast(text, duration) {
    toastPill.textContent = text;
    toastPill.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      toastPill.classList.remove('show');
    }, duration || 2200);
  }

  /* ---------- Build 3D Pack Rims & 24-Slice Flap ---------- */
  function buildPackRims() {
    rimsEl.innerHTML = '';
    var d = 18;
    for (var i = 0; i < RIM_COUNT; i++) {
      var t = -1 + (2 * i) / (RIM_COUNT - 1); // -1 (front) -> +1 (back)
      var z = -t * (d * 0.47);
      var insetX = (t * t) * 4.4;
      var shade = Math.round(14 + Math.abs(t) * 34);
      var rim = document.createElement('div');
      rim.className = 'rim';
      rim.style.transform = 'translateZ(' + z.toFixed(2) + 'px)';
      rim.style.left = insetX.toFixed(2) + 'px';
      rim.style.right = insetX.toFixed(2) + 'px';
      rim.style.background =
        'color-mix(in srgb, var(--pack), #020617 ' + shade + '%)';
      rimsEl.appendChild(rim);
    }
  }

  function buildFlapSlices() {
    flapEl.innerHTML = '';
    plySlices = [];
    for (var s = 0; s < FLAP_SLICES; s++) {
      var ply = document.createElement('div');
      ply.className = 'ply';

      var front = document.createElement('div');
      front.className = 'skin front';
      front.innerHTML =
        '<div class="foil-sheen"></div>' +
        '<div class="creases"></div>' +
        '<div class="seal-band">' +
        '  <span class="tear-tag">TEAR HERE ⟶</span>' +
        '  <div class="perf-line"></div>' +
        '</div>';

      var foil = document.createElement('div');
      foil.className = 'skin foil';
      var tone = document.createElement('i');
      tone.className = 'tone';
      foil.appendChild(tone);

      ply.appendChild(front);
      ply.appendChild(foil);
      flapEl.appendChild(ply);
      plySlices.push({ el: ply, front: front, foil: foil, tone: tone });
    }
  }

  function generateTearProfile() {
    var pts = [];
    var phase = Math.random() * Math.PI * 2;
    for (var i = 0; i <= TEAR_SEGS; i++) {
      var wave = Math.sin(i * 0.48 + phase) * 0.65 + Math.cos(i * 1.17) * 0.35;
      var jitter = (Math.random() - 0.5) * 1.95;
      var y = clamp(12.1 + wave + jitter, 9.2, 14.9);
      pts.push(y);
    }
    return pts;
  }

  function applySliceClips() {
    var step = TEAR_SEGS / FLAP_SLICES; // 4
    for (var s = 0; s < FLAP_SLICES; s++) {
      var i0 = s * step;
      var x0 = (s / FLAP_SLICES) * 100;
      var x1 = ((s + 1) / FLAP_SLICES) * 100;
      var poly = [
        x0.toFixed(3) + '% 0%',
        x1.toFixed(3) + '% 0%'
      ];
      for (var k = step; k >= 0; k--) {
        var idx = i0 + k;
        var xp = (idx / TEAR_SEGS) * 100;
        poly.push(xp.toFixed(3) + '% ' + state.tearPts[idx].toFixed(3) + '%');
      }
      var clipStr = 'polygon(' + poly.join(', ') + ')';
      plySlices[s].front.style.clipPath = clipStr;
      plySlices[s].foil.style.clipPath = clipStr;
    }
  }

  /* ---------- Render Jagged Tear Seam & 24-Slice 3D Curl ---------- */
  function renderTearGeometry() {
    var cut = state.tearCut;
    var frontSkin = packEl.querySelector(':scope > .skin.front');
    var backSkin = packEl.querySelector(':scope > .skin.back');

    if (cut <= 0.002) {
      frontSkin.style.clipPath = '';
      backSkin.style.clipPath = '';
      rimsEl.style.clipPath = '';
      lipEl.classList.remove('on');
      lipEl.style.clipPath = '';
      flapEl.classList.remove('on');
      flowEl.classList.remove('peek');
      for (var rs = 0; rs < plySlices.length; rs++) {
        plySlices[rs].el.style.visibility = 'hidden';
        plySlices[rs].el.style.transform = '';
        plySlices[rs].tone.style.opacity = '0';
      }
      return;
    }

    var cutIdx = clamp(Math.round(cut * TEAR_SEGS), 1, TEAR_SEGS);
    var dir = state.tearDir;
    var pts = state.tearPts;

    // 1. Front & Back Pack Skin clip-path + Rims clip-path
    var frontPoly = [];
    var backPoly = [];
    var lipTop = [];
    var lipBot = [];

    if (dir === 1) {
      // Torn from left (0) to cutIdx
      var cutPct = (cutIdx / TEAR_SEGS) * 100;
      if (cutIdx < TEAR_SEGS) {
        frontPoly.push(cutPct.toFixed(3) + '% 0%');
        frontPoly.push('100% 0%');
        backPoly.push((100 - cutPct).toFixed(3) + '% 0%');
        backPoly.push('0% 0%');
      } else {
        frontPoly.push('100% ' + pts[TEAR_SEGS].toFixed(3) + '%');
        backPoly.push('0% ' + pts[TEAR_SEGS].toFixed(3) + '%');
      }
      frontPoly.push('100% 100%', '0% 100%');
      backPoly.push('0% 100%', '100% 100%');

      for (var i = 0; i <= cutIdx; i++) {
        var xPct = (i / TEAR_SEGS) * 100;
        var yPct = pts[i];
        frontPoly.push(xPct.toFixed(3) + '% ' + yPct.toFixed(3) + '%');
        backPoly.push((100 - xPct).toFixed(3) + '% ' + yPct.toFixed(3) + '%');
        lipTop.push(xPct.toFixed(3) + '% ' + (yPct - 0.15).toFixed(3) + '%');
        lipBot.unshift(xPct.toFixed(3) + '% ' + (yPct + 1.15).toFixed(3) + '%');
      }
    } else {
      // Torn from right (TEAR_SEGS) to startIdx
      var startIdx = TEAR_SEGS - cutIdx;
      var startPct = (startIdx / TEAR_SEGS) * 100;
      if (startIdx > 0) {
        frontPoly.push('0% 0%');
        frontPoly.push(startPct.toFixed(3) + '% 0%');
        backPoly.push('100% 0%');
        backPoly.push((100 - startPct).toFixed(3) + '% 0%');
      } else {
        frontPoly.push('0% ' + pts[0].toFixed(3) + '%');
        backPoly.push('100% ' + pts[0].toFixed(3) + '%');
      }

      for (var j = startIdx; j <= TEAR_SEGS; j++) {
        var xP = (j / TEAR_SEGS) * 100;
        var yP = pts[j];
        frontPoly.push(xP.toFixed(3) + '% ' + yP.toFixed(3) + '%');
        backPoly.push((100 - xP).toFixed(3) + '% ' + yP.toFixed(3) + '%');
        lipTop.push(xP.toFixed(3) + '% ' + (yP - 0.15).toFixed(3) + '%');
        lipBot.unshift(xP.toFixed(3) + '% ' + (yP + 1.15).toFixed(3) + '%');
      }
      frontPoly.push('100% 100%', '0% 100%');
      backPoly.push('0% 100%', '100% 100%');
    }

    var frontClip = 'polygon(' + frontPoly.join(', ') + ')';
    frontSkin.style.clipPath = frontClip;
    rimsEl.style.clipPath = frontClip;
    backSkin.style.clipPath = 'polygon(' + backPoly.join(', ') + ')';

    lipEl.classList.add('on');
    lipEl.style.clipPath = 'polygon(' + lipTop.concat(lipBot).join(', ') + ')';

    if (cut > 0.08 && !state.opened) {
      flowEl.classList.add('peek');
    }

    // 2. 24-slice 3D curling flap transforms
    var packW = packEl.offsetWidth || 286;
    var activeCount = clamp(Math.floor(cut * FLAP_SLICES), 0, FLAP_SLICES);
    if (activeCount <= 0) {
      flapEl.classList.remove('on');
      return;
    }

    flapEl.classList.add('on');
    var tension = clamp(state.curlTension, 0.05, 1.35);

    if (dir === 1) {
      var chain = '';
      var cumAngle = 0;
      for (var s = activeCount - 1; s >= 0; s--) {
        var slice = plySlices[s];
        var stepIdx = activeCount - s;
        var cx = ((s + 1) / FLAP_SLICES) * packW;
        var ry = (5.4 + stepIdx * 0.62) * tension;
        var rz = -(0.45 + stepIdx * 0.06) * tension;
        cumAngle += ry;
        chain +=
          ' translateX(' + cx.toFixed(2) + 'px)' +
          ' rotateY(' + ry.toFixed(2) + 'deg)' +
          ' rotateZ(' + rz.toFixed(2) + 'deg)' +
          ' translateX(' + (-cx).toFixed(2) + 'px)';
        slice.el.style.visibility = 'visible';
        slice.el.style.transform = chain;
        slice.tone.style.opacity = clamp(cumAngle / 280, 0, 0.36).toFixed(3);
      }
      for (var h = activeCount; h < FLAP_SLICES; h++) {
        plySlices[h].el.style.visibility = 'hidden';
        plySlices[h].el.style.transform = '';
      }
    } else {
      var firstActive = FLAP_SLICES - activeCount;
      var chainR = '';
      var cumAngleR = 0;
      for (var sr = firstActive; sr < FLAP_SLICES; sr++) {
        var sliceR = plySlices[sr];
        var stepIdxR = sr - firstActive + 1;
        var cxR = (sr / FLAP_SLICES) * packW;
        var ryR = -(5.4 + stepIdxR * 0.62) * tension;
        var rzR = (0.45 + stepIdxR * 0.06) * tension;
        cumAngleR += Math.abs(ryR);
        chainR +=
          ' translateX(' + cxR.toFixed(2) + 'px)' +
          ' rotateY(' + ryR.toFixed(2) + 'deg)' +
          ' rotateZ(' + rzR.toFixed(2) + 'deg)' +
          ' translateX(' + (-cxR).toFixed(2) + 'px)';
        sliceR.el.style.visibility = 'visible';
        sliceR.el.style.transform = chainR;
        sliceR.tone.style.opacity = clamp(cumAngleR / 280, 0, 0.36).toFixed(3);
      }
      for (var hr = 0; hr < firstActive; hr++) {
        plySlices[hr].el.style.visibility = 'hidden';
        plySlices[hr].el.style.transform = '';
      }
    }
  }

  /* ---------- Tear Completion & Confetti Burst ---------- */
  function triggerShakePeek() {
    var now = performance.now();
    if (now - state.lastShakeAt < 1100 || state.opened) return;
    state.lastShakeAt = now;

    global.AgyAudio.playShakeRattle();
    var best = state.packCards[0];
    for (var i = 1; i < state.packCards.length; i++) {
      if (
        global.AGY_RARITIES[state.packCards[i].rarity].rank >
        global.AGY_RARITIES[best.rarity].rank
      ) {
        best = state.packCards[i];
      }
    }

    var glowColor = state.packGod ? '#fbbf24' : best.theme.glow;
    sealGlowEl.style.setProperty('--seal-color', glowColor);
    packEl.classList.add('seal-peek');
    setTimeout(function () {
      packEl.classList.remove('seal-peek');
    }, 1750);

    var msg = state.packGod
      ? '封口透出【欧皇全闪气息】'
      : global.AGY_RARITIES[best.rarity].sealHint;
    showToast(msg, 2100);
  }

  function completeTear() {
    if (state.opened) return;
    state.opened = true;
    state.autoTearing = false;
    state.orbHovering = false;
    orbEl.classList.remove('orb-pet');
    state.tearCut = 1;
    state.curlTension = 1.15;
    state.flapFlyVel = 1;

    packEl.classList.remove('held', 'hurt', 'tug', 'hit-hover');
    packEl.classList.add('opened');
    renderTearGeometry();

    flowEl.classList.remove('peek');
    flowEl.classList.add('burst');

    global.AgyAudio.playPackBurst(state.packGod);
    spawnConfetti(window.innerWidth * 0.5, window.innerHeight * 0.36, 240, state.packGod);

    if (state.packGod) {
      godBanner.classList.add('show');
    }

    hintPill.textContent = '点击任意卡背逐张揭晓，或点击下方「一键全翻」';

    setTimeout(function () {
      launchCardsFanOut();
    }, 260);
  }

  function startAutoTear() {
    if (state.opened || state.autoTearing) return;
    state.autoTearing = true;
    state.tearDir = 1;
    packEl.classList.add('held', 'hurt');
    var lastTime = performance.now();

    function step(now) {
      if (!state.autoTearing || state.opened) return;
      var dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      state.tearCut = Math.min(1, state.tearCut + dt * 1.95);
      state.curlTension = Math.min(1.1, 0.45 + state.tearCut * 0.65);
      global.AgyAudio.playTearGrain(0.82, state.tearCut);
      renderTearGeometry();
      if (state.tearCut >= 1) {
        completeTear();
      } else {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------- Build & Launch 5 Cards ---------- */
  function createCardElement(card, options) {
    var opts = options || {};
    var el = document.createElement('div');
    el.className = 'card' + (opts.facedown ? ' facedown' : ' out');
    el.dataset.rarity = card.rarity;
    el.dataset.textMode = card.theme.textMode;
    el.dataset.longName = card.name.length >= 10 ? 'true' : 'false';
    el.style.setProperty('--frame-bg', card.theme.frameBg);
    el.style.setProperty('--frame-border', card.theme.frameBorder);
    el.style.setProperty('--win-bg', card.theme.winBg);
    el.style.setProperty('--card-glow', card.theme.glow);
    el.style.setProperty('--card-accent', card.theme.accent);

    el.innerHTML =
      '<div class="card-inner">' +
      '  <div class="slab s3"></div>' +
      '  <div class="slab s2"></div>' +
      '  <div class="slab s1"></div>' +
      '  <div class="card-back">' +
      '    <img class="card-back-img" src="' + (global.AGY_CARD_BACK || 'assets/cards/card-back.webp') + '" alt="卡背" draggable="false" />' +
      '    <div class="card-back-sheen"></div>' +
      '    <div class="card-back-tap">点击翻开</div>' +
      '  </div>' +
      '  <div class="face">' +
      '    <div class="win ' + card.theme.patternClass + '">' +
      '      <img class="card-art-img" src="' + card.sprite + '" alt="' + card.name + '" draggable="false" />' +
      '    </div>' +
      '    <div class="holo"></div>' +
      '    <div class="holo-counter"></div>' +
      '    <div class="glare"></div>' +
      '    <div class="meta">' +
      '      <div class="meta-top">' +
      '        <span class="card-name">' + card.name + '</span>' +
      '        <span class="card-role">' + card.role + '</span>' +
      '      </div>' +
      '      <div class="meta-mid">' +
      '        <span>' + card.cnTitle + '</span>' +
      '        <span>' + card.symbol + '</span>' +
      '      </div>' +
      '      <div class="meta-bot">' +
      '        <span>' + card.number + '</span>' +
      '        <span class="card-rarity">' + card.rarityLabel + '</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="glaze"></div>' +
      '  </div>' +
      '  <div class="pop">' +
      '    <span class="pop-badge">' + card.symbol + '</span>' +
      '  </div>' +
      '</div>';

    return el;
  }

  function computeFanSlots() {
    var vw = window.innerWidth;
    var cw = clamp(vw * 0.142, 144, 212);
    var maxHalf = Math.min(cw * 2.38, Math.max(240, (vw - cw - 48) * 0.5));
    var angles = [-4, -2, 0, 2, 4];
    var yArc = [12, 4, 0, 4, 12];
    var slots = [];
    for (var i = 0; i < 5; i++) {
      var frac = (i - 2) / 2; // -1, -0.5, 0, +0.5, +1
      slots.push({
        x: frac * maxHalf,
        y: yArc[i] - 12,
        rz: angles[i]
      });
    }
    return slots;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function launchCardsFanOut() {
    sceneEl.classList.add('flat');
    cardsLayerEl.innerHTML = '';
    cardStates = [];

    album.packsOpened += 1;
    saveAlbum();
    global.AgyAudio.playOrbitalDeal();

    var launchEpoch = performance.now();
    var slots = computeFanSlots();
    state.packCards.forEach(function (card, idx) {
      var el = createCardElement(card, { facedown: true });
      el.style.opacity = '0';
      cardsLayerEl.appendChild(el);
      var faceEl = el.querySelector('.face');

      var cs = {
        idx: idx,
        card: card,
        el: el,
        faceEl: faceEl,
        revealed: false,
        hovered: false,
        orbiting: true,
        orbitStart: launchEpoch + idx * 55,
        orbitDur: 1320,
        lastTrailAt: 0,
        x: 0,
        y: 18,
        z: -32,
        vx: 0,
        vy: 0,
        vz: 0,
        tx: slots[idx].x,
        ty: slots[idx].y,
        tz: 0,
        rz: 0,
        vrz: 0,
        trz: slots[idx].rz,
        baseRz: slots[idx].rz,
        rx: -14,
        ry: 0,
        vrx: 0,
        vry: 0,
        trx: 0,
        tryAngle: 0,
        scale: 0.34,
        vscale: 0,
        tscale: 1,
        px: 50,
        py: 50,
        tpx: 50,
        tpy: 50
      };

      el.addEventListener('pointerenter', function () {
        if (cs.orbiting) return;
        cs.hovered = true;
        el.classList.add('is-hover');
        cs.tz = 96;
        cs.trz = 0;
        cs.tscale = 1.07;
        global.AgyAudio.playHoverTick();
      });

      el.addEventListener('pointermove', function (ev) {
        if (cs.orbiting) return;
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var nx = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
        var ny = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
        cs.trx = (0.5 - ny) * 26;
        cs.tryAngle = (nx - 0.5) * 28;
        cs.tpx = nx * 100;
        cs.tpy = ny * 100;
      });

      el.addEventListener('pointerleave', function () {
        cs.hovered = false;
        el.classList.remove('is-hover');
        cs.tz = 0;
        cs.trz = cs.baseRz;
        cs.tscale = 1;
        cs.trx = 0;
        cs.tryAngle = 0;
        cs.tpx = 50;
        cs.tpy = 50;
      });

      el.addEventListener('click', function () {
        if (cs.orbiting) return;
        global.AgyAudio.unlock();
        if (!cs.revealed) {
          revealCard(cs);
        } else {
          openInspectModal(cs.card);
        }
      });

      cardStates.push(cs);
    });

    setTimeout(function () {
      if (state.opened) {
        actionsEl.classList.add('show');
        updateActionButtons();
      }
    }, 1050);
  }

  function triggerScreenShake(intensity, duration) {
    state.shake.mag = Math.min(16, Math.max(state.shake.mag * 0.45, intensity));
    state.shake.elapsed = 0;
    state.shake.dur = duration || 0.28;
  }

  function revealCard(cs) {
    if (cs.revealed) return;
    cs.revealed = true;
    cs.el.classList.remove('facedown');
    global.AgyAudio.playCardFlip(cs.card.rarity);

    // Action-game heavy strike physical recoil & hit flash
    cs.vz = 560;
    cs.vscale = 2.4;
    cs.vrx = -140;
    cs.el.classList.add('impact-flash');
    setTimeout(function () {
      cs.el.classList.remove('impact-flash');
    }, 220);

    var shakeMap = { common: 6.5, rare: 8.5, holo: 10.5, ultra: 12.5, secret: 14.5 };
    triggerScreenShake(shakeMap[cs.card.rarity] || 8.5, 0.28);

    album.owned[cs.card.id] = (album.owned[cs.card.id] || 0) + 1;
    saveAlbum();

    setTimeout(function () {
      cs.el.classList.add('out');
    }, 180);

    var rect = cs.el.getBoundingClientRect();
    var cx = rect.left + rect.width * 0.5;
    var cy = rect.top + rect.height * 0.5;
    spawnDiamondRipple(cx, cy, cs.card.theme.glow, cs.card.rarity);

    var count = cs.card.rarity === 'secret' ? 56 : cs.card.rarity === 'ultra' ? 42 : 26;
    spawnConfetti(
      cx,
      rect.top + rect.height * 0.45,
      count,
      cs.card.rarity === 'secret' || cs.card.rarity === 'ultra',
      cs.card.theme.confetti
    );

    updateActionButtons();
  }

  function updateActionButtons() {
    var anyUnflipped = cardStates.some(function (cs) {
      return !cs.revealed;
    });
    btnFlipAll.hidden = !anyUnflipped;
    if (!anyUnflipped && state.opened) {
      hintPill.textContent = '悬停可体验立体全息 · 点击任意卡牌可 3D 放大检视';
    }
  }

  /* ---------- 3D Spotlight Inspect Modal ---------- */
  function openInspectModal(card) {
    global.AgyAudio.playInspectSound();
    inspectCardStage.innerHTML = '';
    var el = createCardElement(card, { facedown: false });
    inspectCardStage.appendChild(el);
    var faceEl = el.querySelector('.face');

    inspectRarity.textContent = card.rarityLabel;
    inspectSymbol.textContent = card.symbol;
    inspectNumber.textContent = card.number;
    inspectName.textContent = card.name;
    inspectCnTitle.textContent = card.cnTitle + ' · ' + card.role;
    inspectFlavor.textContent = card.flavor;

    var statDefs = [
      { label: '执行速度', val: card.stats.speed },
      { label: '推理深度', val: card.stats.depth },
      { label: '造物灵动', val: card.stats.creativity }
    ];
    inspectStats.innerHTML = '';
    statDefs.forEach(function (st) {
      var row = document.createElement('div');
      row.className = 'stat-row';
      var pips = '';
      for (var i = 1; i <= 5; i++) {
        pips += '<span class="stat-pip' + (i <= st.val ? ' on' : '') + '"></span>';
      }
      row.innerHTML = '<span>' + st.label + '</span><div class="stat-pips">' + pips + '</div>';
      inspectStats.appendChild(row);
    });

    inspectState = {
      el: el,
      faceEl: faceEl,
      rx: 0,
      ry: 0,
      trx: 0,
      tryAngle: 0,
      px: 50,
      py: 50,
      tpx: 50,
      tpy: 50
    };

    el.addEventListener('pointermove', function (ev) {
      var rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var nx = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      var ny = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
      inspectState.trx = (0.5 - ny) * 32;
      inspectState.tryAngle = (nx - 0.5) * 34;
      inspectState.tpx = nx * 100;
      inspectState.tpy = ny * 100;
    });

    el.addEventListener('pointerleave', function () {
      inspectState.trx = 0;
      inspectState.tryAngle = 0;
      inspectState.tpx = 50;
      inspectState.tpy = 50;
    });

    inspectModal.hidden = false;
  }

  function closeInspectModal() {
    inspectModal.hidden = true;
    inspectState = null;
    inspectCardStage.innerHTML = '';
  }

  /* ---------- Collection Album Modal ---------- */
  function renderAlbumModal() {
    var unique = 0;
    var totalOwned = 0;
    albumGrid.innerHTML = '';

    global.AGY_CARDS.forEach(function (card) {
      var count = album.owned[card.id] || 0;
      if (count > 0) unique++;
      totalOwned += count;

      var slot = document.createElement('div');
      slot.className = 'album-slot ' + (count > 0 ? 'owned' : 'locked');
      slot.innerHTML =
        (count > 0 ? '<span class="album-count">×' + count + '</span>' : '') +
        '<div class="album-thumb"><img src="' + card.sprite + '" alt="' + (count > 0 ? card.name : '未解锁') + '" /></div>' +
        '<div class="album-slot-name">' + (count > 0 ? card.name : '???') + '</div>' +
        '<div class="album-slot-sub">' + (count > 0 ? card.cnTitle + ' · ' + card.rarityLabel : card.number + ' · 未收录') + '</div>';

      if (count > 0) {
        slot.addEventListener('click', function () {
          albumModal.hidden = true;
          openInspectModal(card);
        });
      }
      albumGrid.appendChild(slot);
    });

    albumProgressText.textContent =
      '图鉴进度 ' + unique + ' / ' + global.AGY_CARDS.length +
      ' · 已拆 ' + album.packsOpened + ' 包 · 累计收录 ' + totalOwned + ' 张';
  }

  /* ---------- Confetti Canvas Physics ---------- */
  function resizeFx() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxCanvas.width = Math.floor(window.innerWidth * dpr);
    fxCanvas.height = Math.floor(window.innerHeight * dpr);
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnConfetti(cx, cy, count, isRich, customPalette) {
    var palette = customPalette || (
      isRich
        ? ['#fde047', '#f59e0b', '#38bdf8', '#f472b6', '#ffffff']
        : ['#38bdf8', '#f472b6', '#fde047', '#34d399', '#818cf8', '#fb7185']
    );
    var shapes = ['circle', 'rect', 'star', 'coin'];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (isRich ? 280 : 210) + Math.random() * 540;
      particles.push({
        x: cx + (Math.random() - 0.5) * 32,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 180,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 11,
        life: 0,
        maxLife: 1.3 + Math.random() * 1.1,
        color: palette[i % palette.length],
        shape: shapes[i % shapes.length]
      });
    }
  }

  function spawnDiamondRipple(cx, cy, color, rarity) {
    var maxR = rarity === 'secret' ? 360
      : rarity === 'ultra' ? 335
      : rarity === 'holo' ? 315
      : 290;
    var strokeColor = color || '#38bdf8';

    // Primary 0.50s diamond shockwave
    ripples.push({
      x: cx,
      y: cy,
      elapsed: 0,
      delay: 0,
      dur: 0.50,
      startR: 16,
      maxR: maxR,
      lwStart: 8.5,
      lwEnd: 1.4,
      color: strokeColor,
      glow: true,
      fillFlash: false
    });

    // Secondary trailing echo diamond finishing at 0.50s
    ripples.push({
      x: cx,
      y: cy,
      elapsed: 0,
      delay: 0.055,
      dur: 0.445,
      startR: 12,
      maxR: Math.round(maxR * 0.72),
      lwStart: 4.5,
      lwEnd: 0.9,
      color: '#ffffff',
      glow: false,
      fillFlash: false
    });

    // Instant center strike diamond flash
    ripples.push({
      x: cx,
      y: cy,
      elapsed: 0,
      delay: 0,
      dur: 0.14,
      startR: 18,
      maxR: 92,
      lwStart: 0,
      lwEnd: 0,
      color: '#ffffff',
      glow: true,
      fillFlash: true
    });
  }

  function stepAndDrawRipples(dt) {
    if (!ripples.length) return;
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i];
      rp.elapsed += dt;
      if (rp.elapsed < rp.delay) continue;
      var localT = rp.elapsed - rp.delay;
      if (localT >= rp.dur) {
        ripples.splice(i, 1);
        continue;
      }

      var p = localT / rp.dur;
      var ease = 1 - Math.pow(1 - p, 4);
      var r = lerp(rp.startR, rp.maxR, ease);
      var alpha = Math.pow(1 - p, 1.35);

      fxCtx.save();
      fxCtx.translate(rp.x, rp.y);
      fxCtx.beginPath();
      fxCtx.moveTo(0, -r);
      fxCtx.lineTo(r, 0);
      fxCtx.lineTo(0, r);
      fxCtx.lineTo(-r, 0);
      fxCtx.closePath();

      if (rp.fillFlash) {
        fxCtx.globalAlpha = clamp(alpha * 0.72, 0, 1);
        fxCtx.fillStyle = rp.color;
        fxCtx.shadowBlur = 24;
        fxCtx.shadowColor = rp.color;
        fxCtx.fill();
      } else {
        var lw = lerp(rp.lwStart, rp.lwEnd, p);
        fxCtx.globalAlpha = clamp(alpha * 0.96, 0, 1);
        fxCtx.strokeStyle = rp.color;
        fxCtx.lineWidth = lw;
        fxCtx.lineJoin = 'miter';
        if (rp.glow) {
          fxCtx.shadowBlur = 22 * (1 - p * 0.5);
          fxCtx.shadowColor = rp.color;
        }
        fxCtx.stroke();

        if (rp.glow) {
          fxCtx.shadowBlur = 0;
          fxCtx.globalAlpha = clamp(alpha * 0.85, 0, 1);
          fxCtx.strokeStyle = '#ffffff';
          fxCtx.lineWidth = Math.max(0.8, lw * 0.42);
          fxCtx.stroke();
        }
      }
      fxCtx.restore();
    }
  }

  function stepAndDrawConfetti(dt) {
    if (!particles.length) return;

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 680 * dt; // gravity
      p.vx *= 1 - 1.5 * dt; // drag
      p.vy *= 1 - 0.6 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;

      var alpha = p.life > p.maxLife * 0.72
        ? 1 - (p.life - p.maxLife * 0.72) / (p.maxLife * 0.28)
        : 1;

      fxCtx.save();
      fxCtx.globalAlpha = clamp(alpha, 0, 1);
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      fxCtx.fillStyle = p.color;

      if (p.shape === 'circle') {
        fxCtx.beginPath();
        fxCtx.arc(0, 0, p.size * 0.48, 0, Math.PI * 2);
        fxCtx.fill();
      } else if (p.shape === 'rect') {
        fxCtx.beginPath();
        fxCtx.roundRect(-p.size * 0.5, -p.size * 0.32, p.size, p.size * 0.64, 2);
        fxCtx.fill();
      } else if (p.shape === 'coin') {
        fxCtx.beginPath();
        fxCtx.ellipse(0, 0, p.size * 0.5, p.size * 0.26, 0, 0, Math.PI * 2);
        fxCtx.fill();
      } else {
        // 4-point Mario star
        var r = p.size * 0.65;
        var ir = r * 0.34;
        fxCtx.beginPath();
        for (var k = 0; k < 8; k++) {
          var a = (k * Math.PI) / 4;
          var rad = k % 2 === 0 ? r : ir;
          if (k === 0) fxCtx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else fxCtx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        fxCtx.closePath();
        fxCtx.fill();
      }
      fxCtx.restore();
    }
  }

  var PACK_PALETTES = [
    { name: 'Cobalt Warp', pack: '#273bf0', deep: '#151b66' },
    { name: 'Famicom Crimson', pack: '#d92638', deep: '#6f0f1c' },
    { name: 'Midnight Obsidian', pack: '#22294a', deep: '#0c1026' }
  ];
  var packColorIdx = -1;

  function applyPackColorway() {
    if (state.packGod) {
      packEl.style.removeProperty('--pack');
      packEl.style.removeProperty('--pack-deep');
      return;
    }
    var pal = PACK_PALETTES[Math.max(0, packColorIdx) % PACK_PALETTES.length];
    packEl.style.setProperty('--pack', pal.pack);
    packEl.style.setProperty('--pack-deep', pal.deep);
  }

  /* ---------- Reset Pack ---------- */
  function resetPack() {
    state.opened = false;
    state.autoTearing = false;
    state.packGod = state.godArmed;
    if (!state.packGod) {
      packColorIdx = (packColorIdx + 1) % PACK_PALETTES.length;
    } else if (packColorIdx < 0) {
      packColorIdx = 0;
    }
    state.packCards = global.drawPackCards(state.packGod);
    state.tearPts = generateTearProfile();
    state.tearCut = 0;
    state.tearDir = 1;
    state.curlTension = 0;
    state.curlVel = 0;
    state.flapFly = 0;
    state.flapFlyVel = 0;
    state.packDropY = 0;
    state.packDropAlpha = 1;
    state.drag = null;
    state.shake.mag = 0;
    state.shake.elapsed = 0;
    state.shake.dur = 0;
    stageEl.style.transform = '';
    if (backdropEl) backdropEl.style.transform = '';
    ripples = [];
    state.orbHovering = false;
    orbEl.classList.remove('orb-pet');

    sceneEl.classList.remove('flat');
    cardsLayerEl.innerHTML = '';
    cardStates = [];
    actionsEl.classList.remove('show');
    godBanner.classList.remove('show');

    packEl.classList.remove('opened', 'held', 'hurt', 'tug', 'seal-peek');
    packEl.classList.toggle('god', state.packGod);
    applyPackColorway();
    packEl.style.opacity = '1';
    packEl.style.display = '';
    flapEl.style.transform = '';
    flapEl.style.opacity = '1';
    flowEl.classList.remove('peek', 'burst');
    groundEl.style.opacity = '1';

    if (state.packGod) {
      sealGlowEl.style.setProperty('--seal-color', '#fbbf24');
    }

    applySliceClips();
    renderTearGeometry();
    hintPill.textContent = '横向划过封口撕开 · 滑过小鸡听音效 · 晃动卡包可验包';
  }

  /* ---------- Pointer Gestures on #hit ---------- */
  hitEl.addEventListener('pointerenter', function () {
    if (!state.opened) packEl.classList.add('hit-hover');
  });

  hitEl.addEventListener('pointerleave', function () {
    packEl.classList.remove('hit-hover');
  });

  hitEl.addEventListener('pointerdown', function (ev) {
    if (state.opened || state.autoTearing) return;
    global.AgyAudio.unlock();
    state.orbHovering = false;
    orbEl.classList.remove('orb-pet');
    hitEl.setPointerCapture(ev.pointerId);

    var rect = packEl.getBoundingClientRect();
    var u = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
    var v = clamp((ev.clientY - rect.top) / rect.height, 0, 1);

    state.drag = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      lastX: ev.clientX,
      lastY: ev.clientY,
      startTime: performance.now(),
      u: u,
      v: v,
      mode: null, // 'tear' | 'tug'
      maxDist: 0,
      prevDxSign: 0,
      prevDySign: 0,
      reversals: []
    };
  });

  hitEl.addEventListener('pointermove', function (ev) {
    var d = state.drag;
    if (!d || ev.pointerId !== d.pointerId || state.opened) return;

    var dxTotal = ev.clientX - d.startX;
    var dyTotal = ev.clientY - d.startY;
    var stepDx = ev.clientX - d.lastX;
    var stepDy = ev.clientY - d.lastY;
    d.lastX = ev.clientX;
    d.lastY = ev.clientY;
    d.maxDist = Math.max(d.maxDist, Math.hypot(dxTotal, dyTotal));

    // Lock intent after 6px threshold
    if (!d.mode && d.maxDist >= 6) {
      if (d.v <= 0.25 && Math.abs(dxTotal) >= Math.abs(dyTotal) * 0.8) {
        d.mode = 'tear';
        if (state.tearCut <= 0.02) {
          state.tearDir = dxTotal >= 0 || d.u < 0.5 ? 1 : -1;
        }
        packEl.classList.add('held', 'hurt');
      } else {
        d.mode = 'tug';
        packEl.classList.add('tug');
        global.AgyAudio.playTug();
      }
    }

    if (d.mode === 'tear') {
      var rect = packEl.getBoundingClientRect();
      var localFrac = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      var targetCut = state.tearDir === 1 ? localFrac : 1 - localFrac;

      // Advance tear if pulling in active tear direction
      if (targetCut > state.tearCut) {
        var delta = targetCut - state.tearCut;
        state.tearCut = targetCut;
        var vel = clamp(Math.abs(stepDx) / 22, 0.15, 1);
        state.curlTension = lerp(state.curlTension, clamp(0.42 + state.tearCut * 0.58 + vel * 0.22, 0, 1.25), 0.45);
        global.AgyAudio.playTearGrain(vel, state.tearCut);
      } else {
        // Elastic resistance if backtracking slightly while held
        state.curlTension = lerp(state.curlTension, clamp(0.28 + targetCut * 0.55, 0.15, 1), 0.25);
      }

      // Slight pack pull reaction
      state.ptx = clamp(dxTotal * 0.12, -20, 20);
      state.pty = clamp(dyTotal * 0.09, -12, 16);
      state.rtz = state.tearDir * clamp(state.tearCut * 3.5, 0, 4);
      state.stx = 1.032;
      state.sty = 0.945;

      renderTearGeometry();

      if (state.tearCut >= 0.86) {
        state.drag = null;
        completeTear();
      }
    } else if (d.mode === 'tug') {
      state.ptx = clamp(dxTotal * 0.34, -52, 52);
      state.pty = clamp(dyTotal * 0.34, -46, 52);
      state.rty = clamp(dxTotal * 0.14, -18, 18);
      state.rtx = clamp(-dyTotal * 0.12, -16, 16);
      state.rtz = clamp(dxTotal * 0.04, -6, 6);

      var stretch = clamp(Math.abs(dyTotal) / 240, 0, 0.09);
      state.stx = 1 - stretch * 0.48;
      state.sty = 1 + stretch;

      // Shake-to-peek reversal detector
      var now = performance.now();
      var sxSign = Math.abs(stepDx) > 3.5 ? (stepDx > 0 ? 1 : -1) : 0;
      var sySign = Math.abs(stepDy) > 3.5 ? (stepDy > 0 ? 1 : -1) : 0;
      if ((sxSign && sxSign !== d.prevDxSign) || (sySign && sySign !== d.prevDySign)) {
        if (sxSign) d.prevDxSign = sxSign;
        if (sySign) d.prevDySign = sySign;
        d.reversals.push(now);
        d.reversals = d.reversals.filter(function (t) {
          return now - t < 650;
        });
        if (d.reversals.length >= 3) {
          d.reversals = [];
          triggerShakePeek();
        }
      }
    }
  });

  function finishDrag(ev) {
    var d = state.drag;
    if (!d || ev.pointerId !== d.pointerId) return;
    state.drag = null;

    var dt = performance.now() - d.startTime;
    packEl.classList.remove('held', 'hurt', 'tug');
    state.ptx = 0;
    state.pty = 0;
    state.stx = 1;
    state.sty = 1;

    if (!d.mode && d.maxDist < 6 && dt < 320) {
      startAutoTear();
      return;
    }

    if (d.mode === 'tear' && !state.opened) {
      if (state.tearCut >= 0.52) {
        completeTear();
      } else if (state.tearCut > 0.02) {
        // Underdamped elastic rebound of partial tear
        state.curlVel = -3.4;
        global.AgyAudio.playTearRebound();
        showToast('再向右多撕一点就能彻底打开！', 1600);
      }
    }
  }

  hitEl.addEventListener('pointerup', finishDrag);
  hitEl.addEventListener('pointercancel', finishDrag);

  /* ---------- Global Stage Pointer Tilt, Audio Unlock & Pack Chick Hover ---------- */
  window.addEventListener('pointerdown', function () {
    global.AgyAudio.unlock();
  }, { passive: true });

  window.addEventListener('pointermove', function (ev) {
    var w = window.innerWidth || 1;
    var h = window.innerHeight || 1;
    state.cursorNormX = clamp((ev.clientX / w) * 2 - 1, -1, 1);
    state.cursorNormY = clamp((ev.clientY / h) * 2 - 1, -1, 1);

    if (!state.drag && !state.opened) {
      state.rty = state.cursorNormX * 14;
      state.rtx = -state.cursorNormY * 11;
      state.rtz = state.cursorNormX * 2.2;
    }

    // Hover / glide over unopened pack Chick mascot plays pack chime
    if (!state.opened && !state.drag && !state.autoTearing) {
      var orbRect = orbEl.getBoundingClientRect();
      var cx = orbRect.left + orbRect.width * 0.5;
      var cy = orbRect.top + orbRect.height * 0.5;
      var r = orbRect.width * 0.56;
      var insideOrb = orbRect.width > 0 && Math.hypot(ev.clientX - cx, ev.clientY - cy) <= r;

      if (insideOrb) {
        if (!state.orbHovering) {
          state.orbHovering = true;
          state.orbLastX = ev.clientX;
          state.orbLastY = ev.clientY;
          orbEl.classList.add('orb-pet');
          global.AgyAudio.playPackChickHover(0.7, state.orbNoteIdx++);
        } else if (Math.hypot(ev.clientX - state.orbLastX, ev.clientY - state.orbLastY) >= 36) {
          state.orbLastX = ev.clientX;
          state.orbLastY = ev.clientY;
          orbEl.classList.add('orb-pet');
          global.AgyAudio.playPackChickHover(0.75, state.orbNoteIdx++);
        }
      } else if (state.orbHovering) {
        state.orbHovering = false;
        orbEl.classList.remove('orb-pet');
      }
    } else if (state.orbHovering) {
      state.orbHovering = false;
      orbEl.classList.remove('orb-pet');
    }

    // Update metallic foil reflection vars on pack
    var gx = clamp(50 + state.cursorNormX * 36, 8, 92);
    var gl = clamp(32 + state.cursorNormX * 42, 4, 96);
    var gm = clamp(56 - state.cursorNormX * 30, 8, 92);
    var gt = clamp(0.28 + (1 - Math.abs(state.cursorNormY)) * 0.22, 0.14, 0.55);
    packEl.style.setProperty('--gx', gx.toFixed(1) + '%');
    packEl.style.setProperty('--gl', gl.toFixed(1) + '%');
    packEl.style.setProperty('--gm', gm.toFixed(1) + '%');
    packEl.style.setProperty('--gt', gt.toFixed(2));
  });

  /* ---------- Controls ---------- */
  btnTheme.addEventListener('click', function () {
    global.AgyAudio.unlock();
    global.AgyAudio.playUiClick();
    state.theme = state.theme === 'dark' ? 'day' : 'dark';
    htmlEl.setAttribute('data-theme', state.theme);
    themeIco.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    themeLabel.textContent = state.theme === 'dark' ? '暗房' : '白昼';
  });

  btnGod.addEventListener('click', function () {
    global.AgyAudio.unlock();
    global.AgyAudio.playUiClick();
    state.godArmed = !state.godArmed;
    btnGod.setAttribute('aria-pressed', String(state.godArmed));
    godLabel.textContent = state.godArmed ? '全闪已装填' : '全闪测试';
    if (modeLabel) modeLabel.textContent = state.godArmed ? '欧皇全闪' : '标准卡池';
    if (modePill) modePill.classList.toggle('god', state.godArmed);

    if (!state.opened && state.tearCut === 0) {
      state.packGod = state.godArmed;
      state.packCards = global.drawPackCards(state.packGod);
      packEl.classList.toggle('god', state.packGod);
      applyPackColorway();
      if (state.packGod) {
        sealGlowEl.style.setProperty('--seal-color', '#fbbf24');
        showToast('已切换为【欧皇全闪包】，撕开试试！', 1800);
      }
    } else {
      showToast(state.godArmed ? '下一包将必出欧皇全闪包！' : '已切回标准随机卡池', 1800);
    }
  });

  btnMute.addEventListener('click', function () {
    var nextMuted = !global.AgyAudio.isMuted();
    global.AgyAudio.setMuted(nextMuted);
    btnMute.setAttribute('aria-pressed', String(nextMuted));
    muteIco.textContent = nextMuted ? '🔇' : '🔊';
    if (!nextMuted) {
      global.AgyAudio.unlock();
      global.AgyAudio.playUiClick();
    }
  });

  btnFlipAll.addEventListener('click', function () {
    global.AgyAudio.unlock();
    var delay = 0;
    cardStates.forEach(function (cs) {
      if (!cs.revealed) {
        setTimeout(function () {
          revealCard(cs);
        }, delay);
        delay += 110;
      }
    });
  });

  btnAgain.addEventListener('click', function () {
    global.AgyAudio.unlock();
    global.AgyAudio.playUiClick();
    resetPack();
  });

  btnAlbum.addEventListener('click', function () {
    global.AgyAudio.unlock();
    global.AgyAudio.playUiClick();
    renderAlbumModal();
    albumModal.hidden = false;
  });

  albumClose.addEventListener('click', function () {
    global.AgyAudio.playUiClick();
    albumModal.hidden = true;
  });

  btnResetAlbum.addEventListener('click', function () {
    global.AgyAudio.playUiClick();
    album = { packsOpened: 0, owned: {} };
    saveAlbum();
    renderAlbumModal();
    showToast('已重置收集存档', 1500);
  });

  inspectClose.addEventListener('click', closeInspectModal);

  inspectModal.addEventListener('click', function (ev) {
    if (ev.target === inspectModal) closeInspectModal();
  });

  albumModal.addEventListener('click', function (ev) {
    if (ev.target === albumModal) albumModal.hidden = true;
  });

  window.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (!inspectModal.hidden) closeInspectModal();
      else if (!albumModal.hidden) albumModal.hidden = true;
    }
  });

  window.addEventListener('resize', function () {
    resizeFx();
    if (cardStates.length) {
      var slots = computeFanSlots();
      for (var i = 0; i < cardStates.length; i++) {
        cardStates[i].tx = slots[i].x;
        cardStates[i].ty = slots[i].y;
        cardStates[i].baseRz = slots[i].rz;
        if (!cardStates[i].hovered) cardStates[i].trz = slots[i].rz;
      }
    }
  });

  /* ---------- Main Spring Physics Loop (requestAnimationFrame) ---------- */
  var prevTime = performance.now();

  function tick(now) {
    var dt = Math.min(0.04, Math.max(0.004, (now - prevTime) / 1000));
    prevTime = now;

    // 1. Pack spring physics
    var kPos = 180;
    var cPos = 16;
    state.pvx += ((state.ptx - state.px) * kPos - state.pvx * cPos) * dt;
    state.pvy += ((state.pty - state.py) * kPos - state.pvy * cPos) * dt;
    state.px += state.pvx * dt;
    state.py += state.pvy * dt;

    var kRot = 150;
    var cRot = 14;
    state.rvx += ((state.rtx - state.rx) * kRot - state.rvx * cRot) * dt;
    state.rvy += ((state.rty - state.ry) * kRot - state.rvy * cRot) * dt;
    state.rvz += ((state.rtz - state.rz) * kRot - state.rvz * cRot) * dt;
    state.rx += state.rvx * dt;
    state.ry += state.rvy * dt;
    state.rz += state.rvz * dt;

    var kScale = 220;
    var cScale = 16;
    state.svx += ((state.stx - state.sx) * kScale - state.svx * cScale) * dt;
    state.svy += ((state.sty - state.sy) * kScale - state.svy * cScale) * dt;
    state.sx += state.svx * dt;
    state.sy += state.svy * dt;

    // 2. Partial tear elastic rebound when released mid-tear
    if (!state.drag && !state.opened && state.tearCut > 0.02) {
      var targetCurl = state.tearCut * 0.36;
      state.curlVel += ((targetCurl - state.curlTension) * 210 - state.curlVel * 13) * dt;
      state.curlTension = clamp(state.curlTension + state.curlVel * dt, 0.05, 1.35);
      renderTearGeometry();
    }

    // 3. Opened pack drop & detached flap flight
    if (state.opened) {
      state.packDropY = lerp(state.packDropY, 340, 1 - Math.exp(-5.2 * dt));
      state.packDropAlpha = Math.max(0, state.packDropAlpha - dt * 1.9);
      packEl.style.opacity = state.packDropAlpha.toFixed(3);
      groundEl.style.opacity = state.packDropAlpha.toFixed(3);

      state.flapFly += dt * 2.2;
      flapEl.style.transform =
        'translateZ(20px) translate3d(' +
        (state.tearDir * state.flapFly * 110).toFixed(1) + 'px, ' +
        (-state.flapFly * 180).toFixed(1) + 'px, 0) rotateZ(' +
        (state.tearDir * state.flapFly * 28).toFixed(1) + 'deg)';
      flapEl.style.opacity = Math.max(0, 1 - state.flapFly * 1.1).toFixed(3);
    }

    // Apply pack transform & inverse ground shadow
    var idleFloatY = state.opened || state.drag ? 0 : Math.sin(now * 0.0022) * 5;
    var totalPackY = state.py + idleFloatY + state.packDropY;
    packEl.style.transform =
      'translate3d(' + state.px.toFixed(2) + 'px, ' + totalPackY.toFixed(2) + 'px, 0px)' +
      ' rotateX(' + state.rx.toFixed(2) + 'deg)' +
      ' rotateY(' + state.ry.toFixed(2) + 'deg)' +
      ' rotateZ(' + state.rz.toFixed(2) + 'deg)' +
      ' scale3d(' + state.sx.toFixed(3) + ', ' + state.sy.toFixed(3) + ', 1)';

    var groundScale = clamp(1 - (totalPackY - idleFloatY) * 0.0018, 0.72, 1.16);
    groundEl.style.transform =
      'translate3d(' + (state.px * 0.85).toFixed(2) + 'px, 238px, 0px) scale(' + groundScale.toFixed(3) + ')';

    // 4. Mascot cursor eye-tracking & natural blink
    state.eyeX = lerp(state.eyeX, state.cursorNormX * 2.9, 1 - Math.exp(-14 * dt));
    state.eyeY = lerp(state.eyeY, state.cursorNormY * 3.4, 1 - Math.exp(-14 * dt));
    for (var p = 0; p < pupils.length; p++) {
      pupils[p].style.transform =
        'translate3d(' + state.eyeX.toFixed(2) + 'px, ' + state.eyeY.toFixed(2) + 'px, 0)';
    }

    if (now >= state.nextBlinkAt && !state.opened) {
      state.nextBlinkAt = now + 2400 + Math.random() * 2800;
      eyes.forEach(function (e) { e.classList.add('blink'); });
      setTimeout(function () {
        eyes.forEach(function (e) { e.classList.remove('blink'); });
      }, 130);
    }

    // 5. Card 3-phase orbital fly-out & fan-out hover tilt springs
    var orbitRx = Math.min(window.innerWidth * 0.34, 410);
    var orbitRy = 86;
    var orbitRz = 190;

    for (var c = 0; c < cardStates.length; c++) {
      var cs = cardStates[c];
      if (cs.orbiting) {
        var elapsed = now - cs.orbitStart;
        if (elapsed <= 0) {
          cs.el.style.opacity = '0';
          continue;
        }
        var u = clamp(elapsed / cs.orbitDur, 0, 1);
        cs.el.style.opacity = clamp(u / 0.08, 0, 1).toFixed(3);

        var wEmerge = easeOutCubic(clamp(u / 0.28, 0, 1));
        var sOrbit = smoothstep(0.14, 0.86, u);
        var wSettle = smoothstep(0.68, 1.0, u);

        var sweepSpan = Math.PI * 1.68 + (cs.idx - 2) * 0.34;
        var angle = -Math.PI * 0.5 + sOrbit * sweepSpan;
        var ox = Math.cos(angle) * orbitRx;
        var oy = Math.sin(angle) * orbitRy;
        var oz = Math.cos(angle - 0.35) * orbitRz;

        var preX = lerp(0, ox, wEmerge);
        var preY = lerp(18, oy, wEmerge);
        var preZ = lerp(-32, oz, wEmerge);

        cs.x = lerp(preX, cs.tx, wSettle);
        cs.y = lerp(preY, cs.ty, wSettle);
        cs.z = lerp(preZ, 0, wSettle);

        var orbScale = 0.90 + (oz / orbitRz) * 0.14;
        var preScale = lerp(0.34, orbScale, wEmerge);
        cs.scale = lerp(preScale, 1.0, wSettle);

        var orbRy = Math.sin(angle) * 26;
        var orbRz = Math.cos(angle) * 13;
        var orbRx = -9 * Math.sin(angle);
        cs.rx = lerp(-14, orbRx, wEmerge) * (1 - wSettle);
        cs.ry = lerp(0, orbRy, wEmerge * (1 - wSettle));
        cs.rz = lerp(0, orbRz, wEmerge) * (1 - wSettle) + cs.baseRz * wSettle;

        cs.el.style.zIndex = String(Math.round(50 + cs.z * 0.2));

        // Emit subtle sparkle trail along orbit
        if (u > 0.20 && u < 0.84 && now - cs.lastTrailAt > 58) {
          cs.lastTrailAt = now;
          spawnConfetti(
            window.innerWidth * 0.5 + cs.x,
            window.innerHeight * 0.5 + cs.y,
            2,
            false,
            cs.card.theme.confetti
          );
        }

        if (u >= 1) {
          cs.orbiting = false;
          cs.x = cs.tx;
          cs.y = cs.ty;
          cs.z = 0;
          cs.vx = 0;
          cs.vy = 0;
          cs.vz = 0;
          cs.rx = 0;
          cs.ry = 0;
          cs.rz = cs.baseRz;
          cs.vrx = 0;
          cs.vry = 0;
          cs.vrz = 0;
          cs.scale = 1;
          cs.vscale = 0;
          cs.el.style.zIndex = '';
          cs.el.style.opacity = '';
        }
      } else {
        var ck = 155;
        var cc = 16;
        cs.vx += ((cs.tx - cs.x) * ck - cs.vx * cc) * dt;
        cs.vy += ((cs.ty - cs.y) * ck - cs.vy * cc) * dt;
        cs.vz += ((cs.tz - cs.z) * ck - cs.vz * cc) * dt;
        cs.x += cs.vx * dt;
        cs.y += cs.vy * dt;
        cs.z += cs.vz * dt;

        cs.vrx += ((cs.trx - cs.rx) * 190 - cs.vrx * 18) * dt;
        cs.vry += ((cs.tryAngle - cs.ry) * 190 - cs.vry * 18) * dt;
        cs.vrz += ((cs.trz - cs.rz) * 170 - cs.vrz * 17) * dt;
        cs.rx += cs.vrx * dt;
        cs.ry += cs.vry * dt;
        cs.rz += cs.vrz * dt;

        cs.vscale += ((cs.tscale - cs.scale) * 200 - cs.vscale * 18) * dt;
        cs.scale += cs.vscale * dt;
      }

      cs.px = lerp(cs.px, cs.tpx, 1 - Math.exp(-16 * dt));
      cs.py = lerp(cs.py, cs.tpy, 1 - Math.exp(-16 * dt));
      var hyp = clamp(Math.hypot((cs.px - 50) / 50, (cs.py - 50) / 50), 0, 1.25);

      cs.el.style.transform =
        'perspective(1200px)' +
        ' translate3d(' + cs.x.toFixed(2) + 'px, ' + cs.y.toFixed(2) + 'px, ' + cs.z.toFixed(2) + 'px)' +
        ' rotateZ(' + cs.rz.toFixed(2) + 'deg)' +
        ' rotateX(' + cs.rx.toFixed(2) + 'deg)' +
        ' rotateY(' + cs.ry.toFixed(2) + 'deg)' +
        ' scale(' + cs.scale.toFixed(3) + ')';

      cs.faceEl.style.setProperty('--px', cs.px.toFixed(2));
      cs.faceEl.style.setProperty('--py', cs.py.toFixed(2));
      cs.faceEl.style.setProperty('--hyp', hyp.toFixed(3));
    }

    // 6. Inspect Modal 3D tilt smoothing
    if (inspectState) {
      var ins = inspectState;
      ins.rx = lerp(ins.rx, ins.trx, 1 - Math.exp(-15 * dt));
      ins.ry = lerp(ins.ry, ins.tryAngle, 1 - Math.exp(-15 * dt));
      ins.px = lerp(ins.px, ins.tpx, 1 - Math.exp(-15 * dt));
      ins.py = lerp(ins.py, ins.tpy, 1 - Math.exp(-15 * dt));
      var ihyp = clamp(Math.hypot((ins.px - 50) / 50, (ins.py - 50) / 50), 0, 1.25);
      ins.el.style.transform =
        'perspective(1200px) rotateX(' + ins.rx.toFixed(2) + 'deg) rotateY(' + ins.ry.toFixed(2) + 'deg)';
      ins.faceEl.style.setProperty('--px', ins.px.toFixed(2));
      ins.faceEl.style.setProperty('--py', ins.py.toFixed(2));
      ins.faceEl.style.setProperty('--hyp', ihyp.toFixed(3));
    }

    // 7. Confetti & diamond shockwave ripples
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stepAndDrawRipples(dt);
    stepAndDrawConfetti(dt);

    // 8. Damped action-game impact screen shake
    if (state.shake.elapsed < state.shake.dur) {
      state.shake.elapsed += dt;
      var sProg = clamp(state.shake.elapsed / state.shake.dur, 0, 1);
      var decay = Math.pow(1 - sProg, 2.2);
      var freqT = state.shake.elapsed * 58;
      var sx = (Math.sin(freqT * 1.37) + Math.cos(freqT * 2.13) * 0.5) * 0.68 * state.shake.mag * decay;
      var sy = (Math.cos(freqT * 1.71) + Math.sin(freqT * 2.41) * 0.5) * 0.68 * state.shake.mag * decay;
      var srot = Math.sin(freqT * 1.9) * (state.shake.mag * 0.055) * decay;
      stageEl.style.transform =
        'translate3d(' + sx.toFixed(2) + 'px, ' + sy.toFixed(2) + 'px, 0) rotate(' + srot.toFixed(3) + 'deg)';
      if (backdropEl) {
        backdropEl.style.transform =
          'translate3d(' + (sx * 0.45).toFixed(2) + 'px, ' + (sy * 0.45).toFixed(2) + 'px, 0)';
      }
    } else if (stageEl.style.transform) {
      stageEl.style.transform = '';
      if (backdropEl) backdropEl.style.transform = '';
      state.shake.mag = 0;
    }

    requestAnimationFrame(tick);
  }

  /* ---------- Init ---------- */
  resizeFx();
  buildPackRims();
  buildFlapSlices();
  updateAlbumBadge();
  resetPack();
  requestAnimationFrame(tick);
})(window);
