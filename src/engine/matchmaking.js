// match-making.js থেকে অনুকৃত YotakBicharEngine — ES module wrapper

class YotakBicharEngine {
  constructor() {
    this.rashiNames = [
      'মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা',
      'তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন',
    ];
    this.nakshatraNames = [
      'অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা',
      'পুনর্বসু','পুষ্যা','অশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী',
      'হস্তা','চিত্রা','স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা',
      'মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া','শ্রবণা','ধনিষ্ঠা','শতভিষা',
      'পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী',
    ];
    this.rashiVarna = {
      'মীন':'বিপ্র','কর্কট':'বিপ্র','বৃশ্চিক':'বিপ্র',
      'মেষ':'ক্ষত্রিয়','সিংহ':'ক্ষত্রিয়','ধনু':'ক্ষত্রিয়',
      'বৃষ':'বৈশ্য','কন্যা':'বৈশ্য','মকর':'বৈশ্য',
      'মিথুন':'শূদ্র','তুলা':'শূদ্র','কুম্ভ':'শূদ্র',
    };
    this.varnaRank = { 'বিপ্র':4,'ক্ষত্রিয়':3,'বৈশ্য':2,'শূদ্র':1 };
    this.nakshatraGana = {
      'অশ্বিনী':'দেব','মৃগশিরা':'দেব','পুনর্বসু':'দেব','পুষ্যা':'দেব',
      'হস্তা':'দেব','স্বাতী':'দেব','অনুরাধা':'দেব','শ্রবণা':'দেব','রেবতী':'দেব',
      'ভরণী':'নর','রোহিণী':'নর','আর্দ্রা':'নর','পূর্বফাল্গুনী':'নর',
      'উত্তরফাল্গুনী':'নর','পূর্বাষাঢ়া':'নর','উত্তরাষাঢ়া':'নর',
      'পূর্বভাদ্রপদ':'নর','উত্তরভাদ্রপদ':'নর',
      'কৃত্তিকা':'রাক্ষস','অশ্লেষা':'রাক্ষস','মঘা':'রাক্ষস',
      'চিত্রা':'রাক্ষস','বিশাখা':'রাক্ষস','জ্যেষ্ঠা':'রাক্ষস',
      'মূলা':'রাক্ষস','ধনিষ্ঠা':'রাক্ষস','শতভিষা':'রাক্ষস',
    };
    this.nakshatraYoni = {
      'অশ্বিনী':'অশ্ব','শতভিষা':'অশ্ব',
      'স্বাতী':'মহিষ','হস্তা':'মহিষ',
      'পূর্বভাদ্রপদ':'সিংহ','ধনিষ্ঠা':'সিংহ',
      'ভরণী':'হস্তী','রেবতী':'হস্তী',
      'কৃত্তিকা':'মেষ','পুষ্যা':'মেষ',
      'পূর্বাষাঢ়া':'বানর','শ্রবণা':'বানর',
      'রোহিণী':'সর্প','মৃগশিরা':'সর্প',
      'জ্যেষ্ঠা':'হরিণ','অনুরাধা':'হরিণ',
      'আর্দ্রা':'কুকুর','মূলা':'কুকুর',
      'উত্তরফাল্গুনী':'গো','উত্তরভাদ্রপদ':'গো',
      'চিত্রা':'ব্যাঘ্র','বিশাখা':'ব্যাঘ্র',
      'অশ্লেষা':'বিড়াল','পুনর্বসু':'বিড়াল',
      'মঘা':'ইন্দুর','পূর্বফাল্গুনী':'ইন্দুর',
      'উত্তরাষাঢ়া':'নকুল',
    };
    this.yoniEnmity = {
      'গো':'ব্যাঘ্র','ব্যাঘ্র':'গো','হস্তী':'সিংহ','সিংহ':'হস্তী',
      'অশ্ব':'মহিষ','মহিষ':'অশ্ব','কুকুর':'হরিণ','হরিণ':'কুকুর',
      'সর্প':'নকুল','নকুল':'সর্প','বানর':'মেষ','মেষ':'বানর',
      'বিড়াল':'ইন্দুর','ইন্দুর':'বিড়াল',
    };
    this.nakshatraNadi = {
      'অশ্বিনী':'আদ্য','আর্দ্রা':'আদ্য','পূর্বভাদ্রপদ':'আদ্য',
      'পুনর্বসু':'আদ্য','হস্তা':'আদ্য','জ্যেষ্ঠা':'আদ্য',
      'মূলা':'আদ্য','শ্রবণা':'আদ্য','রেবতী':'আদ্য',
      'ভরণী':'মধ্য','মৃগশিরা':'মধ্য','পুষ্যা':'মধ্য',
      'পূর্বফাল্গুনী':'মধ্য','চিত্রা':'মধ্য','অনুরাধা':'মধ্য',
      'পূর্বাষাঢ়া':'মধ্য','ধনিষ্ঠা':'মধ্য','উত্তরভাদ্রপদ':'মধ্য',
      'কৃত্তিকা':'অন্ত্য','রোহিণী':'অন্ত্য','অশ্লেষা':'অন্ত্য',
      'মঘা':'অন্ত্য','উত্তরফাল্গুনী':'অন্ত্য','স্বাতী':'অন্ত্য',
      'বিশাখা':'অন্ত্য','উত্তরাষাঢ়া':'অন্ত্য','শতভিষা':'অন্ত্য',
    };
    this.rashiLords = {
      'মেষ':'মঙ্গল','বৃষ':'শুক্র','মিথুন':'বুধ','কর্কট':'চন্দ্র',
      'সিংহ':'সূর্য','কন্যা':'বুধ','তুলা':'শুক্র','বৃশ্চিক':'মঙ্গল',
      'ধনু':'বৃহস্পতি','মকর':'শনি','কুম্ভ':'শনি','মীন':'বৃহস্পতি',
    };
    this.planetRelations = {
      'সূর্য': { f:['চন্দ্র','মঙ্গল','বৃহস্পতি'], e:['শুক্র','শনি'] },
      'চন্দ্র': { f:['সূর্য','বুধ'], e:['শুক্র','শনি'] },
      'মঙ্গল': { f:['সূর্য','চন্দ্র','বৃহস্পতি'], e:['বুধ','শুক্র','শনি'] },
      'বুধ':   { f:['সূর্য','শুক্র'], e:['চন্দ্র'] },
      'বৃহস্পতি':{ f:['সূর্য','চন্দ্র','মঙ্গল'], e:['বুধ','শুক্র'] },
      'শুক্র':  { f:['বুধ','শনি'], e:['সূর্য','চন্দ্র'] },
      'শনি':   { f:['বুধ','শুক্র'], e:['সূর্য','চন্দ্র','মঙ্গল'] },
    };
    this.manglikHouses = [1,2,4,7,8,12];
  }

