(function (global) {
  'use strict';

  var RARITIES = {
    common: {
      id: 'common',
      label: 'Common',
      cnLabel: '普通',
      badge: '• Common',
      symbol: '•',
      weight: 30,
      stars: 1,
      rank: 1,
      sealHint: '封口透出【软萌微光】',
      glow: '#fde047'
    },
    rare: {
      id: 'rare',
      label: 'Rare',
      cnLabel: '稀有',
      badge: '◆ Rare',
      symbol: '◆',
      weight: 22,
      stars: 2,
      rank: 2,
      sealHint: '封口透出【迪迦星光】',
      glow: '#38bdf8'
    },
    holo: {
      id: 'holo',
      label: 'Holo Rare',
      cnLabel: '闪耀全息',
      badge: '✦✦ Holo Rare',
      symbol: '✦✦',
      weight: 15,
      stars: 3,
      rank: 3,
      sealHint: '封口透出【甜心胡萝卜棱镜】',
      glow: '#f472b6'
    },
    ultra: {
      id: 'ultra',
      label: 'Ultra Rare',
      cnLabel: '超罕炫金',
      badge: '★ Ultra Rare',
      symbol: '★',
      weight: 8,
      stars: 4,
      rank: 4,
      sealHint: '封口透出【七彩花瓣炫金光】',
      glow: '#fb923c'
    },
    secret: {
      id: 'secret',
      label: 'Secret Rare · 逆闪异画',
      cnLabel: '逆闪异画',
      badge: '❖ 逆闪异画',
      symbol: '❖',
      weight: 4,
      stars: 5,
      rank: 5,
      sealHint: '封口透出【石之自由逆闪光】',
      glow: '#4ade80'
    }
  };

  var CARDS = [
    {
      id: 'pikachick',
      series: 'classic',
      name: '皮卡鸡',
      cnTitle: 'Pika Chick · 十万伏特',
      symbol: '⚡ · 01',
      number: 'NO. 001/008',
      role: 'SPARK',
      rarity: 'common',
      rarityLabel: RARITIES.common.badge,
      stars: 1,
      sprite: 'assets/cards/pikachick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #fffbe0 0%, #fef08a 58%, #fde047 100%)',
        frameBorder: '#ffffff',
        winBg: '#fef9c3',
        patternClass: 'pat-speed',
        textMode: 'light',
        accent: '#d97706',
        glow: '#facc15',
        confetti: ['#fde047', '#ef4444', '#fb923c', '#ffffff']
      },
      stats: { speed: 5, depth: 2, creativity: 4 },
      flavor: '戴着皮卡丘尖耳兜帽、背着小篮球的可爱小鸡，走路自带十万伏特萌力！'
    },
    {
      id: 'squidchick',
      series: 'classic',
      name: '章鱼鸡',
      cnTitle: 'Squid Chick · 傲娇竖笛',
      symbol: '♪ · 02',
      number: 'NO. 002/008',
      role: 'BARD',
      rarity: 'common',
      rarityLabel: RARITIES.common.badge,
      stars: 1,
      sprite: 'assets/cards/squidchick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #4c1d95 0%, #3b0764 56%, #2e1065 100%)',
        frameBorder: '#c4b5fd',
        winBg: '#9333ea',
        patternClass: 'pat-notes',
        textMode: 'dark',
        accent: '#6ee7b7',
        glow: '#a855f7',
        confetti: ['#a855f7', '#6ee7b7', '#fb923c', '#ffffff']
      },
      stats: { speed: 3, depth: 3, creativity: 5 },
      flavor: '裹着章鱼哥薄荷绿头套的艺术小鸡，虽然嘴上嫌吵但竖笛吹得比谁都起劲。'
    },
    {
      id: 'tigachick',
      series: 'classic',
      name: '迪迦鸡',
      cnTitle: 'Tiga Chick · 哉佩利敖光',
      symbol: '✦ · 03',
      number: 'NO. 003/008',
      role: 'LIGHT',
      rarity: 'rare',
      rarityLabel: RARITIES.rare.badge,
      stars: 2,
      sprite: 'assets/cards/tigachick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #1d4ed8 0%, #1e3a8a 52%, #172554 100%)',
        frameBorder: '#7dd3fc',
        winBg: '#38bdf8',
        patternClass: 'pat-rings',
        textMode: 'dark',
        accent: '#7dd3fc',
        glow: '#38bdf8',
        confetti: ['#38bdf8', '#ef4444', '#ffffff', '#fde047']
      },
      stats: { speed: 4, depth: 4, creativity: 3 },
      flavor: '戴上光之巨人银红战盔的小鸡战士，胸口计时器闪亮时就能化身光！'
    },
    {
      id: 'kunchick',
      series: 'classic',
      name: '篮球鸡',
      cnTitle: 'Hoops Chick · 银发练习生',
      symbol: '🏀 · 04',
      number: 'NO. 004/008',
      role: 'IDOL',
      rarity: 'rare',
      rarityLabel: RARITIES.rare.badge,
      stars: 2,
      sprite: 'assets/cards/kunchick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #1e1b4b 0%, #2b1249 52%, #0f172a 100%)',
        frameBorder: '#f472b6',
        winBg: '#bae6fd',
        patternClass: 'pat-prism',
        textMode: 'dark',
        accent: '#38bdf8',
        glow: '#f472b6',
        confetti: ['#38bdf8', '#f472b6', '#fb923c', '#ffffff']
      },
      stats: { speed: 4, depth: 3, creativity: 5 },
      flavor: '飘逸银灰中分头配黑色背带潮装，背上永不离身的篮球随时准备惊艳全场！'
    },
    {
      id: 'redbearchick',
      series: 'new',
      name: '红熊鸡',
      cnTitle: 'Red Bear · 甜心萌熊',
      symbol: '🧸 · 05',
      number: 'NO. 005/008',
      role: 'PLUSH',
      rarity: 'holo',
      rarityLabel: RARITIES.holo.badge,
      stars: 3,
      sprite: 'assets/cards/redbearchick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #5b132b 0%, #3d0c1f 54%, #260714 100%)',
        frameBorder: '#fda4af',
        winBg: '#fbcfe8',
        patternClass: 'pat-notes',
        textMode: 'dark',
        accent: '#fda4af',
        glow: '#fb7185',
        confetti: ['#fb7185', '#ef4444', '#38bdf8', '#ffffff']
      },
      stats: { speed: 4, depth: 3, creativity: 5 },
      flavor: '钻进樱花粉背景小红熊连体帽里的软萌小鸡，蓝色小蝴蝶结可爱度满分！'
    },
    {
      id: 'carrotchick',
      series: 'new',
      name: '胡萝卜鸡',
      cnTitle: 'Carrot Chick · 呆萌脆甜',
      symbol: '🥕 · 06',
      number: 'NO. 006/008',
      role: 'FRESH',
      rarity: 'holo',
      rarityLabel: RARITIES.holo.badge,
      stars: 3,
      sprite: 'assets/cards/carrotchick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #173a5e 0%, #102a45 54%, #431d07 100%)',
        frameBorder: '#fb923c',
        winBg: '#7dd3fc',
        patternClass: 'pat-rings',
        textMode: 'dark',
        accent: '#fdba74',
        glow: '#fb923c',
        confetti: ['#fb923c', '#38bdf8', '#4ade80', '#ffffff']
      },
      stats: { speed: 4, depth: 4, creativity: 4 },
      flavor: '斜斜顶着饱满胡萝卜头套出场的呆萌小鸡，元气满满仿佛刚从田里拔出来！'
    },
    {
      id: 'sunflowerchick',
      series: 'new',
      name: '太阳花鸡',
      cnTitle: 'Rainbow Chick · 七彩霸总',
      symbol: '🌈 · 07',
      number: 'NO. 007/008',
      role: 'RAINBOW',
      rarity: 'ultra',
      rarityLabel: RARITIES.ultra.badge,
      stars: 4,
      sprite: 'assets/cards/sunflowerchick.webp',
      theme: {
        frameBg: 'linear-gradient(155deg, #5b21b6 0%, #7c2d12 52%, #854d0e 100%)',
        frameBorder: '#fbbf24',
        winBg: '#93c5fd',
        patternClass: 'pat-apex',
        textMode: 'dark',
        accent: '#fde047',
        glow: '#fbbf24',
        confetti: ['#ef4444', '#fde047', '#4ade80', '#38bdf8', '#a855f7']
      },
      stats: { speed: 5, depth: 4, creativity: 5 },
      flavor: '被七彩糖果花瓣紧紧包围的挑眉酷鸡，眼神里写满了“全宇宙最靓的崽”！'
    },
    {
      id: 'jolynechick',
      series: 'new',
      name: '徐伦鸡',
      cnTitle: 'Jolyne Chick · 石之自由',
      symbol: '🦋 · 08',
      number: 'NO. 008/008',
      role: 'STAND',
      rarity: 'secret',
      rarityLabel: RARITIES.secret.badge,
      stars: 5,
      sprite: 'assets/cards/jolynechick.webp',
      theme: {
        frameBg: 'linear-gradient(145deg, #103b2a 0%, #162447 48%, #1e1b4b 82%, #2e200d 100%)',
        frameBorder: '#fde047',
        winBg: '#d9f99d',
        patternClass: 'pat-starburst',
        textMode: 'dark',
        accent: '#86efac',
        glow: '#4ade80',
        confetti: ['#4ade80', '#fde047', '#38bdf8', '#f472b6', '#ffffff']
      },
      stats: { speed: 5, depth: 5, creativity: 5 },
      flavor: '双丸子蓝编发配荧光绿挑染的石之自由头套，就连鸡嘴都染上了酷炫青柠绿！'
    }
  ];

  var CARD_MAP = {};
  CARDS.forEach(function (c) {
    if (global.AGY_SPRITES && global.AGY_SPRITES[c.id]) {
      c.sprite = global.AGY_SPRITES[c.id];
    }
    CARD_MAP[c.id] = c;
  });

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pickWeighted(pool) {
    var total = 0;
    for (var i = 0; i < pool.length; i++) {
      total += RARITIES[pool[i].rarity].weight;
    }
    var r = Math.random() * total;
    var acc = 0;
    for (var k = 0; k < pool.length; k++) {
      acc += RARITIES[pool[k].rarity].weight;
      if (r <= acc) return pool[k];
    }
    return pool[pool.length - 1];
  }

  function drawPackCards(isGodPack) {
    if (isGodPack) {
      var newCore = [
        CARD_MAP.jolynechick,
        CARD_MAP.sunflowerchick,
        CARD_MAP.redbearchick,
        CARD_MAP.carrotchick
      ];
      var classicRare = Math.random() < 0.5 ? CARD_MAP.kunchick : CARD_MAP.tigachick;
      var climax = Math.random() < 0.7 ? CARD_MAP.jolynechick : CARD_MAP.sunflowerchick;
      var others = shuffle(
        newCore.filter(function (c) { return c.id !== climax.id; }).concat([classicRare])
      );
      var centerIdx = 1 + Math.floor(Math.random() * 3);
      others.splice(centerIdx, 0, climax);
      return others;
    }

    var remaining = CARDS.slice();
    var chosen = [];

    function takeFrom(filterFn) {
      var candidates = remaining.filter(filterFn);
      if (!candidates.length) candidates = remaining;
      var pick = pickWeighted(candidates);
      chosen.push(pick);
      remaining = remaining.filter(function (c) {
        return c.id !== pick.id;
      });
    }

    // Guarantee 2 new cards + 2 classic cards + 1 weighted wildcard
    takeFrom(function (c) { return c.series === 'new'; });
    takeFrom(function (c) { return c.series === 'new'; });
    takeFrom(function (c) { return c.series === 'classic'; });
    takeFrom(function (c) { return c.series === 'classic'; });
    takeFrom(function () { return true; });

    chosen = shuffle(chosen);
    var bestIdx = 0;
    for (var i = 1; i < chosen.length; i++) {
      if (RARITIES[chosen[i].rarity].rank > RARITIES[chosen[bestIdx].rarity].rank) {
        bestIdx = i;
      }
    }
    if (bestIdx === 0 || bestIdx === 4) {
      var targetIdx = 1 + Math.floor(Math.random() * 3);
      var swap = chosen[targetIdx];
      chosen[targetIdx] = chosen[bestIdx];
      chosen[bestIdx] = swap;
    }
    return chosen;
  }

  global.AGY_RARITIES = RARITIES;
  global.AGY_CARDS = CARDS;
  global.AGY_CARD_MAP = CARD_MAP;
  global.drawPackCards = drawPackCards;
})(window);
