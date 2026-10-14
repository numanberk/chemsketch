/* Chemistry knowledge: elements, valences, implicit hydrogens, label layout tokens,
   abbreviations, formula / mass analysis and the bridge to OpenChemLib (SMILES, molfiles,
   2D coordinates, properties, stereo descriptors). */
(function (CS) {
  'use strict';

  var SYMBOLS = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr ' +
    'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu ' +
    'Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg ' +
    'Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' ');
  var WEIGHTS = [1.008, 4.0026, 6.94, 9.0122, 10.81, 12.011, 14.007, 15.999, 18.998, 20.180, 22.990, 24.305, 26.982,
    28.085, 30.974, 32.06, 35.45, 39.948, 39.098, 40.078, 44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933,
    58.693, 63.546, 65.38, 69.723, 72.630, 74.922, 78.971, 79.904, 83.798, 85.468, 87.62, 88.906, 91.224, 92.906,
    95.95, 98, 101.07, 102.91, 106.42, 107.87, 112.41, 114.82, 118.71, 121.76, 127.60, 126.90, 131.29, 132.91,
    137.33, 138.91, 140.12, 140.91, 144.24, 145, 150.36, 151.96, 157.25, 158.93, 162.50, 164.93, 167.26, 168.93,
    173.05, 174.97, 178.49, 180.95, 183.84, 186.21, 190.23, 192.22, 195.08, 196.97, 200.59, 204.38, 207.2, 208.98,
    209, 210, 222, 223, 226, 227, 232.04, 231.04, 238.03, 237, 244, 243, 247, 247, 251, 252, 257, 258, 259, 266,
    267, 268, 269, 270, 277, 278, 281, 282, 285, 286, 289, 290, 293, 294, 294];
  var MONO = {
    H: 1.0078250, D: 2.0141018, He: 4.0026032, Li: 7.0160034, Be: 9.0121822, B: 11.0093054, C: 12, N: 14.0030740,
    O: 15.9949146, F: 18.9984032, Ne: 19.9924402, Na: 22.9897693, Mg: 23.9850417, Al: 26.9815384, Si: 27.9769265,
    P: 30.9737615, S: 31.9720707, Cl: 34.9688527, Ar: 39.9623831, K: 38.9637069, Ca: 39.9625909, Sc: 44.9559102,
    Ti: 47.9479471, V: 50.9439637, Cr: 51.9405119, Mn: 54.9380496, Fe: 55.9349421, Co: 58.9332002, Ni: 57.9353479,
    Cu: 62.9296011, Zn: 63.9291466, Ga: 68.925581, Ge: 73.9211782, As: 74.9215964, Se: 79.9165218, Br: 78.9183376,
    Kr: 83.911507, Rb: 84.9117893, Sr: 87.9056143, Y: 88.9058479, Zr: 89.9047037, Nb: 92.9063775, Mo: 97.9054078,
    Ru: 101.9043495, Rh: 102.905504, Pd: 105.903483, Ag: 106.905093, Cd: 113.9033581, In: 114.903878,
    Sn: 119.9021966, Sb: 120.903818, Te: 129.9062228, I: 126.904468, Xe: 131.9041545, Cs: 132.905447,
    Ba: 137.905241, La: 138.906348, Ce: 139.905434, W: 183.950928, Os: 191.961479, Ir: 192.962924,
    Pt: 194.964774, Au: 196.966552, Hg: 201.970617, Tl: 204.974412, Pb: 207.976636, Bi: 208.980383
  };
  var Z = {};
  SYMBOLS.forEach(function (s, i) { Z[s] = i + 1; });
  Z.D = 1;

  // positions in an 18 column periodic table: [row, col] (rows 8/9 = lanthanides/actinides)
  function ptPos(z) {
    if (z === 1) return [0, 0];
    if (z === 2) return [0, 17];
    if (z <= 10) return [1, z <= 4 ? z - 3 : z + 7];
    if (z <= 18) return [2, z <= 12 ? z - 11 : z - 1];
    if (z <= 36) return [3, z - 19];
    if (z <= 54) return [4, z - 37];
    if (z >= 57 && z <= 71) return [8, z - 57 + 2];
    if (z >= 89 && z <= 103) return [9, z - 89 + 2];
    if (z <= 86) return [5, z <= 56 ? z - 55 : z - 69];
    return [6, z <= 88 ? z - 87 : z - 101];
  }

  var COLORS = { N: '#2747d6', O: '#d42020', S: '#b8a000', P: '#d97800', F: '#2a9d2a', Cl: '#2a9d2a', Br: '#963b18', I: '#7a2a9a' };

  var VALENCE = {
    H: [1], B: [3], C: [4], N: [3, 5], O: [2], F: [1], Si: [4], P: [3, 5], S: [2, 4, 6], Cl: [1, 3, 5, 7],
    Br: [1, 3, 5], I: [1, 3, 5, 7], Se: [2, 4, 6], Te: [2, 4, 6], As: [3, 5], Ge: [4], Sn: [4], Al: [3],
    Li: [1], Na: [1], K: [1], Mg: [2], Ca: [2], Zn: [2]
  };
  var GROUP = { B: 13, Al: 13, C: 14, Si: 14, Ge: 14, Sn: 14, N: 15, P: 15, As: 15, O: 16, S: 16, Se: 16, Te: 16, F: 17, Cl: 17, Br: 17, I: 17, H: 1, Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Zn: 2 };

  // lonePairs only matter for neutral carbon/silicon: a lone pair there makes a (singlet) carbene,
  // :CR2, with two fewer bonds. Lone pairs drawn on N, O, halogens or carbanions are just shown.
  function valences(el, charge, radical, lonePairs) {
    var v = VALENCE[el];
    if (!v) return null;
    var g = GROUP[el], c = charge || 0;
    var out = v.map(function (x) {
      var r = x;
      if (g === 14) r = c ? x - Math.abs(c) : x - 2 * (lonePairs || 0);
      else if (g === 13) r = x - c;
      else if (g >= 15) r = x + c;
      else r = x - Math.abs(c); // H, metals
      return r - (radical || 0);
    });
    return out;
  }

  // ---------- abbreviations (formula of the group itself, attachment point removed) ----------
  var ABBR = {
    Me: 'CH3', Et: 'C2H5', Pr: 'C3H7', nPr: 'C3H7', iPr: 'C3H7', Bu: 'C4H9', nBu: 'C4H9', iBu: 'C4H9', sBu: 'C4H9',
    tBu: 'C4H9', Ph: 'C6H5', Bn: 'C7H7', Bz: 'C7H5O', Ac: 'C2H3O', Ts: 'C7H7O2S', Ms: 'CH3O2S', Tf: 'CF3O2S',
    Boc: 'C5H9O2', Cbz: 'C8H7O2', Fmoc: 'C15H11O2', TMS: 'C3H9Si', TBS: 'C6H15Si', TBDMS: 'C6H15Si', TIPS: 'C9H21Si',
    TES: 'C6H15Si', PMB: 'C8H9O', Tol: 'C7H7', Mes: 'C9H11', Cy: 'C6H11', Vin: 'C2H3', Allyl: 'C3H5', Bs: 'C6H5O2S',
    Np: 'C10H7', Py: 'C5H4N', Piv: 'C5H9O', THP: 'C5H9O', MOM: 'C2H5O', SEM: 'C6H15OSi', Tr: 'C19H15', Trt: 'C19H15',
    Ns: 'C6H4NO4S', Ar: 'C6H5', R: '', X: ''
  };

  // parse a condensed label / formula like "CO2Et", "CH2OH", "N(CH3)2", "OTBS" into element counts
  function parseFormula(str) {
    var pos = 0;
    function group() {
      var counts = {};
      while (pos < str.length) {
        var c = str.charAt(pos);
        if (c === '(' || c === '[') {
          pos++;
          var inner = group();
          if (str.charAt(pos) === ')' || str.charAt(pos) === ']') pos++;
          var n = num();
          add(counts, inner, n);
        } else if (c === ')' || c === ']') {
          return counts;
        } else {
          var m = /^(?:[nist]|sec|tert)?[A-Z][a-z]*/.exec(str.slice(pos));
          if (!m) {
            if (/[\s·]/.test(c)) { pos++; continue; }
            throw new Error('bad formula');
          }
          var tok = m[0];
          var resolved = resolveToken(tok);
          if (!resolved) throw new Error('unknown token ' + tok);
          pos += resolved.len;
          var k = num();
          add(counts, resolved.counts, k);
        }
      }
      return counts;
    }
    function num() {
      var m = /^\d+/.exec(str.slice(pos));
      if (!m) return 1;
      pos += m[0].length;
      return parseInt(m[0], 10);
    }
    function resolveToken(tok) {
      // try whole token as abbreviation, else longest element prefix
      if (ABBR[tok] !== undefined) return { len: tok.length, counts: ABBR[tok] ? parseFormula(ABBR[tok]) : {} };
      if (tok.length >= 2 && Z[tok.slice(0, 2)] && /^[A-Z][a-z]$/.test(tok.slice(0, 2))) {
        var c2 = {}; c2[tok.slice(0, 2)] = 1;
        return { len: 2, counts: c2 };
      }
      if (Z[tok.charAt(0)]) {
        var c1 = {}; c1[tok.charAt(0)] = 1;
        return { len: 1, counts: c1 };
      }
      return null;
    }
    function add(into, from, k) {
      Object.keys(from).forEach(function (e) { into[e] = (into[e] || 0) + from[e] * k; });
    }
    var res = group();
    if (pos < str.length) throw new Error('bad formula');
    return res;
  }
  function safeParseFormula(str) {
    try { return parseFormula(str); } catch (e) { return null; }
  }

  // Split a label into display tokens (each token keeps its digits): "CO2Et" -> ["C","O2","Et"]
  function labelTokens(label) {
    var toks = [], re = /\([^)]*\)\d*|[A-Z][a-z]*\d*|[a-z]+\d*|[^A-Za-z(]+/g, m;
    while ((m = re.exec(label))) toks.push(m[0]);
    return toks;
  }

  // ---------- molecule graph helpers ----------
  function graph(page) {
    var atoms = new Map(), adj = new Map(), bonds = new Map();
    page.atoms.forEach(function (a) { atoms.set(a.id, a); adj.set(a.id, []); });
    page.bonds.forEach(function (b) {
      bonds.set(b.id, b);
      if (adj.has(b.a)) adj.get(b.a).push(b);
      if (adj.has(b.b)) adj.get(b.b).push(b);
    });
    return { atoms: atoms, bonds: bonds, adj: adj };
  }
  function other(b, id) { return b.a === id ? b.b : b.a; }

  function bondOrderSum(g, atom) {
    return g.adj.get(atom.id).reduce(function (s, b) { return s + (b.order || 1); }, 0);
  }

  // drawings from older versions marked singlet carbenes as lonePairs 1 + radical 2 + lpCarbene
  function atomValences(atom) {
    return valences(atom.el, atom.charge, atom.lpCarbene ? 0 : atom.radical, atom.lonePairs);
  }
  // 'singlet' (:C, lone pair), 'triplet' (·C·, two radical electrons) or null
  function carbeneState(atom) {
    if (atom.label || atom.charge || (atom.el !== 'C' && atom.el !== 'Si')) return null;
    if (atom.lonePairs || atom.lpCarbene) return 'singlet';
    if (atom.radical === 2) return 'triplet';
    return null;
  }
  function setCarbene(atom, state) {
    delete atom.lpCarbene;
    delete atom.hCount;
    if (state === 'singlet') { atom.lonePairs = 1; delete atom.radical; }
    else if (state === 'triplet') { atom.radical = 2; delete atom.lonePairs; }
    else { delete atom.lonePairs; delete atom.radical; }
  }

  function implicitH(g, atom) {
    if (atom.label) return 0;
    if (atom.hCount != null) return atom.hCount;
    var vs = atomValences(atom);
    if (!vs) return 0;
    var sum = bondOrderSum(g, atom);
    for (var i = 0; i < vs.length; i++) if (vs[i] >= sum) return vs[i] - sum;
    return 0;
  }
  function valenceError(g, atom) {
    if (atom.label) return false;
    var vs = atomValences(atom);
    if (!vs) return false;
    return bondOrderSum(g, atom) > Math.max.apply(null, vs);
  }

  // connected components of atoms -> array of {atoms:[ids], bonds:[ids]}
  function fragments(g, atomIds) {
    var seen = new Set(), out = [];
    (atomIds || Array.from(g.atoms.keys())).forEach(function (start) {
      if (seen.has(start) || !g.atoms.has(start)) return;
      var stack = [start], fa = [], fb = new Set();
      seen.add(start);
      while (stack.length) {
        var id = stack.pop();
        fa.push(id);
        g.adj.get(id).forEach(function (b) {
          fb.add(b.id);
          var o = other(b, id);
          if (!seen.has(o)) { seen.add(o); stack.push(o); }
        });
      }
      out.push({ atoms: fa, bonds: Array.from(fb) });
    });
    return out;
  }

  // smallest ring through bond (BFS from a to b without using the bond)
  function ringThrough(g, bond, avoid) {
    var start = bond.a, goal = bond.b, prev = new Map([[start, null]]), q = [start];
    while (q.length) {
      var id = q.shift();
      if (id === goal) break;
      var list = g.adj.get(id);
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (b.id === bond.id) continue;
        var o = other(b, id);
        if (prev.has(o) || (avoid && avoid.has(o))) continue;
        prev.set(o, id);
        q.push(o);
      }
    }
    if (!prev.has(goal)) return null;
    var path = [], cur = goal;
    while (cur != null) { path.push(cur); cur = prev.get(cur); }
    return path.length > 12 ? null : path;
  }

  // ---------- formula & mass ----------
  function countsFor(page, atomIds) {
    var g = graph(page), counts = {}, unknown = [], charge = 0;
    atomIds.forEach(function (id) {
      var a = g.atoms.get(id);
      if (!a) return;
      charge += a.charge || 0;
      if (a.label) {
        var f = labelFormula(a.label);
        if (!f) { unknown.push(a.label); return; }
        // the label stands for a group attached by its bonds; add implicit H for plain element+H labels
        Object.keys(f).forEach(function (e) { counts[e] = (counts[e] || 0) + f[e]; });
        return;
      }
      counts[a.el] = (counts[a.el] || 0) + 1;
      var h = implicitH(g, a);
      if (h) counts.H = (counts.H || 0) + h;
    });
    return { counts: counts, unknown: unknown, charge: charge };
  }
  function labelFormula(label) {
    var f = safeParseFormula(label);
    return f;
  }
  function hillOrder(counts) {
    var els = Object.keys(counts).filter(function (e) { return counts[e] > 0; });
    var hasC = !!counts.C;
    els.sort(function (a, b) {
      if (hasC) {
        if (a === 'C') return -1; if (b === 'C') return 1;
        if (a === 'H') return -1; if (b === 'H') return 1;
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return els;
  }
  function formulaString(counts, markup) {
    return hillOrder(counts).map(function (e) {
      var n = counts[e];
      return e + (n > 1 ? (markup ? '_{' + n + '}' : String(n)) : '');
    }).join('');
  }
  function mass(counts, mono) {
    var m = 0, ok = true;
    Object.keys(counts).forEach(function (e) {
      var w = mono ? (MONO[e] != null ? MONO[e] : WEIGHTS[Z[e] - 1]) : (e === 'D' ? 2.014 : WEIGHTS[Z[e] - 1]);
      if (w == null) ok = false; else m += w * counts[e];
    });
    return ok ? m : NaN;
  }
  function analysis(page, atomIds) {
    var c = countsFor(page, atomIds);
    var mw = mass(c.counts, false), exact = mass(c.counts, true);
    var ea = [];
    hillOrder(c.counts).forEach(function (e) {
      var w = e === 'D' ? 2.014 : WEIGHTS[Z[e] - 1];
      ea.push({ el: e, pct: 100 * w * c.counts[e] / mw });
    });
    var electron = 0.00054858;
    return {
      counts: c.counts, unknown: c.unknown, charge: c.charge,
      formula: formulaString(c.counts, false), formulaMarkup: formulaString(c.counts, true),
      mw: mw, exact: exact, mz: c.charge ? (exact - c.charge * electron) / Math.abs(c.charge) : exact,
      ea: ea
    };
  }

  // ---------- OpenChemLib bridge ----------
  function ocl() { return window.OCL; }

  // page atoms subset -> OCL molecule; returns {mol, map: atomId->index}
  function toOCL(page, atomIds) {
    var O = ocl();
    var g = graph(page), set = new Set(atomIds || Array.from(g.atoms.keys()));
    var mol = new O.Molecule(set.size, set.size * 2), map = new Map(), L = CS.settings().bondLength;
    set.forEach(function (id) {
      var a = g.atoms.get(id);
      var z = a.label ? 0 : (Z[a.el] || 6);
      var i = mol.addAtom(z);
      if (a.label) {
        var lf = safeParseFormula(a.label);
        mol.setAtomCustomLabel(i, a.label);
        if (lf && Object.keys(lf).length === 1 && lf[Object.keys(lf)[0]] === 1) mol.setAtomicNo(i, Z[Object.keys(lf)[0]]);
      }
      mol.setAtomX(i, a.x / L);
      mol.setAtomY(i, a.y / L);
      if (a.charge) mol.setAtomCharge(i, a.charge);
      if (a.el === 'D') mol.setAtomMass(i, 2);
      var cs = carbeneState(a);
      if (cs) mol.setAtomRadical(i, cs === 'singlet' ? O.Molecule.cAtomRadicalStateS : O.Molecule.cAtomRadicalStateT);
      else if (a.radical) mol.setAtomRadical(i, a.radical === 2 ? O.Molecule.cAtomRadicalStateT : O.Molecule.cAtomRadicalStateD);
      map.set(id, i);
    });
    page.bonds.forEach(function (b) {
      if (!map.has(b.a) || !map.has(b.b)) return;
      var bi = mol.addBond(map.get(b.a), map.get(b.b));
      var order = b.order || 1;
      if (order === 2) mol.setBondType(bi, O.Molecule.cBondTypeDouble);
      else if (order === 3) mol.setBondType(bi, O.Molecule.cBondTypeTriple);
      else if (b.style === 'wedge' || b.style === 'hollow') mol.setBondType(bi, O.Molecule.cBondTypeUp);
      else if (b.style === 'hash') mol.setBondType(bi, O.Molecule.cBondTypeDown);
      else mol.setBondType(bi, O.Molecule.cBondTypeSingle);
    });
    return { mol: mol, map: map };
  }

  // OCL molecule -> {atoms, bonds} in page coordinates centred at (cx, cy)
  function fromOCL(mol, cx, cy, keepCoords) {
    var O = ocl();
    var L = CS.settings().bondLength;
    if (!keepCoords) mol.inventCoordinates();
    var n = mol.getAllAtoms(), nb = mol.getAllBonds();
    // drop explicit hydrogens that are only there for stereo when they have no coordinates info
    var avg = 0;
    for (var k = 0; k < nb; k++) {
      var a1 = mol.getBondAtom(0, k), a2 = mol.getBondAtom(1, k);
      avg += Math.hypot(mol.getAtomX(a1) - mol.getAtomX(a2), mol.getAtomY(a1) - mol.getAtomY(a2));
    }
    avg = nb ? avg / nb : 1;
    var s = L / (avg || 1);
    var xs = 0, ys = 0;
    for (var i = 0; i < n; i++) { xs += mol.getAtomX(i); ys += mol.getAtomY(i); }
    xs /= n || 1; ys /= n || 1;
    var ids = [], atoms = [], bonds = [];
    for (i = 0; i < n; i++) {
      var id = CS.uid();
      ids.push(id);
      var z = mol.getAtomicNo(i);
      var atom = {
        id: id,
        x: cx + (mol.getAtomX(i) - xs) * s,
        y: cy + (mol.getAtomY(i) - ys) * s,
        el: z > 0 ? SYMBOLS[z - 1] : 'C',
        charge: mol.getAtomCharge(i) || 0
      };
      var lab = mol.getAtomCustomLabel(i);
      if (z === 0 || lab) atom.label = lab || 'R';
      if (z === 1 && mol.getAtomMass(i) === 2) atom.el = 'D';
      var rad = mol.getAtomRadical(i);
      if (rad === O.Molecule.cAtomRadicalStateD) atom.radical = 1;
      else if (rad === O.Molecule.cAtomRadicalStateT) atom.radical = 2;
      else if (rad === O.Molecule.cAtomRadicalStateS) atom.lonePairs = 1;
      atoms.push(atom);
    }
    for (k = 0; k < nb; k++) {
      var t = mol.getBondType(k), order = mol.getBondOrder(k);
      var bond = { id: CS.uid(), a: ids[mol.getBondAtom(0, k)], b: ids[mol.getBondAtom(1, k)], order: order || 1 };
      if (t === O.Molecule.cBondTypeUp) bond.style = 'wedge';
      else if (t === O.Molecule.cBondTypeDown) bond.style = 'hash';
      else if (t === O.Molecule.cBondTypeCross) bond.style = 'wavy';
      bonds.push(bond);
    }
    return { atoms: atoms, bonds: bonds };
  }

  function smilesToMol(smi) {
    var O = ocl();
    var mol = O.Molecule.fromSmiles(smi.trim());
    return mol;
  }

  function oclReady() { return !!ocl(); }

  function smilesOf(page, atomIds) {
    var r = toOCL(page, atomIds);
    return r.mol.toIsomericSmiles ? r.mol.toIsomericSmiles() : r.mol.toSmiles();
  }

  function molfileOf(page, atomIds) {
    var r = toOCL(page, atomIds);
    // OCL invents y-up coordinates in molfiles from y-down screen coordinates automatically
    return r.mol.toMolfile();
  }

  function properties(page, atomIds) {
    var O = ocl(), r = toOCL(page, atomIds);
    var p = new O.MoleculeProperties(r.mol);
    return {
      logP: p.logP, logS: p.logS, psa: p.polarSurfaceArea, donors: p.donorCount, acceptors: p.acceptorCount,
      rotatable: p.rotatableBondCount, stereocenters: p.stereoCenterCount
    };
  }

  // CIP labels (R/S) for stereocentres -> Map atomId -> 'R'|'S'
  function cipLabels(page, atomIds) {
    var O = ocl(), r = toOCL(page, atomIds), out = new Map();
    var mol = r.mol;
    mol.ensureHelperArrays(O.Molecule.cHelperCIP);
    r.map.forEach(function (i, id) {
      var p = mol.getAtomCIPParity(i);
      if (p === O.Molecule.cAtomCIPParityRorM) out.set(id, 'R');
      else if (p === O.Molecule.cAtomCIPParitySorP) out.set(id, 'S');
    });
    return out;
  }

  CS.Chem = {
    SYMBOLS: SYMBOLS, WEIGHTS: WEIGHTS, MONO: MONO, Z: Z, COLORS: COLORS, ABBR: ABBR,
    ptPos: ptPos,
    valences: valences,
    carbeneState: carbeneState,
    setCarbene: setCarbene,
    graph: graph,
    other: other,
    implicitH: implicitH,
    valenceError: valenceError,
    bondOrderSum: bondOrderSum,
    fragments: fragments,
    ringThrough: ringThrough,
    labelTokens: labelTokens,
    parseFormula: safeParseFormula,
    isElement: function (s) { return !!Z[s]; },
    analysis: analysis,
    formulaString: formulaString,
    oclReady: oclReady,
    toOCL: toOCL,
    fromOCL: fromOCL,
    smilesToMol: smilesToMol,
    smilesOf: smilesOf,
    molfileOf: molfileOf,
    properties: properties,
    cipLabels: cipLabels
  };
})(window.CS);