  getNakshatraIndex(nak) { return this.nakshatraNames.indexOf(nak); }
  getRashiIndex(rashi)   { return this.rashiNames.indexOf(rashi); }

  calcVarna(gr, br) {
    const gv = this.rashiVarna[gr]||'শূদ্র', bv = this.rashiVarna[br]||'শূদ্র';
    const gR = this.varnaRank[gv]||1, bR = this.varnaRank[bv]||1;
    const pts = bR >= gR ? 1 : (bR === gR - 1 ? 0.5 : 0);
    return { points: pts, max: 1, girlVarna: gv, boyVarna: bv };
  }

  calcVashya(gr, br) {
    const vm = {
      'মেষ':['সিংহ','বৃষ'],'বৃষ':['মেষ','কর্কট'],'মিথুন':['তুলা','কুম্ভ','কন্যা'],
      'কর্কট':['মকর','মীন','বৃষ'],'সিংহ':['মেষ','ধনু','মীন'],
      'কন্যা':['মিথুন','তুলা','কুম্ভ'],'তুলা':['কন্যা','কুম্ভ','মিথুন'],
      'বৃশ্চিক':['মেষ','সিংহ','ধনু'],'ধনু':['মেষ','সিংহ'],
      'মকর':['কর্কট','মীন'],'কুম্ভ':['তুলা','মিথুন','কন্যা'],'মীন':['কর্কট','বৃশ্চিক'],
    };
    const gv = vm[br]?.includes(gr)||false, bv = vm[gr]?.includes(br)||false;
    const pts = (gv && bv) ? 2 : gv ? 1 : bv ? 0.5 : 0;
    return { points: pts, max: 2 };
  }

