/* ChemSketch core: namespace, geometry and small helpers. */
window.CS = window.CS || {};
(function (CS) {
  'use strict';

  CS.uid = function () {
    return Math.random().toString(36).slice(2, 10);
  };

  CS.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  CS.clone = function (o) {
    return JSON.parse(JSON.stringify(o));
  };

  CS.n = function (v) {
    return Math.round(v * 100) / 100;
  };

  CS.clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v));
  };

  // ---------- 2D vector helpers ----------
  var V = (CS.V = {
    add: function (a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
    sub: function (a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
    mul: function (a, k) { return { x: a.x * k, y: a.y * k }; },
    len: function (a) { return Math.hypot(a.x, a.y); },
    dist: function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    norm: function (a) {
      var l = Math.hypot(a.x, a.y) || 1;
      return { x: a.x / l, y: a.y / l };
    },
    perp: function (a) { return { x: -a.y, y: a.x }; },
    dot: function (a, b) { return a.x * b.x + a.y * b.y; },
    cross: function (a, b) { return a.x * b.y - a.y * b.x; },
    lerp: function (a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; },
    mid: function (a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; },
    angle: function (a) { return Math.atan2(a.y, a.x); },
    fromAngle: function (ang, l) { return { x: Math.cos(ang) * (l || 1), y: Math.sin(ang) * (l || 1) }; },
    rot: function (p, ang, c) {
      c = c || { x: 0, y: 0 };
      var s = Math.sin(ang), co = Math.cos(ang), dx = p.x - c.x, dy = p.y - c.y;
      return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
    },
    distToSeg: function (p, a, b) {
      var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
      var t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    }
  });

  // quadratic bezier helpers
  CS.qPoint = function (p0, c, p1, t) {
    var u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y };
  };
  CS.qSplit = function (p0, c, p1, t) {
    // returns the [0,t] part as {p0, c, p1}
    var a = V.lerp(p0, c, t), b = V.lerp(c, p1, t), m = V.lerp(a, b, t);
    return { p0: p0, c: a, p1: m, rest: { p0: m, c: b, p1: p1 } };
  };

  // ---------- bounding boxes {x,y,w,h} ----------
  CS.bboxOfPoints = function (pts, pad) {
    pad = pad || 0;
    if (!pts.length) return null;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) {
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x > x1) x1 = p.x;
      if (p.y > y1) y1 = p.y;
    });
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  };
  CS.bboxUnion = function (list) {
    var pts = [];
    list.forEach(function (b) {
      if (!b) return;
      pts.push({ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y + b.h });
    });
    return CS.bboxOfPoints(pts);
  };
  CS.bboxContains = function (outer, inner) {
    return inner.x >= outer.x && inner.y >= outer.y &&
      inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
  };
  CS.bboxHit = function (b, p, pad) {
    pad = pad || 0;
    return p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad;
  };
  CS.bboxIntersects = function (a, b) {
    return a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
  };
  CS.bboxCorners = function (b) {
    return [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
  };
  // bbox of a rect rotated (deg) around its center
  CS.rotatedBBox = function (b, deg) {
    if (!deg) return b;
    var c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, a = deg * Math.PI / 180;
    return CS.bboxOfPoints(CS.bboxCorners(b).map(function (p) { return V.rot(p, a, c); }));
  };

  // Segment vs axis-aligned rectangle: returns the largest t in [0,1] at which the
  // segment from a to b is still inside the rect (used to clip bonds at labels).
  CS.exitParam = function (a, b, r) {
    var dx = b.x - a.x, dy = b.y - a.y, t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy], q = [a.x - r.x, r.x + r.w - a.x, a.y - r.y, r.y + r.h - a.y];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return -1;
      } else {
        var t = q[i] / p[i];
        if (p[i] < 0) { if (t > t1) return -1; if (t > t0) t0 = t; }
        else { if (t < t0) return -1; if (t < t1) t1 = t; }
      }
    }
    return t0 <= 1e-9 ? t1 : -1; // only interested when a is inside (or on) the rect
  };
  CS.segRectHit = function (a, b, r) {
    var dx = b.x - a.x, dy = b.y - a.y, t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy], q = [a.x - r.x, r.x + r.w - a.x, a.y - r.y, r.y + r.h - a.y];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; }
      else {
        var t = q[i] / p[i];
        if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
        else { if (t < t0) return null; if (t < t1) t1 = t; }
      }
    }
    return [t0, t1];
  };

  CS.debounce = function (fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  };

  CS.download = function (blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  CS.safeName = function (s) {
    return (String(s || 'drawing').trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80)) || 'drawing';
  };

  CS.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };
})(window.CS);
