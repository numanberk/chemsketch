/* Laboratory glassware & equipment library (line-art in the style of lab-report flowcharts)
   plus ready-made setups ("presets") with default callout labels. Every drawing is defined in
   its own nominal coordinate box (w x h, in pt) and is uniformly scaled on the page. */
(function (CS) {
  'use strict';

  var LIQ = '#dcdcdc', LIQ2 = '#c4c4c4', DARK = '#5a5a5a';

  function st(o) {
    return ' stroke="' + (o.stroke || '#000') + '" stroke-width="' + CS.n(o.sw) + '" stroke-linejoin="round" stroke-linecap="round"';
  }
  function P(o, d, fill) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + st(o) + '/>'; }
  function F(d, fill) { return '<path d="' + d + '" fill="' + fill + '" stroke="none"/>'; }
  function R(o, x, y, w, h, fill, rx) {
    return '<rect x="' + CS.n(x) + '" y="' + CS.n(y) + '" width="' + CS.n(w) + '" height="' + CS.n(h) + '"' + (rx ? ' rx="' + rx + '"' : '') +
      ' fill="' + (fill || 'none') + '"' + st(o) + '/>';
  }
  function C(o, cx, cy, r, fill) {
    return '<circle cx="' + CS.n(cx) + '" cy="' + CS.n(cy) + '" r="' + CS.n(r) + '" fill="' + (fill || 'none') + '"' + st(o) + '/>';
  }
  function E(o, cx, cy, rx, ry, fill) {
    return '<ellipse cx="' + CS.n(cx) + '" cy="' + CS.n(cy) + '" rx="' + CS.n(rx) + '" ry="' + CS.n(ry) + '" fill="' + (fill || 'none') + '"' + st(o) + '/>';
  }
  function L(o, x1, y1, x2, y2, w) {
    return '<line x1="' + CS.n(x1) + '" y1="' + CS.n(y1) + '" x2="' + CS.n(x2) + '" y2="' + CS.n(y2) + '" stroke="' + (o.stroke || '#000') +
      '" stroke-width="' + CS.n(w || o.sw) + '" stroke-linecap="round"/>';
  }
  var clipN = 0;
  // liquid (filled rect clipped to the vessel interior) with a surface line
  function liquid(o, clipD, yTop, yBot, x0, x1, color, noLine) {
    if (yTop >= yBot) return '';
    var id = 'clip-' + (o.uid || 'x') + '-' + (clipN++);
    return '<clipPath id="' + id + '"><path d="' + clipD + '"/></clipPath><g clip-path="url(#' + id + ')">' +
      '<rect x="' + CS.n(x0) + '" y="' + CS.n(yTop) + '" width="' + CS.n(x1 - x0) + '" height="' + CS.n(yBot - yTop) + '" fill="' + (color || LIQ) + '" stroke="none"/>' +
      (noLine ? '' : L(o, x0, yTop, x1, yTop)) + '</g>';
  }
  function lvl(o, k, d) { return o[k] == null ? d : +o[k]; }
  function granules(o, x0, x1, y, rows) {
    var s = '', r = 1.3;
    for (var j = 0; j < (rows || 1); j++) {
      for (var x = x0 + r + (j % 2 ? r : 0); x <= x1 - r; x += 2.8) s += C(o, x, y - j * 2.2, r, '#fff');
    }
    return s;
  }
  function circleArcPath(cx, cy, r, x0, x1, top) {
    // helper for flasks: points on a circle at given x (top or bottom half)
    var dy0 = Math.sqrt(Math.max(0, r * r - (x0 - cx) * (x0 - cx)));
    var dy1 = Math.sqrt(Math.max(0, r * r - (x1 - cx) * (x1 - cx)));
    return { y0: top ? cy - dy0 : cy + dy0, y1: top ? cy - dy1 : cy + dy1 };
  }

  // ----- round-bottom flask (one neck) -----
  function rbfShape(cx, cy, r, nw, top) {
    var x0 = cx - nw / 2, x1 = cx + nw / 2, p = circleArcPath(cx, cy, r, x0, x1, true);
    return {
      outline: 'M' + (x0 - 1.5) + ',' + top + ' L' + x0 + ',' + (top + 2.5) + ' L' + x0 + ',' + CS.n(p.y0) +
        ' A' + r + ',' + r + ' 0 1,0 ' + x1 + ',' + CS.n(p.y1) + ' L' + x1 + ',' + (top + 2.5) + ' L' + (x1 + 1.5) + ',' + top,
      fill: 'M' + x0 + ',' + top + ' L' + x0 + ',' + CS.n(p.y0) + ' A' + r + ',' + r + ' 0 1,0 ' + x1 + ',' + CS.n(p.y1) + ' L' + x1 + ',' + top + ' Z'
    };
  }
  function bulbLiquid(o, cx, cy, r, level, color) {
    if (level <= 0) return '';
    level = Math.min(level, 0.98);
    var y = cy + r - 2 * r * level, dx = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    return F('M' + CS.n(cx - dx) + ',' + CS.n(y) + ' A' + r + ',' + r + ' 0 ' + (level > 0.5 ? 1 : 0) + ',0 ' + CS.n(cx + dx) + ',' + CS.n(y) + ' Z', color || LIQ) +
      L(o, cx - dx, y, cx + dx, y);
  }
  function stirBar(o, cx, y) {
    return '<rect x="' + CS.n(cx - 4.5) + '" y="' + CS.n(y) + '" width="9" height="2.6" rx="1.3" fill="' + DARK + '"' + st(o) + '/>';
  }

  var K = {};

  K.hotplate = {
    name: 'Stirrer hot plate', cat: 'Heating & stirring', w: 130, h: 18,
    anchors: { top: [65, 0], label: [130, 9] },
    draw: function (o) {
      return R(o, 5, 0, 120, 3.2, '#fff') + R(o, 0, 3.2, 130, 14.8, '#fff', 1.5);
    }
  };
  K.cork = {
    name: 'Cork ring', cat: 'Heating & stirring', w: 30, h: 6,
    anchors: { label: [30, 3] },
    draw: function (o) { return R(o, 0, 0, 30, 6, '#fff', 3); }
  };
  K.rbf = {
    name: 'Round-bottom flask', cat: 'Flasks', w: 40, h: 62, defaults: { level: 0.3, stir: false },
    params: ['level', 'stir', 'color'],
    anchors: { top: [20, 0], label: [36, 37], bottom: [20, 62] },
    draw: function (o) {
      var s = rbfShape(20, 44, 18, 9, 0);
      return F(s.fill, '#fff') + bulbLiquid(o, 20, 44, 18, lvl(o, 'level', 0.3), o.color) +
        (o.stir ? stirBar(o, 20, 56) : '') + P(o, s.outline);
    }
  };
  K.twoneck = {
    name: 'Two-neck flask', cat: 'Flasks', w: 50, h: 64, defaults: { level: 0.35, stir: false },
    params: ['level', 'stir', 'color'],
    anchors: { left: [15, 0], right: [35, 0], label: [44, 38] },
    draw: function (o) {
      var cx = 25, cy = 45, r = 19;
      var a = circleArcPath(cx, cy, r, 11, 19, true), b = circleArcPath(cx, cy, r, 31, 39, true);
      var outline = 'M9.5,0 L11,2.5 L11,' + CS.n(a.y0) + ' A' + r + ',' + r + ' 0 1,0 39,' + CS.n(b.y1) + ' L39,2.5 L40.5,0' +
        ' M29.5,0 L31,2.5 L31,' + CS.n(b.y0) + ' A' + r + ',' + r + ' 0 0,0 19,' + CS.n(a.y1) + ' L19,2.5 L20.5,0';
      var fill = 'M11,0 L11,' + CS.n(a.y0) + ' A' + r + ',' + r + ' 0 1,0 39,' + CS.n(b.y1) + ' L39,0 L31,0 L31,' + CS.n(b.y0) +
        ' A' + r + ',' + r + ' 0 0,0 19,' + CS.n(a.y1) + ' L19,0 Z';
      return F(fill, '#fff') + bulbLiquid(o, cx, cy, r, lvl(o, 'level', 0.35), o.color) + (o.stir ? stirBar(o, cx, 58) : '') + P(o, outline);
    }
  };
  K.threeneck = {
    name: 'Three-neck flask', cat: 'Flasks', w: 56, h: 66, defaults: { level: 0.35, stir: false },
    params: ['level', 'stir', 'color'],
    anchors: { left: [9, 6], center: [28, 0], right: [47, 6], label: [50, 40] },
    draw: function (o) {
      var cx = 28, cy = 46, r = 20, s = rbfShape(cx, cy, r, 9, 0);
      // side necks (angled)
      function neck(sign) {
        var base = { x: cx + sign * 13, y: cy - 15 }, dir = { x: sign * 0.42, y: -0.91 }, n = { x: 0.91, y: sign * 0.42 };
        var p1 = { x: base.x - n.x * 4, y: base.y - n.y * 4 }, p2 = { x: base.x + n.x * 4, y: base.y + n.y * 4 };
        var q1 = { x: p1.x + dir.x * 22, y: p1.y + dir.y * 22 }, q2 = { x: p2.x + dir.x * 22, y: p2.y + dir.y * 22 };
        return F('M' + CS.n(p1.x) + ',' + CS.n(p1.y) + ' L' + CS.n(q1.x) + ',' + CS.n(q1.y) + ' L' + CS.n(q2.x) + ',' + CS.n(q2.y) + ' L' + CS.n(p2.x) + ',' + CS.n(p2.y) + ' Z', '#fff') +
          L(o, p1.x, p1.y, q1.x, q1.y) + L(o, p2.x, p2.y, q2.x, q2.y);
      }
      return neck(-1) + neck(1) + F(s.fill, '#fff') + bulbLiquid(o, cx, cy, r, lvl(o, 'level', 0.35), o.color) + (o.stir ? stirBar(o, cx, 60) : '') + P(o, s.outline);
    }
  };
  K.erlenmeyer = {
    name: 'Erlenmeyer flask', cat: 'Flasks', w: 44, h: 56, defaults: { level: 0.2, solid: false },
    params: ['level', 'solid', 'color'],
    anchors: { top: [22, 0], label: [36, 40] },
    draw: function (o) {
      var d = 'M16,0 L17.5,2 L17.5,16 L3,50 Q1,55 6,55 L38,55 Q43,55 41,50 L26.5,16 L26.5,2 L28,0';
      var clip = 'M17.5,0 L17.5,16 L3,50 Q1,55 6,55 L38,55 Q43,55 41,50 L26.5,16 L26.5,0 Z';
      var lv = lvl(o, 'level', 0.2), y = 55 - lv * 50;
      return F(clip, '#fff') + (lv > 0 ? liquid(o, clip, y, 56, 0, 44, o.color) : '') +
        (o.solid ? granules(o, 9, 35, 52.5, 2) : '') + P(o, d);
    }
  };
  K.filterflask = {
    name: 'Filter (Büchner) flask', cat: 'Flasks', w: 58, h: 60, defaults: { level: 0.15 },
    params: ['level', 'color'],
    anchors: { top: [22, 0], arm: [58, 11], label: [38, 42] },
    draw: function (o) {
      var d = 'M16,0 L17.5,2 L17.5,18 L3,54 Q1,59 6,59 L38,59 Q43,59 41,54 L26.5,18 L26.5,13 L58,13 M58,9 L26.5,9 L26.5,2 L28,0';
      var clip = 'M17.5,0 L17.5,18 L3,54 Q1,59 6,59 L38,59 Q43,59 41,54 L26.5,18 L26.5,0 Z';
      var lv = lvl(o, 'level', 0.15), y = 59 - lv * 50;
      return F(clip, '#fff') + F('M26,9 L58,9 L58,13 L26,13 Z', '#fff') + (lv > 0 ? liquid(o, clip, y, 60, 0, 44, o.color) : '') + P(o, d);
    }
  };
  K.beaker = {
    name: 'Beaker', cat: 'Flasks', w: 46, h: 56, defaults: { level: 0.45 },
    params: ['level', 'color'],
    anchors: { top: [23, 0], label: [46, 28] },
    draw: function (o) {
      var d = 'M0,0 Q2.5,0.5 3,3 L3,53 Q3,56 6,56 L40,56 Q43,56 43,53 L43,3 Q43.5,0.5 46,0';
      var clip = 'M3,0 L3,53 Q3,56 6,56 L40,56 Q43,56 43,53 L43,0 Z';
      var lv = lvl(o, 'level', 0.45), y = 56 - lv * 52, marks = '';
      for (var i = 1; i <= 4; i++) marks += L(o, 6, 56 - i * 10, 11, 56 - i * 10, o.sw * 0.7);
      return F(clip, '#fff') + (lv > 0 ? liquid(o, clip, y, 57, 0, 46, o.color) : '') + marks + P(o, d);
    }
  };
  K.condenser = {
    name: 'Reflux condenser', cat: 'Condensers & adapters', w: 30, h: 80,
    anchors: { top: [18.5, 0], bottom: [18.5, 80], label: [27, 12] },
    draw: function (o) {
      var s = '';
      // side ports (water in/out)
      function port(y) {
        return F('M10,' + y + ' L2.5,' + (y - 6) + ' L2.5,' + (y - 2.5) + ' L10,' + (y + 3.5) + ' Z', '#fff') +
          L(o, 10, y, 2.5, y - 6) + L(o, 10, y + 3.5, 2.5, y - 2.5) + L(o, 2.5, y - 6, 2.5, y - 2.5);
      }
      var jacket = 'M15.5,8 L10,12 L10,68 L15.5,72 L21.5,72 L27,68 L27,12 L21.5,8 Z';
      s += F(jacket, '#fff') + port(16) + port(60);
      s += R(o, 15.5, 0, 6, 80, '#fff');
      s += P(o, 'M15.5,8 L10,12 L10,68 L15.5,72 M21.5,8 L27,12 L27,68 L21.5,72');
      return s;
    }
  };
  K.airCondenser = {
    name: 'Drying tube', cat: 'Condensers & adapters', w: 16, h: 52,
    anchors: { bottom: [8, 52], label: [16, 20] },
    draw: function (o) {
      var bulb = 'M5,0 L11,0 L11,6 Q16,9 16,16 L16,30 Q16,36 11,38 L11,52 L5,52 L5,38 Q0,36 0,30 L0,16 Q0,9 5,6 Z';
      return P(o, bulb, '#fff') + granules(o, 1.5, 14.5, 32, 6);
    }
  };
  K.dropfunnel = {
    name: 'Addition (dropping) funnel', cat: 'Funnels', w: 22, h: 50, defaults: { level: 0.6 },
    params: ['level', 'color'],
    anchors: { label: [20, 8], bottom: [11, 50] },
    draw: function (o) {
      var clip = 'M3,3 L19,3 L19,22 L12.5,30 L9.5,30 L3,22 Z';
      var lv = lvl(o, 'level', 0.6), y = 30 - lv * 27;
      return R(o, 7, 0, 8, 3, '#fff') + F(clip, '#fff') + (lv > 0 ? liquid(o, clip, y, 31, 0, 22, o.color) : '') +
        P(o, 'M3,3 L19,3 L19,22 L12.5,30 L9.5,30 L3,22 Z') + R(o, 9.5, 30, 3, 20, '#fff') + R(o, 4, 33, 14, 3.5, '#fff') + R(o, 9, 32, 4, 5.5, '#fff');
    }
  };
  K.sepfunnel = {
    name: 'Separatory funnel', cat: 'Funnels', w: 34, h: 84, defaults: { level: 0.35, level2: 0.7 },
    params: ['level', 'level2', 'color'],
    anchors: { upper: [31, 24], lower: [30, 38], stopcock: [17, 63], label: [31, 30] },
    draw: function (o) {
      var cx = 17, cy = 29, r = 14.5;
      var top = circleArcPath(cx, cy, r, 13.8, 20.2, true);
      var a1 = Math.PI * 5 / 6, a2 = Math.PI / 6;
      var pl = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) }, pr = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
      var body = 'M13.8,8 L13.8,' + CS.n(top.y0) + ' A' + r + ',' + r + ' 0 0,0 ' + CS.n(pl.x) + ',' + CS.n(pl.y) +
        ' L15.5,56 L18.5,56 L' + CS.n(pr.x) + ',' + CS.n(pr.y) + ' A' + r + ',' + r + ' 0 0,0 20.2,' + CS.n(top.y1) + ' L20.2,8';
      var clip = body + ' Z';
      var l1 = lvl(o, 'level', 0.35), l2 = lvl(o, 'level2', 0.7);
      var yb = 56, yt = cy - r + 1, y1 = yb - l1 * (yb - yt), y2 = yb - l2 * (yb - yt);
      var s = F(clip, '#fff');
      if (l2 > l1) s += liquid(o, clip, y2, y1, 0, 34, o.color2 || '#ececec');
      if (l1 > 0) s += liquid(o, clip, y1, 57, 0, 34, o.color || LIQ);
      s += P(o, body);
      s += R(o, 12.5, 2, 9, 6, '#fff', 2) + R(o, 15.5, 56, 3, 28, '#fff');
      s += R(o, 10, 60.5, 14, 4, '#fff') + R(o, 15, 59, 4, 7, '#fff');
      return s;
    }
  };
  K.funnel = {
    name: 'Glass funnel', cat: 'Funnels', w: 40, h: 50, defaults: { paper: true },
    params: ['paper'],
    anchors: { label: [36, 6], bottom: [20, 50] },
    draw: function (o) {
      var s = P(o, 'M0,0 L17.5,24 L17.5,50 L22.5,50 L22.5,24 L40,0', '#fff');
      if (o.paper !== false) s += P(o, 'M4,1.5 L20,22 L36,1.5', 'none');
      return s;
    }
  };
  K.buchner = {
    name: 'Büchner funnel', cat: 'Funnels', w: 44, h: 40,
    anchors: { label: [44, 6], bottom: [22, 40] },
    draw: function (o) {
      return P(o, 'M0,0 L0,13 Q0,15 3,16 L17,22 L19,22 L19,40 L25,40 L25,22 L27,22 L41,16 Q44,15 44,13 L44,0', '#fff') +
        '<line x1="2" y1="11" x2="42" y2="11" stroke="#000" stroke-width="' + CS.n(o.sw) + '" stroke-dasharray="1.5 1.5"/>' +
        R(o, 15, 21, 14, 5, '#fff', 1);
    }
  };
  K.waterbath = {
    name: 'Water bath', cat: 'Heating & stirring', w: 110, h: 40, defaults: { level: 0.75, ice: false },
    params: ['level', 'ice', 'color'],
    anchors: { label: [110, 14] },
    draw: function (o) {
      var lv = lvl(o, 'level', 0.75), y = 40 - lv * 40, s = F('M0,0 L0,40 L110,40 L110,0 Z', '#fff');
      if (lv > 0) s += F('M0,' + CS.n(y) + ' L0,40 L110,40 L110,' + CS.n(y) + ' Z', o.color || LIQ) + L(o, 0, y, 110, y);
      if (o.ice) {
        [[8, 0], [22, 1.5], [70, 0.5], [86, 2], [96, 0]].forEach(function (p) {
          s += R(o, p[0], y - 2 + p[1], 7, 6, '#fff', 1);
        });
      }
      return s + P(o, 'M0,0 L0,40 L110,40 L110,0');
    }
  };
  K.heatingmantle = {
    name: 'Heating mantle', cat: 'Heating & stirring', w: 60, h: 34,
    anchors: { label: [60, 20], top: [30, 4] },
    draw: function (o) {
      return P(o, 'M0,2 L0,26 Q0,34 8,34 L52,34 Q60,34 60,26 L60,2 Z', '#d0d0d0') +
        P(o, 'M7,2 A23,23 0 0,0 53,2 Z', '#fff');
    }
  };
  K.bunsen = {
    name: 'Bunsen burner', cat: 'Heating & stirring', w: 30, h: 70, defaults: { flame: true },
    params: ['flame'],
    anchors: { label: [22, 40], top: [15, 22] },
    draw: function (o) {
      var s = P(o, 'M2,70 L28,70 L24,63 L6,63 Z', '#fff') + R(o, 11.5, 22, 7, 41, '#fff') + R(o, 10.5, 50, 9, 5, '#fff');
      if (o.flame !== false) s += P(o, 'M15,2 Q22,12 18,22 L12,22 Q8,12 15,2 Z', '#eee') + P(o, 'M15,10 Q18,16 16.5,22 L13.5,22 Q12,16 15,10 Z', '#fff');
      return s;
    }
  };
  K.stirbar = {
    name: 'Stir bar', cat: 'Heating & stirring', w: 10, h: 3,
    anchors: { label: [10, 1.5] },
    draw: function (o) { return '<rect x="0" y="0" width="10" height="3" rx="1.5" fill="' + DARK + '"' + st(o) + '/>'; }
  };
  K.stand = {
    name: 'Ring stand with clamp', cat: 'Supports', w: 150, h: 150, defaults: { clamp: 0.4 },
    params: ['clamp'],
    anchors: { ring: [56, 60], label: [70, 60] },
    draw: function (o) {
      var y = 10 + lvl(o, 'clamp', 0.4) * 125;
      return R(o, 0, 146, 150, 4, '#fff', 0.5) + R(o, 7, 0, 3.5, 146, '#fff') +
        R(o, 13, y - 1.2, 32, 2.4, '#fff') + E(o, 56, y, 11, 2.6, 'none') + R(o, 4, y - 4, 9.5, 8, '#fff', 1);
    }
  };
  K.clamp = {
    name: 'Clamp', cat: 'Supports', w: 44, h: 10,
    anchors: { label: [44, 5] },
    draw: function (o) {
      return R(o, 0, 1, 9, 8, '#fff', 1) + R(o, 9, 3.8, 24, 2.4, '#fff') + P(o, 'M33,1 L42,1 L42,3.5 L36,3.5 L36,6.5 L42,6.5 L42,9 L33,9 Z', '#fff');
    }
  };
  K.testtube = {
    name: 'Test tube', cat: 'Tubes & small ware', w: 12, h: 52, defaults: { level: 0.4 },
    params: ['level', 'color'],
    anchors: { label: [12, 8], top: [6, 0] },
    draw: function (o) {
      var d = 'M0,0 L0,46 A6,6 0 0,0 12,46 L12,0';
      var lv = lvl(o, 'level', 0.4), y = 52 - lv * 50;
      return F(d + ' Z', '#fff') + (lv > 0 ? liquid(o, d + ' Z', y, 53, 0, 12, o.color) : '') + P(o, d) + L(o, -1, 0, 13, 0);
    }
  };
  K.vial = {
    name: 'Vial', cat: 'Tubes & small ware', w: 16, h: 38, defaults: { level: 0.4 },
    params: ['level', 'color'],
    anchors: { label: [16, 20] },
    draw: function (o) {
      var clip = 'M1,8 L15,8 L15,36 Q15,38 13,38 L3,38 Q1,38 1,36 Z', lv = lvl(o, 'level', 0.4), y = 38 - lv * 29;
      return F(clip, '#fff') + (lv > 0 ? liquid(o, clip, y, 39, 0, 16, o.color) : '') + P(o, clip) + R(o, 2, 0, 12, 8, '#777', 1);
    }
  };
  K.gradcyl = {
    name: 'Graduated cylinder', cat: 'Tubes & small ware', w: 22, h: 84, defaults: { level: 0.5 },
    params: ['level', 'color'],
    anchors: { label: [19, 30], top: [11, 0] },
    draw: function (o) {
      var clip = 'M4,1 L18,1 L18,78 L4,78 Z', lv = lvl(o, 'level', 0.5), y = 78 - lv * 74, marks = '';
      for (var i = 1; i < 12; i++) marks += L(o, 13, 78 - i * 6.2, i % 5 ? 16 : 18, 78 - i * 6.2, o.sw * 0.7);
      return F(clip, '#fff') + (lv > 0 ? liquid(o, clip, y, 79, 0, 22, o.color) : '') + marks +
        P(o, 'M2.5,0 L4,1.5 L4,78 M18,78 L18,1.5 L19.5,0') + R(o, 0, 78, 22, 5, '#fff', 1);
    }
  };
  K.thermometer = {
    name: 'Thermometer', cat: 'Tubes & small ware', w: 8, h: 80,
    anchors: { label: [7, 20], bottom: [4, 80] },
    draw: function (o) {
      return R(o, 2, 0, 4, 74, '#fff', 2) + C(o, 4, 76, 3.6, '#fff') + '<line x1="4" y1="76" x2="4" y2="40" stroke="#777" stroke-width="1.2"/>' +
        '<circle cx="4" cy="76" r="2.2" fill="#777"/>';
    }
  };
  K.pipette = {
    name: 'Pasteur pipette', cat: 'Tubes & small ware', w: 10, h: 70,
    anchors: { label: [8, 30], tip: [5, 70] },
    draw: function (o) {
      return E(o, 5, 7, 5, 7, '#777') + P(o, 'M2.5,13 L7.5,13 L7.5,40 L5.6,46 L5.6,70 L4.4,70 L4.4,46 L2.5,40 Z', '#fff');
    }
  };
  K.syringe = {
    name: 'Syringe', cat: 'Tubes & small ware', w: 16, h: 84,
    anchors: { label: [14, 30], tip: [8, 84] },
    draw: function (o) {
      var marks = '';
      for (var i = 0; i < 6; i++) marks += L(o, 3, 22 + i * 7, 6, 22 + i * 7, o.sw * 0.7);
      return R(o, 0, 0, 16, 2.5, '#fff') + R(o, 6.5, 2.5, 3, 14, '#fff') + R(o, 2, 14, 12, 50, '#fff') + R(o, 3, 15.5, 10, 3, '#999') + marks +
        P(o, 'M5,64 L11,64 L9.5,68 L6.5,68 Z', '#fff') + L(o, 8, 68, 8, 84);
    }
  };
  K.watchglass = {
    name: 'Watch glass', cat: 'Tubes & small ware', w: 50, h: 9, defaults: { solid: true },
    params: ['solid'],
    anchors: { label: [50, 2] },
    draw: function (o) {
      return (o.solid !== false ? granules(o, 14, 36, 4.5, 2) : '') + P(o, 'M0,1 Q25,14 50,1 Q25,10 0,1 Z', '#fff');
    }
  };
  K.petri = {
    name: 'Petri dish', cat: 'Tubes & small ware', w: 60, h: 12,
    anchors: { label: [60, 6] },
    draw: function (o) {
      return R(o, 2, 3, 56, 9, '#fff', 1) + R(o, 0, 0, 60, 6, 'none', 1);
    }
  };
  K.crystals = {
    name: 'Solid / crystals', cat: 'Tubes & small ware', w: 30, h: 8,
    anchors: { label: [30, 4] },
    draw: function (o) { return granules(o, 0, 30, 6.5, 3); }
  };
  K.tlc = {
    name: 'TLC plate', cat: 'Analysis', w: 24, h: 50,
    anchors: { label: [24, 20] },
    draw: function (o) {
      return R(o, 0, 0, 24, 50, '#fff') + L(o, 0, 42, 24, 42, o.sw * 0.6) +
        '<line x1="0" y1="7" x2="24" y2="7" stroke="#000" stroke-width="' + CS.n(o.sw * 0.6) + '" stroke-dasharray="2 1.5"/>' +
        E(o, 7, 30, 2.6, 2, '#777') + E(o, 17, 17, 2.6, 2, '#777') + E(o, 17, 36, 2.2, 1.7, '#bbb');
    }
  };
  K.mortar = {
    name: 'Mortar and pestle', cat: 'Tubes & small ware', w: 50, h: 40,
    anchors: { label: [48, 24] },
    draw: function (o) {
      return P(o, 'M30,0 Q34,0 33,4 L22,24 L18,22 L27,2 Q28,0 30,0 Z', '#fff') +
        P(o, 'M0,16 L50,16 Q50,36 34,38 L34,40 L16,40 L16,38 Q0,36 0,16 Z', '#fff');
    }
  };
  K.stillhead = {
    name: 'Distillation head', cat: 'Condensers & adapters', w: 40, h: 40,
    anchors: { top: [8, 0], bottom: [8, 40], arm: [40, 30], label: [12, 14] },
    draw: function (o) {
      var d = 'M4,0 L4,40 L12,40 L12,18 L38,33 L40,29.5 L12,13 L12,0';
      return F(d + ' Z', '#fff') + P(o, d);
    }
  };
  K.rotavap = {
    name: 'Rotary evaporator', cat: 'Setups', w: 150, h: 112, defaults: { level: 0.3, level2: 0.15 },
    params: ['level', 'level2', 'color'],
    anchors: { condenser: [116, 18], flask: [34, 70], bath: [0, 96], receiver: [121, 96], label: [116, 18] },
    draw: function (o) {
      var s = '';
      // bath
      s += R(o, 2, 82, 68, 24, o.color || LIQ, 4);
      // evaporating flask (neck tilted to the upper right)
      var cx = 34, cy = 70, r = 17;
      var dir = CS.V.norm({ x: 1, y: -1 }), n = CS.V.perp(dir);
      var b0 = { x: cx + dir.x * (r - 3), y: cy + dir.y * (r - 3) };
      var p1 = CS.V.add(b0, CS.V.mul(n, 3.6)), p2 = CS.V.sub(b0, CS.V.mul(n, 3.6));
      var q1 = CS.V.add(p1, CS.V.mul(dir, 18)), q2 = CS.V.add(p2, CS.V.mul(dir, 18));
      // vapour duct
      var duct = 'M' + CS.n(q2.x) + ',' + CS.n(q2.y) + ' L' + CS.n(q2.x + 4) + ',' + CS.n(q2.y - 4) + ' L66,24 L98,24 M98,30 L71,30 L' + CS.n(q1.x + 4) + ',' + CS.n(q1.y - 4) + ' L' + CS.n(q1.x) + ',' + CS.n(q1.y);
      s += F('M' + CS.n(q2.x) + ',' + CS.n(q2.y) + ' L' + CS.n(q2.x + 4) + ',' + CS.n(q2.y - 4) + ' L66,24 L98,24 L98,30 L71,30 L' + CS.n(q1.x + 4) + ',' + CS.n(q1.y - 4) + ' L' + CS.n(q1.x) + ',' + CS.n(q1.y) + ' Z', '#fff');
      s += P(o, duct);
      s += F('M' + CS.n(p1.x) + ',' + CS.n(p1.y) + ' L' + CS.n(q1.x) + ',' + CS.n(q1.y) + ' L' + CS.n(q2.x) + ',' + CS.n(q2.y) + ' L' + CS.n(p2.x) + ',' + CS.n(p2.y) + ' Z', '#fff');
      s += L(o, p1.x, p1.y, q1.x, q1.y) + L(o, p2.x, p2.y, q2.x, q2.y);
      s += C(o, cx, cy, r, '#fff') + bulbLiquid(o, cx, cy, r, lvl(o, 'level', 0.3), '#e8e8e8') + C(o, cx, cy, r, 'none');
      // condenser with coil
      s += R(o, 98, 8, 18, 64, '#fff', 2) + R(o, 102, 2, 10, 6, '#fff', 1) + R(o, 103.5, 72, 7, 8, '#fff');
      var coil = 'M107,10';
      for (var i = 0; i < 9; i++) coil += ' L' + (i % 2 ? 112 : 102) + ',' + (14 + i * 6.5);
      coil += ' L107,70';
      s += P(o, coil);
      // receiving flask
      s += C(o, 107, 95, 15, '#fff') + bulbLiquid(o, 107, 95, 15, lvl(o, 'level2', 0.15), o.color) + C(o, 107, 95, 15, 'none');
      s += R(o, 103.5, 77, 7, 4, '#fff');
      return s;
    }
  };
  K.distillation = {
    name: 'Simple distillation', cat: 'Setups', w: 196, h: 140, defaults: { level: 0.35, level2: 0.2 },
    params: ['level', 'level2', 'color'],
    anchors: { flask: [40, 96], thermometer: [46, 10], condenser: [120, 64], receiver: [184, 120], mantle: [70, 122], label: [120, 64] },
    draw: function (o) {
      var s = '';
      // heating mantle + flask
      s += P(o, 'M10,102 L10,126 Q10,134 18,134 L62,134 Q70,134 70,126 L70,102 Z', '#d0d0d0');
      var fl = rbfShape(40, 98, 20, 9, 52);
      s += F(fl.fill, '#fff') + bulbLiquid(o, 40, 98, 20, lvl(o, 'level', 0.35), o.color) + P(o, fl.outline);
      // still head
      s += F('M35.5,20 L35.5,54 L44.5,54 L44.5,40 L70,55 L72,51.5 L44.5,35.5 L44.5,20 Z', '#fff');
      s += P(o, 'M35.5,20 L35.5,54 M44.5,54 L44.5,40 L70,55 M72,51.5 L44.5,35.5 L44.5,20');
      // thermometer
      s += R(o, 38, 0, 4, 40, '#fff', 2) + '<circle cx="40" cy="41" r="2.4" fill="#777" stroke="#000" stroke-width="' + CS.n(o.sw) + '"/>';
      s += R(o, 35, 18, 10, 4, '#fff');
      // angled condenser
      var a = Math.atan2(30, 52), cos = Math.cos(a), sin = Math.sin(a);
      function T(x, y) { return CS.n(70 + x * cos - y * sin) + ',' + CS.n(53 + x * sin + y * cos); }
      s += F('M' + T(0, -2.5) + ' L' + T(110, -2.5) + ' L' + T(110, 2.5) + ' L' + T(0, 2.5) + ' Z', '#fff');
      s += F('M' + T(10, -2.5) + ' L' + T(16, -8) + ' L' + T(92, -8) + ' L' + T(98, -2.5) + ' L' + T(98, 2.5) + ' L' + T(92, 8) + ' L' + T(16, 8) + ' L' + T(10, 2.5) + ' Z', '#fff');
      s += P(o, 'M' + T(0, -2.5) + ' L' + T(110, -2.5) + ' M' + T(0, 2.5) + ' L' + T(110, 2.5));
      s += P(o, 'M' + T(10, -2.5) + ' L' + T(16, -8) + ' L' + T(92, -8) + ' L' + T(98, -2.5) + ' M' + T(10, 2.5) + ' L' + T(16, 8) + ' L' + T(92, 8) + ' L' + T(98, 2.5));
      s += P(o, 'M' + T(22, -8) + ' L' + T(22, -14) + ' M' + T(26, -8) + ' L' + T(26, -14) + ' M' + T(82, 8) + ' L' + T(82, 14) + ' M' + T(86, 8) + ' L' + T(86, 14));
      // receiver
      s += P(o, 'M164,104 L164,111 L151,135 Q149,139 154,139 L190,139 Q195,139 193,135 L180,111 L180,104', '#fff');
      s += liquid(o, 'M164,111 L151,135 Q149,139 154,139 L190,139 Q195,139 193,135 L180,111 Z', 139 - lvl(o, 'level2', 0.2) * 28, 140, 140, 196, o.color);
      return s;
    }
  };

  // ---------------- presets (composite setups) ----------------
  // item: {k: kind, x, y, s: scale, rot, opts}; callouts: {text, ax, ay, tx, ty} in preset coordinates
  var PRESETS = [
    {
      id: 'flask', name: 'Flask on stirrer hot plate', w: 130, h: 84,
      items: [{ k: 'hotplate', x: 0, y: 66 }, { k: 'cork', x: 50, y: 61 }, { k: 'rbf', x: 45, y: 0, opts: { level: 0.3 } }],
      callouts: [{ text: 'round-bottom flask', ax: 62, ay: 38, tx: 140, ty: 30 }]
    },
    {
      id: 'reflux', name: 'Reflux in water bath', w: 130, h: 144,
      items: [{ k: 'hotplate', x: 0, y: 126 }, { k: 'waterbath', x: 10, y: 86, opts: { level: 0.7 } },
        { k: 'rbf', x: 45, y: 65, opts: { level: 0.3 } }, { k: 'condenser', x: 46.5, y: 0 }],
      callouts: [{ text: 'condenser', ax: 70, ay: 8, tx: 160, ty: 8 }, { text: 'water bath', ax: 120, ay: 100, tx: 160, ty: 100 }]
    },
    {
      id: 'addition', name: 'Addition funnel + reflux', w: 130, h: 147,
      items: [{ k: 'hotplate', x: 0, y: 129 }, { k: 'waterbath', x: 10, y: 89, opts: { level: 0.7 } },
        { k: 'twoneck', x: 40, y: 65, opts: { level: 0.35 } }, { k: 'condenser', x: 36.5, y: 0 }, { k: 'dropfunnel', x: 64, y: 27, opts: { level: 0.6 } }],
      callouts: [{ text: 'addition funnel', ax: 84, ay: 33, tx: 160, ty: 22 }]
    },
    {
      id: 'pour', name: 'Adding liquid from a tube', w: 130, h: 96,
      items: [{ k: 'hotplate', x: 0, y: 78 }, { k: 'waterbath', x: 10, y: 38, opts: { level: 0.7 } },
        { k: 'rbf', x: 45, y: 17, opts: { level: 0.35, stir: true } }, { k: 'testtube', x: 82, y: -18, rot: 60, opts: { level: 0.35 } }],
      callouts: [{ text: 'solvent', ax: 104, ay: -6, tx: 160, ty: -10 }]
    },
    {
      id: 'extraction', name: 'Separatory funnel extraction', w: 150, h: 150,
      items: [{ k: 'stand', x: 0, y: 0, opts: { clamp: 0.4 } }, { k: 'sepfunnel', x: 34.75, y: -2, s: 1.25, opts: { level: 0.3, level2: 0.72 } },
        { k: 'erlenmeyer', x: 34, y: 91, opts: { level: 0.15 } }],
      callouts: [{ text: 'aqueous phase', ax: 66, ay: 40, tx: 160, ty: 30 }, { text: 'organic phase', ax: 61, ay: 56, tx: 160, ty: 45 }]
    },
    {
      id: 'washdry', name: 'Wash in funnel & dry over solid', w: 150, h: 150,
      items: [{ k: 'stand', x: 0, y: 0, opts: { clamp: 0.4 } }, { k: 'sepfunnel', x: 34.75, y: -2, s: 1.25, opts: { level: 0.3, level2: 0.72 } },
        { k: 'erlenmeyer', x: 96, y: 91, opts: { level: 0.12, solid: true } }],
      callouts: [{ text: 'wash solution', ax: 66, ay: 40, tx: 160, ty: 32 }, { text: 'drying agent', ax: 134, ay: 142, tx: 160, ty: 136 }]
    },
    {
      id: 'rotavap', name: 'Rotary evaporation', w: 150, h: 112,
      items: [{ k: 'rotavap', x: 0, y: 0 }],
      callouts: [{ text: 'rotary evaporator', ax: 116, ay: 18, tx: 160, ty: 18 }]
    },
    {
      id: 'distill', name: 'Simple distillation', w: 196, h: 140,
      items: [{ k: 'distillation', x: 0, y: 0 }],
      callouts: [{ text: 'thermometer', ax: 42, ay: 8, tx: 90, ty: 4 }, { text: 'condenser', ax: 128, ay: 70, tx: 150, ty: 50 }]
    },
    {
      id: 'vacfilter', name: 'Vacuum filtration', w: 70, h: 102,
      items: [{ k: 'filterflask', x: 0, y: 42, opts: { level: 0.15 } }, { k: 'buchner', x: 0, y: 6 }],
      callouts: [{ text: 'Büchner funnel', ax: 44, ay: 10, tx: 90, ty: 4 }, { text: 'to vacuum', ax: 58, ay: 53, tx: 90, ty: 53 }]
    },
    {
      id: 'gravity', name: 'Gravity filtration', w: 60, h: 100,
      items: [{ k: 'funnel', x: 2, y: 0 }, { k: 'erlenmeyer', x: 0, y: 44, opts: { level: 0.15 } }],
      callouts: [{ text: 'filter paper', ax: 38, ay: 4, tx: 80, ty: 0 }]
    },
    {
      id: 'recryst', name: 'Recrystallisation (hot plate)', w: 130, h: 76,
      items: [{ k: 'hotplate', x: 0, y: 58 }, { k: 'erlenmeyer', x: 43, y: 2, opts: { level: 0.4, solid: true } }],
      callouts: [{ text: 'hot solvent', ax: 74, ay: 40, tx: 140, ty: 30 }]
    },
    {
      id: 'icebath', name: 'Stirring in ice bath', w: 130, h: 96,
      items: [{ k: 'hotplate', x: 0, y: 78 }, { k: 'waterbath', x: 10, y: 38, opts: { level: 0.75, ice: true } },
        { k: 'rbf', x: 45, y: 17, opts: { level: 0.35, stir: true } }],
      callouts: [{ text: 'ice bath, 0 °C', ax: 120, ay: 52, tx: 150, ty: 52 }]
    },
    {
      id: 'mantle', name: 'Reflux with heating mantle', w: 60, h: 128,
      items: [{ k: 'heatingmantle', x: 0, y: 94 }, { k: 'rbf', x: 10, y: 51, opts: { level: 0.3 } }, { k: 'condenser', x: 11.5, y: 0 }],
      callouts: [{ text: 'condenser', ax: 38, ay: 10, tx: 80, ty: 10 }, { text: 'heating mantle', ax: 60, ay: 112, tx: 80, ty: 112 }]
    },
    {
      id: 'tlc', name: 'TLC chamber', w: 46, h: 56,
      items: [{ k: 'beaker', x: 0, y: 0, opts: { level: 0.08 } }, { k: 'tlc', x: 14, y: 4 }],
      callouts: [{ text: 'TLC plate', ax: 38, ay: 20, tx: 64, ty: 14 }]
    }
  ];

  function kind(k) { return K[k]; }

  // render an apparatus object: {kind, x, y, w, h, rot, flip, opts}
  function render(obj, o) {
    var def = K[obj.kind];
    if (!def) return '';
    var sx = obj.w / def.w, sy = obj.h / def.h, s = Math.sqrt(Math.abs(sx * sy)) || 1;
    var opts = Object.assign({}, def.defaults || {}, obj.opts || {});
    opts.sw = (obj.lineWidth || (o && o.lineWidth) || 0.75) / s;
    opts.uid = obj.id;
    opts.stroke = obj.stroke || '#000';
    var cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
    var tf = '';
    if (obj.rot) tf += 'rotate(' + CS.n(obj.rot) + ' ' + CS.n(cx) + ' ' + CS.n(cy) + ') ';
    tf += 'translate(' + CS.n(obj.x) + ' ' + CS.n(obj.y) + ') ';
    if (obj.flip) tf += 'translate(' + CS.n(obj.w) + ' 0) scale(' + CS.n(-sx) + ' ' + CS.n(sy) + ')';
    else tf += 'scale(' + CS.n4(sx) + ' ' + CS.n4(sy) + ')';
    return '<g transform="' + tf + '">' + def.draw(opts) + '</g>';
  }
  CS.n4 = function (v) { return Math.round(v * 10000) / 10000; };

  // anchor point of an apparatus object in page coordinates
  function anchor(obj, name) {
    var def = K[obj.kind];
    var a = (def.anchors && (def.anchors[name] || def.anchors.label)) || [def.w, def.h / 2];
    var x = a[0] * obj.w / def.w, y = a[1] * obj.h / def.h;
    if (obj.flip) x = obj.w - x;
    var p = { x: obj.x + x, y: obj.y + y };
    if (obj.rot) p = CS.V.rot(p, obj.rot * Math.PI / 180, { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 });
    return p;
  }

  // build page objects for a preset placed with its top-left at (x, y) and the given scale
  function instantiate(preset, x, y, scale, texts) {
    scale = scale || 1;
    var gid = CS.uid(), objs = [];
    preset.items.forEach(function (it) {
      var def = K[it.k], s = (it.s || 1) * scale;
      objs.push({
        id: CS.uid(), type: 'apparatus', kind: it.k, x: x + it.x * scale, y: y + it.y * scale, w: def.w * s, h: def.h * s,
        rot: it.rot || 0, opts: CS.clone(it.opts || {}), groupId: gid
      });
    });
    (preset.callouts || []).forEach(function (c, i) {
      var text = texts && texts[i] != null ? texts[i] : c.text;
      if (!text) return;
      objs.push({
        id: CS.uid(), type: 'callout', ax: x + c.ax * scale, ay: y + c.ay * scale, tx: x + c.tx * scale, ty: y + c.ty * scale,
        text: text, size: 7, font: 'ChemSans', groupId: gid
      });
    });
    return objs;
  }

  function thumb(k, size) {
    var def = K[k], s = Math.min((size - 6) / def.w, (size - 6) / def.h);
    var w = def.w * s, h = def.h * s;
    var obj = { id: 'th' + k, kind: k, x: (size - w) / 2, y: (size - h) / 2, w: w, h: h };
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + render(obj, { lineWidth: 0.9 }) + '</svg>';
  }
  function presetThumb(p, size) {
    var objs = instantiate(p, 0, 0, 1);
    var bb = presetBBox(p);
    var s = Math.min((size - 6) / bb.w, (size - 6) / bb.h);
    var inner = objs.filter(function (o) { return o.type === 'apparatus'; }).map(function (o) { return render(o, { lineWidth: 0.9 / s * 1 }); }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><g transform="translate(' +
      CS.n((size - bb.w * s) / 2 - bb.x * s) + ' ' + CS.n((size - bb.h * s) / 2 - bb.y * s) + ') scale(' + CS.n4(s) + ')">' + inner + '</g></svg>';
  }
  function presetBBox(p) {
    var objs = instantiate(p, 0, 0, 1).filter(function (o) { return o.type === 'apparatus'; });
    return CS.bboxUnion(objs.map(function (o) { return CS.rotatedBBox(o, o.rot); }));
  }

  CS.Apparatus = {
    kinds: K,
    kind: kind,
    presets: PRESETS,
    preset: function (id) { return PRESETS.filter(function (p) { return p.id === id; })[0]; },
    render: render,
    anchor: anchor,
    instantiate: instantiate,
    thumb: thumb,
    presetThumb: presetThumb,
    presetBBox: presetBBox,
    PARAM_LABELS: { level: 'Liquid level', level2: 'Upper level / 2nd vessel', stir: 'Stir bar', solid: 'Solid (granules)', ice: 'Ice cubes', color: 'Liquid colour', clamp: 'Clamp height', paper: 'Filter paper', flame: 'Flame' }
  };
})(window.CS);