  calcTara(gn, bn) {
    const gi = this.getNakshatraIndex(gn), bi = this.getNakshatraIndex(bn);
    if (gi<0||bi<0) return { points:0, max:3 };
    const fb = ((gi-bi+27)%27)+1, fg = ((bi-gi+27)%27)+1;
    const tb = fb%9===0?9:fb%9, tg = fg%9===0?9:fg%9;
    const bad=[3,5,7];
    const pts = (!bad.includes(tb)&&!bad.includes(tg)) ? 3 : (!bad.includes(tb)||!bad.includes(tg)) ? 1.5 : 0;
    const names=['','জন্ম','সম্পদ','বিপৎ','ক্ষেম','প্রত্যরি','সাধক','নিধন','মিত্র','অতিমিত্র'];
    return { points: pts, max: 3, taraBoy: names[tb], taraGirl: names[tg] };
  }

  calcYoni(gn, bn) {
    const gy = this.nakshatraYoni[gn], by = this.nakshatraYoni[bn];
    if (!gy||!by) return { points:0, max:4 };
    let pts = 0;
    if (gy===by) pts=4;
    else if (this.yoniEnmity[gy]===by||this.yoniEnmity[by]===gy) pts=0;
    else pts=1.5;
    return { points: pts, max: 4, girlYoni: gy, boyYoni: by };
  }

  calcGrahaMaitri(gr, br) {
    const gl = this.rashiLords[gr], bl = this.rashiLords[br];
    if (!gl||!bl) return { points:0, max:5 };
    let pts = 0;
    if (gl===bl) pts=5;
    else if (this.planetRelations[bl]?.f?.includes(gl)) pts=4;
    else if (this.planetRelations[gl]?.f?.includes(bl)) pts=3;
    else if (this.planetRelations[bl]?.e?.includes(gl)) pts=0;
    else pts=2;
    return { points: pts, max: 5, girlLord: gl, boyLord: bl };
  }

  calcGana(gn, bn) {
    const gg = this.nakshatraGana[gn], bg = this.nakshatraGana[bn];
    if (!gg||!bg) return { points:0, max:6 };
    let pts = 0;
    if (gg===bg) pts=6;
    else if (gg==='দেব'&&bg==='নর') pts=5;
    else if (gg==='নর'&&bg==='দেব') pts=3;
    else if (gg==='দেব'&&bg==='রাক্ষস') pts=1;
    else if (gg==='রাক্ষস'&&bg==='দেব') pts=0;
    else if (gg==='নর'&&bg==='রাক্ষস') pts=3;
    else if (gg==='রাক্ষস'&&bg==='নর') pts=1;
    return { points: pts, max: 6, girlGana: gg, boyGana: bg };
  }

  calcRashi(gr, br) {
    const gi = this.getRashiIndex(gr), bi = this.getRashiIndex(br);
    if (gi<0||bi<0) return { points:0, max:7 };
    const dist = ((bi-gi+12)%12)+1;
    let pts=0, type='';
    if ([1,7,4,10,3,11].includes(dist)) { pts=7; type='রাজযোটক'; }
    else if (dist===9) { pts=7; type='নবম (শুভ)'; }
    else { pts=0; type='দোষ'; }
    return { points: pts, max: 7, distance: dist, type };
  }

