// Chiêm tinh Calculator — dùng astronomy-engine
import type { AstrologyInput, AstrologyResult, PlanetPosition, House, Aspect, Ascendant, Midheaven } from './types';
import { ZODIAC, PLANETS, HOUSES, ASPECTS, ELEMENTS } from './constants';

// Dynamic import of astronomy-engine (server-side compatible)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ae: Record<string, any> | null = null;
async function getAE() {
  if (!ae) ae = await import('astronomy-engine');
  return ae;
}

// ----- HELPERS -----
function getSignFromLongitude(lon: number): { sign: string; signEn: string; index: number; degrees: number } {
  if (isNaN(lon) || !isFinite(lon)) lon = 0;
  let idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  if (idx >= 12 || idx < 0) idx = 0;
  const s = ZODIAC[idx];
  if (!s) return { sign: "Bạch Dương", signEn: "Aries", index: 0, degrees: 0 };
  return {
    sign: s.vi, signEn: s.en, index: idx,
    degrees: ((lon % 360 + 360) % 360) - s.start,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isRetrograde(body: any, dt: any): boolean {
  const dt2 = ae ? ae.MakeTime(new Date(dt.date.getTime() + 86400000)) : dt;
  return false;
}

// ----- MAIN CALCULATOR -----
export async function calculateAstrology(input: AstrologyInput): Promise<AstrologyResult> {
  const eng = await getAE();
  const { ngaySinh, gioSinh, phutSinh = 0, viDo = 21.0285, kinhDo = 105.8542 } = input;
  const [y, m, d] = ngaySinh.split('-').map(Number);

  // Create time object (local time UTC+7)
  const birthDate = new Date(y, m - 1, d, gioSinh, phutSinh, 0);
  const utcDate = new Date(birthDate.getTime() - 7 * 3600000);
  const time = eng.MakeTime(utcDate);

  // ---- 1. SUN POSITION ----
  const sunEcl = eng.SunPosition(time);
  const sunSign = getSignFromLongitude(sunEcl.elon);
  const sun: PlanetPosition = {
    planet: "Mặt Trời", planetEn: "Sun", symbol: "☉",
    longitude: sunEcl.elon,
    latitude: sunEcl.elat,
    sign: sunSign.sign, signEn: sunSign.signEn, signIndex: sunSign.index,
    degrees: sunSign.degrees,
    house: 1, retrograde: false,
    meaning: ZODIAC[sunSign.index].meaning,
    meaningEn: ZODIAC[sunSign.index].meaningEn,
  };

  // ---- 2. MOON POSITION ----
  const moonVec = eng.GeoMoon(time);
  const moonEcl = eng.Ecliptic(moonVec);
  const moonSign = getSignFromLongitude(moonEcl.elon);
  const moon: PlanetPosition = {
    planet: "Mặt Trăng", planetEn: "Moon", symbol: "☽",
    longitude: moonEcl.elon, latitude: moonEcl.elat,
    sign: moonSign.sign, signEn: moonSign.signEn, signIndex: moonSign.index,
    degrees: moonSign.degrees,
    house: 1, retrograde: false,
    meaning: ZODIAC[moonSign.index].meaning,
    meaningEn: ZODIAC[moonSign.index].meaningEn,
  };

  // ---- 3. PLANET POSITIONS ----
  const earthHelio = eng.HelioVector(eng.Body.Earth, time);
  const planetDefs = [
    { body: eng.Body.Mercury, vi: "Sao Thủy", en: "Mercury", sym: "☿" },
    { body: eng.Body.Venus, vi: "Sao Kim", en: "Venus", sym: "♀" },
    { body: eng.Body.Mars, vi: "Sao Hỏa", en: "Mars", sym: "♂" },
    { body: eng.Body.Jupiter, vi: "Sao Mộc", en: "Jupiter", sym: "♃" },
    { body: eng.Body.Saturn, vi: "Sao Thổ", en: "Saturn", sym: "♄" },
    { body: eng.Body.Uranus, vi: "Sao Thiên Vương", en: "Uranus", sym: "♅" },
    { body: eng.Body.Neptune, vi: "Sao Hải Vương", en: "Neptune", sym: "♆" },
  ];

  const planets: PlanetPosition[] = [];

  for (const pDef of planetDefs) {
    try {
      const helio = eng.HelioVector(pDef.body, time);
      const geo = { x: helio.x - earthHelio.x, y: helio.y - earthHelio.y, z: helio.z - earthHelio.z, t: time };
      const vec = new eng.Vector(geo.x, geo.y, geo.z, geo.t);
      const ecl = eng.Ecliptic(vec);
      const pSign = getSignFromLongitude(ecl.elon);

      planets.push({
        planet: pDef.vi, planetEn: pDef.en, symbol: pDef.sym,
        longitude: ecl.elon, latitude: ecl.elat,
        sign: pSign.sign, signEn: pSign.signEn, signIndex: pSign.index,
        degrees: pSign.degrees,
        house: 1, retrograde: false,
        meaning: ZODIAC[pSign.index].meaning,
        meaningEn: ZODIAC[pSign.index].meaningEn,
      });
    } catch (e) {
      console.error(`Failed to calculate ${pDef.en}:`, e);
    }
  }

  // ---- 4. ASCENDANT (Cung Mọc) ----
  const lstHours = eng.SiderealTime(time) + kinhDo / 15;
  const lstDeg = ((lstHours * 15) % 360 + 360) % 360;
  const obliquity = eng.e_tilt(time).to;
  const latRad = viDo * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;

  // ASC = arctan2(cos(lstDeg), -(sin(lstDeg)*cos(obliquity) + tan(lat)*sin(obliquity)))
  const lstRad = lstDeg * Math.PI / 180;
  const ascRad = Math.atan2(
    -Math.sin(lstRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad),
    Math.cos(lstRad)
  );
  const ascDeg = (ascRad * 180 / Math.PI + 360) % 360;
  const ascSign = getSignFromLongitude(ascDeg);

  const ascendant: Ascendant = {
    longitude: ascDeg,
    sign: ascSign.sign, signEn: ascSign.signEn, signIndex: ascSign.index,
    degrees: ascSign.degrees,
    meaning: `Cung Mọc của bạn là ${ascSign.sign} (${ascSign.signEn}), đại diện cho vẻ ngoài và cách người khác nhìn nhận bạn.`,
    meaningEn: `Your Rising sign is ${ascSign.signEn}, representing how others perceive you.`,
  };

  // ---- 5. MIDHEAVEN (MC) ----
  const mcDeg = ((lstDeg - 90 + 360) % 360);
  const mcSign = getSignFromLongitude(mcDeg);
  const midheaven: Midheaven = {
    longitude: mcDeg,
    sign: mcSign.sign, signEn: mcSign.signEn, signIndex: mcSign.index,
    meaning: `Thiên Đỉnh của bạn ở ${mcSign.sign} (${mcSign.signEn}), đại diện cho sự nghiệp và mục tiêu cuộc đời.`,
    meaningEn: `Your Midheaven is in ${mcSign.signEn}, representing career and life goals.`,
  };

  // ---- 6. HOUSES (Simplified Equal House System) ----
  const houses: House[] = HOUSES.map((h, i) => {
    const cusp = ((ascDeg + i * 30) % 360 + 360) % 360;
    const hSign = getSignFromLongitude(cusp);
    return { number: i + 1, cusp, sign: hSign.sign, signEn: hSign.signEn, name: h.vi, nameEn: h.en, meaning: h.meaning, meaningEn: h.meaningEn };
  });

  // Assign planets to houses
  const allBodies = [sun, moon, ...planets];
  allBodies.forEach(p => {
    for (let i = 0; i < houses.length; i++) {
      const nextCusp = ((houses[(i + 1) % 12].cusp) % 360 + 360) % 360;
      const thisCusp = houses[i].cusp;
      const plon = ((p.longitude % 360) + 360) % 360;
      if (i < 11) {
        if (plon >= thisCusp && plon < nextCusp) { p.house = i + 1; break; }
      } else {
        if (plon >= thisCusp || plon < nextCusp) { p.house = 12; break; }
      }
    }
  });

  // ---- 7. ASPECTS ----
  const aspects: Aspect[] = [];
  const aspectDefs = [
    { type: "conjunction", angle: 0, orb: 8 },
    { type: "sextile", angle: 60, orb: 6 },
    { type: "square", angle: 90, orb: 8 },
    { type: "trine", angle: 120, orb: 8 },
    { type: "opposition", angle: 180, orb: 8 },
  ];

  for (let i = 0; i < allBodies.length; i++) {
    for (let j = i + 1; j < allBodies.length; j++) {
      const diff = Math.abs(allBodies[i].longitude - allBodies[j].longitude);
      const diffNorm = Math.min(diff, 360 - diff);
      for (const asp of aspectDefs) {
        if (Math.abs(diffNorm - asp.angle) <= asp.orb) {
          const aDef = ASPECTS[asp.type as keyof typeof ASPECTS];
          const harmonious = asp.type === 'sextile' || asp.type === 'trine';
          aspects.push({
            planet1: allBodies[i].planetEn, planet2: allBodies[j].planetEn,
            angle: Math.round(diffNorm), orb: Math.round(Math.abs(diffNorm - asp.angle) * 10) / 10,
            type: asp.type, typeEn: aDef.en, typeVi: aDef.vi,
            meaning: aDef.meaning, meaningEn: aDef.meaningEn,
            harmonious,
          });
          break;
        }
      }
    }
  }

  // ---- 8. DOMINANT ELEMENT & QUALITY ----
  const elementCounts: Record<string, number> = { "Lửa": 0, "Đất": 0, "Khí": 0, "Nước": 0 };
  const qualityCounts: Record<string, number> = { "Thống lĩnh": 0, "Cố định": 0, "Linh hoạt": 0 };
  allBodies.forEach(p => {
    const sign = ZODIAC[p.signIndex];
    if (sign) {
      elementCounts[sign.element] = (elementCounts[sign.element] || 0) + 1;
      qualityCounts[sign.quality] = (qualityCounts[sign.quality] || 0) + 1;
    }
  });
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = Object.entries(qualityCounts).sort((a, b) => b[1] - a[1])[0][0];

  // ---- 9. INTERPRETATIONS ----
  const sunData = ZODIAC[sun.signIndex];
  const moonData = ZODIAC[moon.signIndex];
  const ascData = ZODIAC[ascendant.signIndex];
  const elemData = ELEMENTS[dominantElement as keyof typeof ELEMENTS];
  const sunPlanet = PLANETS[0];
  const moonPlanet = PLANETS[1];

  const interpretations = {
    tongQuan: `Bạn là người mang cung Mặt Trời ${sunData.vi} (${sunData.en}), cung Mặt Trăng ${moonData.vi} (${moonData.en}), và cung Mọc ${ascData.vi} (${ascData.en}). 
Nguyên tố nổi trội: ${dominantElement} (${elemData?.en || ''}) — ${elemData?.meaning || ''}
Khiến bạn ${sunData.positive[0]?.toLowerCase()}, ${sunData.positive[1]?.toLowerCase()} và ${moonData.positive[2]?.toLowerCase()}.`,
    tinhCach: `${sunData.meaning} Với Mặt Trăng ${moonData.vi}, bạn ${moonData.meaning.toLowerCase()} Cung Mọc ${ascData.vi} khiến người khác thấy bạn là người ${ascData.positive[0]?.toLowerCase()}.`,
    suNghiep: `${sunData.career} Với Mặt Trăng ${moonData.vi}, bạn có ${moonData.positive[2]} trong công việc. Thiên Đỉnh ${midheaven.sign} gợi ý hướng đi sự nghiệp phù hợp.`,
    tinhDuyen: `${sunData.love} Nguyên tố ${dominantElement} chi phối cách bạn yêu: ${elemData?.meaning?.toLowerCase() || ''}`,
    sucKhoe: `Cơ địa chịu ảnh hưởng của cung Mặt Trời ${sunData.vi} và nguyên tố ${dominantElement}. 
Cần chú ý ${sunPlanet.body}. Mặt Trăng ${moonData.vi} ảnh hưởng đến ${moonPlanet.body}.`,
    diemManh: [...sunData.positive.slice(0, 3), ...moonData.positive.slice(0, 2)],
    diemYeu: [...sunData.negative.slice(0, 2), ...moonData.negative.slice(0, 2)],
    loiKhuyen: `Phát huy thế mạnh ${sunData.vi}: ${sunData.positive.slice(0, 2).join(', ')}. 
Cân bằng với ${moonData.vi}: ${moonData.positive.slice(0, 2).join(', ')}. 
Lắng nghe cung Mọc ${ascData.vi} để hoàn thiện bản thân.`,
  };

  return {
    input,
    sun, moon, planets,
    ascendant, midheaven,
    houses, aspects,
    dominantElement, dominantQuality,
    sunSign: sunData.vi, moonSign: moonData.vi, risingSign: ascData.vi,
    interpretations,
  };
}
