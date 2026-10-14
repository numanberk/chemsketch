/* Structure templates (generated from SMILES with OpenChemLib) and thumbnails. */
(function (CS) {
  'use strict';

  var GROUPS = [
    {
      name: 'Rings', items: [
        ['Cyclopropane', 'C1CC1'], ['Cyclobutane', 'C1CCC1'], ['Cyclopentane', 'C1CCCC1'], ['Cyclohexane', 'C1CCCCC1'],
        ['Cyclohexene', 'C1CCC=CC1'], ['Cycloheptane', 'C1CCCCCC1'], ['Benzene', 'c1ccccc1'], ['Naphthalene', 'c1ccc2ccccc2c1'],
        ['Anthracene', 'c1ccc2cc3ccccc3cc2c1'], ['Phenanthrene', 'c1ccc2c(c1)ccc1ccccc12'], ['Pyridine', 'c1ccncc1'], ['Pyrimidine', 'c1cncnc1'],
        ['Furan', 'c1ccoc1'], ['Thiophene', 'c1ccsc1'], ['Pyrrole', 'c1cc[nH]c1'], ['Imidazole', 'c1c[nH]cn1'],
        ['Indole', 'c1ccc2[nH]ccc2c1'], ['Quinoline', 'c1ccc2ncccc2c1'], ['Cyclopentadiene', 'C1C=CC=C1'], ['Steroid skeleton', 'C1CCC2C(C1)CCC1C2CCC2CCCC12'],
        ['Norbornane', 'C1CC2CCC1C2'], ['Decalin', 'C1CCC2CCCCC2C1'], ['THP', 'C1CCOCC1'], ['Morpholine', 'C1COCCN1']
      ]
    },
    {
      name: 'Carbenes lab', items: [
        ['Cyclohexene', 'C1CCC=CC1'], ['Chloroform', 'ClC(Cl)Cl'], ['Dichlorocarbene', '[C](Cl)Cl'],
        ['7,7-Dichloronorcarane', 'ClC1(Cl)C2CCCCC12'], ['TEBA (BnEt3N+ Cl−)', 'CC[N+](CC)(CC)Cc1ccccc1.[Cl-]'], ['Sodium hydroxide', '[Na+].[OH-]']
      ]
    },
    {
      name: 'Amino acids', items: [
        ['Glycine', 'NCC(=O)O'], ['Alanine', 'C[C@H](N)C(=O)O'], ['Valine', 'CC(C)[C@H](N)C(=O)O'], ['Leucine', 'CC(C)C[C@H](N)C(=O)O'],
        ['Isoleucine', 'CC[C@H](C)[C@H](N)C(=O)O'], ['Proline', 'OC(=O)[C@@H]1CCCN1'], ['Phenylalanine', 'N[C@@H](Cc1ccccc1)C(=O)O'],
        ['Tyrosine', 'N[C@@H](Cc1ccc(O)cc1)C(=O)O'], ['Tryptophan', 'N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O'], ['Serine', 'N[C@@H](CO)C(=O)O'],
        ['Threonine', 'C[C@@H](O)[C@H](N)C(=O)O'], ['Cysteine', 'N[C@@H](CS)C(=O)O'], ['Methionine', 'CSCC[C@H](N)C(=O)O'],
        ['Aspartic acid', 'N[C@@H](CC(=O)O)C(=O)O'], ['Glutamic acid', 'N[C@@H](CCC(=O)O)C(=O)O'], ['Asparagine', 'N[C@@H](CC(N)=O)C(=O)O'],
        ['Glutamine', 'N[C@@H](CCC(N)=O)C(=O)O'], ['Lysine', 'NCCCC[C@H](N)C(=O)O'], ['Arginine', 'N[C@@H](CCCNC(N)=N)C(=O)O'], ['Histidine', 'N[C@@H](Cc1c[nH]cn1)C(=O)O']
      ]
    },
    {
      name: 'Sugars & nucleobases', items: [
        ['β-D-Glucose', 'OC[C@H]1O[C@@H](O)[C@H](O)[C@@H](O)[C@@H]1O'], ['D-Glucose (open)', 'OC[C@@H](O)[C@@H](O)[C@H](O)[C@@H](O)C=O'],
        ['D-Ribose', 'OC[C@H]1OC(O)[C@H](O)[C@@H]1O'], ['Adenine', 'Nc1ncnc2[nH]cnc12'], ['Guanine', 'Nc1nc2[nH]cnc2c(=O)[nH]1'],
        ['Cytosine', 'Nc1cc[nH]c(=O)n1'], ['Thymine', 'Cc1c[nH]c(=O)[nH]c1=O'], ['Uracil', 'O=c1cc[nH]c(=O)[nH]1']
      ]
    },
    {
      name: 'Solvents & reagents', items: [
        ['Water', 'O'], ['Methanol', 'CO'], ['Ethanol', 'CCO'], ['Acetone', 'CC(C)=O'], ['Ethyl acetate', 'CCOC(C)=O'], ['Diethyl ether', 'CCOCC'],
        ['THF', 'C1CCOC1'], ['DCM', 'ClCCl'], ['DMSO', 'CS(C)=O'], ['DMF', 'CN(C)C=O'], ['Acetonitrile', 'CC#N'], ['Toluene', 'Cc1ccccc1'],
        ['Acetic acid', 'CC(=O)O'], ['Triethylamine', 'CCN(CC)CC'], ['Pyridine', 'c1ccncc1'], ['DMAP', 'CN(C)c1ccncc1'], ['NBS', 'BrN1C(=O)CCC1=O'],
        ['mCPBA', 'OOC(=O)c1cccc(Cl)c1'], ['Boc2O', 'CC(C)(C)OC(=O)OC(=O)OC(C)(C)C'], ['TsCl', 'Cc1ccc(cc1)S(Cl)(=O)=O'], ['DCC', 'C1CCC(CC1)N=C=NC1CCCCC1'],
        ['NaBH4', '[Na+].[BH4-]'], ['Grignard (PhMgBr)', 'Br[Mg]c1ccccc1']
      ]
    },
    {
      name: 'Common molecules', items: [
        ['Aspirin', 'CC(=O)Oc1ccccc1C(=O)O'], ['Paracetamol', 'CC(=O)Nc1ccc(O)cc1'], ['Ibuprofen', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O'],
        ['Caffeine', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C'], ['Nicotine', 'CN1CCC[C@H]1c1cccnc1'], ['Vanillin', 'COc1cc(C=O)ccc1O'],
        ['Benzoic acid', 'OC(=O)c1ccccc1'], ['Benzaldehyde', 'O=Cc1ccccc1'], ['Aniline', 'Nc1ccccc1'], ['Phenol', 'Oc1ccccc1'],
        ['Cholesterol', 'C[C@H](CCCC(C)C)[C@H]1CC[C@H]2[C@@H]3CC=C4C[C@@H](O)CC[C@]4(C)[C@H]3CC[C@]12C'],
        ['Menthol', 'CC(C)[C@@H]1CC[C@@H](C)C[C@H]1O'], ['Limonene', 'CC1=CCC(CC1)C(C)=C'], ['Glycerol', 'OCC(O)CO']
      ]
    }
  ];

  var cache = new Map();
  function fragmentFromSmiles(smi) {
    if (!CS.Chem.oclReady()) throw new Error('OpenChemLib not loaded');
    var key = smi + '|' + CS.settings().bondLength;
    if (!cache.has(key)) {
      var mol = CS.Chem.smilesToMol(smi);
      var r = CS.Chem.fromOCL(mol, 0, 0);
      cache.set(key, { atoms: r.atoms, bonds: r.bonds, objects: [] });
    }
    return CS.clone(cache.get(key));
  }

  // cyclohexane chair, drawn with the conventional parallel-line geometry
  function chair() {
    var L = CS.settings().bondLength / 20;
    var pts = [[0, 0], [17, 8], [37, 2], [54, 11], [37, 19], [17, 13]].map(function (p) { return { x: p[0] * L * 1.0, y: p[1] * L * 1.0 }; });
    var atoms = pts.map(function (p) { return { id: CS.uid(), x: p.x, y: p.y, el: 'C' }; });
    var bonds = [];
    for (var i = 0; i < 6; i++) bonds.push({ id: CS.uid(), a: atoms[i].id, b: atoms[(i + 1) % 6].id, order: 1 });
    return { atoms: atoms, bonds: bonds, objects: [] };
  }

  function thumbSVG(frag, size) {
    var page = { atoms: frag.atoms, bonds: frag.bonds, objects: [] };
    var bb = CS.bboxOfPoints(frag.atoms, CS.settings().fontSize);
    if (!bb) return '';
    var s = Math.min((size - 4) / bb.w, (size - 4) / bb.h, 1.6);
    var body = CS.R.renderMolecule(page, { noCache: true });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><g transform="translate(' +
      CS.n((size - bb.w * s) / 2 - bb.x * s) + ' ' + CS.n((size - bb.h * s) / 2 - bb.y * s) + ') scale(' + CS.n4(s) + ')">' + body + '</g></svg>';
  }

  CS.Templates = { GROUPS: GROUPS, fromSmiles: fragmentFromSmiles, chair: chair, thumbSVG: thumbSVG };
})(window.CS);