  calcNadi(gn, bn) {
    const gnd = this.nakshatraNadi[gn], bnd = this.nakshatraNadi[bn];
    if (!gnd||!bnd) return { points:0, max:8 };
    const pts = gnd===bnd ? 0 : 8;
    const type = gnd===bnd ? (
      gnd==='আদ্য' ? 'প্রাণনাড়ী বেধ' : gnd==='মধ্য' ? 'মধ্যনাড়ী বেধ' : 'পৃষ্ঠনাড়ী বেধ'
    ) : '';
    return { points: pts, max: 8, girlNadi: gnd, boyNadi: bnd, type };
  }

  calcManglik(marsSign, lagnaSign) {
    const mi = this.getRashiIndex(marsSign), li = this.getRashiIndex(lagnaSign);
    if (mi<0||li<0) return { hasDosha: false, house: -1 };
    const house = ((mi-li+12)%12)+1;
    return { hasDosha: this.manglikHouses.includes(house), house };
  }

  match(girlData, boyData) {
    const gr = girlData.moonRashi,   br = boyData.moonRashi;
    const gn = girlData.moonNakshatra, bn = boyData.moonNakshatra;
    const gMars  = girlData.marsRashi  || gr;
    const bMars  = boyData.marsRashi   || br;
    const gLagna = girlData.lagnaRashi || gr;
    const bLagna = boyData.lagnaRashi  || br;

    const kootas = {
      varna:       this.calcVarna(gr, br),
      vashya:      this.calcVashya(gr, br),
      tara:        this.calcTara(gn, bn),
      yoni:        this.calcYoni(gn, bn),
      grahaMaitri: this.calcGrahaMaitri(gr, br),
      gana:        this.calcGana(gn, bn),
      rashi:       this.calcRashi(gr, br),
      nadi:        this.calcNadi(gn, bn),
    };

    const manglik = {
      girl:  this.calcManglik(gMars, gLagna),
      boy:   this.calcManglik(bMars, bLagna),
      match: this.calcManglik(gMars, gLagna).hasDosha === this.calcManglik(bMars, bLagna).hasDosha,
    };

    let total = 0;
    for (const k of Object.values(kootas)) total += k.points;
    const max = 36;
    const isRajaYotak = kootas.rashi.points === 7;

    let verdict = '';
    if (isRajaYotak && total >= 18)  verdict = 'শ্রেষ্ঠতম (রাজযোটক)';
    else if (total >= 30)            verdict = 'শ্রেষ্ঠতম';
    else if (total >= 25)            verdict = 'উত্তম';
    else if (total >= 18)            verdict = 'মধ্যম';
    else                             verdict = 'অশুভ';

    return { kootas, total, max, verdict, manglik, isRajaYotak };
  }
}

export function calculateAshtakuta(girlData, boyData) {
  return new YotakBicharEngine().match(girlData, boyData);
}

export const RASHI_NAMES = [
  'মেষ','বৃষ','মিথুন','কর্কট','সিংহ','কন্যা',
  'তুলা','বৃশ্চিক','ধনু','মকর','কুম্ভ','মীন',
];
export const NAKSHATRA_NAMES = [
  'অশ্বিনী','ভরণী','কৃত্তিকা','রোহিণী','মৃগশিরা','আর্দ্রা',
  'পুনর্বসু','পুষ্যা','আশ্লেষা','মঘা','পূর্বফাল্গুনী','উত্তরফাল্গুনী',
  'হস্তা','চিত্রা','স্বাতী','বিশাখা','অনুরাধা','জ্যেষ্ঠা',
  'মূলা','পূর্বাষাঢ়া','উত্তরাষাঢ়া','শ্রবণা','ধনিষ্ঠা','শতভিষা',
  'পূর্বভাদ্রপদ','উত্তরভাদ্রপদ','রেবতী',
];
