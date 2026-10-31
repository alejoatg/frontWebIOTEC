/** Cabeceras municipales del Cauca y núcleos operativos TMR (centros aproximados). */

export interface GeoCenter {
  name: string;
  lat: number;
  lng: number;
}

export interface NucleoCenter extends GeoCenter {
  code: string;
  label: string;
  members: string[];
}

export function normPlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

const MUNICIPIOS: GeoCenter[] = [
  { name: "Almaguer", lat: 1.9153, lng: -76.8556 },
  { name: "Argelia", lat: 2.2558, lng: -77.2481 },
  { name: "Balboa", lat: 2.0406, lng: -77.2164 },
  { name: "Bolívar", lat: 1.8347, lng: -76.9683 },
  { name: "Buenos Aires", lat: 3.0153, lng: -76.6417 },
  { name: "Cajibío", lat: 2.6231, lng: -76.5731 },
  { name: "Caldono", lat: 2.7975, lng: -76.5431 },
  { name: "Caloto", lat: 3.0358, lng: -76.4078 },
  { name: "Corinto", lat: 3.1742, lng: -76.2611 },
  { name: "El Tambo", lat: 2.452, lng: -76.8103 },
  { name: "Florencia", lat: 1.6828, lng: -77.0731 },
  { name: "Guachené", lat: 3.1342, lng: -76.3928 },
  { name: "Guapi", lat: 2.5703, lng: -77.8856 },
  { name: "Inzá", lat: 2.5503, lng: -76.0669 },
  { name: "Jambaló", lat: 2.7778, lng: -76.325 },
  { name: "La Sierra", lat: 2.1961, lng: -76.7631 },
  { name: "La Vega", lat: 2.0006, lng: -76.7786 },
  { name: "López de Micay", lat: 2.8467, lng: -77.25 },
  { name: "Mercaderes", lat: 1.8014, lng: -77.1667 },
  { name: "Miranda", lat: 3.2525, lng: -76.2289 },
  { name: "Morales", lat: 2.7594, lng: -76.6269 },
  { name: "Padilla", lat: 3.2203, lng: -76.3136 },
  { name: "Páez", lat: 2.6078, lng: -75.9778 },
  { name: "Patía", lat: 2.1169, lng: -76.9831 },
  { name: "Piendamó-Tunía", lat: 2.6408, lng: -76.5314 },
  { name: "Piamonte", lat: 1.1158, lng: -76.3264 },
  { name: "Popayán", lat: 2.4448, lng: -76.6147 },
  { name: "Puerto Tejada", lat: 3.2314, lng: -76.4169 },
  { name: "Puracé", lat: 2.3417, lng: -76.4944 },
  { name: "Rosas", lat: 2.2619, lng: -76.7464 },
  { name: "San Sebastián", lat: 1.8386, lng: -76.7714 },
  { name: "Santander de Quilichao", lat: 3.0094, lng: -76.4847 },
  { name: "Santa Rosa", lat: 1.5731, lng: -76.5736 },
  { name: "Silvia", lat: 2.6108, lng: -76.3781 },
  { name: "Sotará", lat: 2.2486, lng: -76.6164 },
  { name: "Suárez", lat: 2.9539, lng: -76.6964 },
  { name: "Sucre", lat: 2.0381, lng: -76.925 },
  { name: "Timbío", lat: 2.3528, lng: -76.6836 },
  { name: "Timbiquí", lat: 2.7717, lng: -77.665 },
  { name: "Toribío", lat: 3.0092, lng: -76.2667 },
  { name: "Totoró", lat: 2.5119, lng: -76.3253 },
  { name: "Villa Rica", lat: 3.1806, lng: -76.4639 },
];

const MUNICIPIO_ALIASES: Record<string, string> = {
  PIENDAMO: "PIENDAMOTUNIA",
  TUNIA: "PIENDAMOTUNIA",
  PIENDAMOTUNIA: "PIENDAMOTUNIA",
  SANTANDER: "SANTANDERDEQUILICHAO",
  SANTANDERQUILICHAO: "SANTANDERDEQUILICHAO",
  ELBORDO: "PATIA",
  PATIAELBORDO: "PATIA",
  BELALCAZAR: "PAEZ",
  PAEZBELALCAZAR: "PAEZ",
  PAISPAMBA: "SOTARA",
  SOTARAPAISPAMBA: "SOTARA",
  COCONUCO: "PURACE",
  PURACECOCONUCO: "PURACE",
  LOPEZ: "LOPEZDEMICAY",
  LOPEZMICAY: "LOPEZDEMICAY",
  VILLARICA: "VILLARICA",
  SANSEBASTIAN: "SANSEBASTIAN",
};

const NUCLEO_DEFS: Array<{ code: string; label: string; members: string[]; lat?: number; lng?: number }> = [
  { code: "ZC_N1", label: "Popayán - Puracé", members: ["Popayán", "Puracé"] },
  { code: "ZC_N2", label: "Tambo - Timbío - Sotará", members: ["El Tambo", "Timbío", "Sotará"] },
  { code: "ZC_N3", label: "Jambaló - Silvia - Totoró", members: ["Jambaló", "Silvia", "Totoró"] },
  { code: "ZC_N4", label: "Cajibío - Morales - Piendamó", members: ["Cajibío", "Morales", "Piendamó-Tunía"] },
  { code: "ZC_N5", label: "Inzá - Páez", members: ["Inzá", "Páez"] },
  {
    code: "ZC_N6",
    label: "Villalobos",
    members: ["Santa Rosa"],
    lat: 1.4975,
    lng: -76.3756,
  },
  { code: "ZN_N1", label: "Santander de Quilichao", members: ["Santander de Quilichao"] },
  { code: "ZN_N2", label: "Caldono", members: ["Caldono"] },
  { code: "ZN_N3", label: "Buenos Aires - Suárez", members: ["Buenos Aires", "Suárez"] },
  { code: "ZN_N4", label: "Corinto - Miranda", members: ["Corinto", "Miranda"] },
  { code: "ZN_N5", label: "Toribío", members: ["Toribío"] },
  {
    code: "ZN_N6",
    label: "Caloto - Guachené - Padilla - Puerto Tejada - Villa Rica",
    members: ["Caloto", "Guachené", "Padilla", "Puerto Tejada", "Villa Rica"],
  },
  { code: "ZS_N1", label: "Patía - Sucre", members: ["Patía", "Sucre"] },
  { code: "ZS_N2", label: "Almaguer - La Vega", members: ["Almaguer", "La Vega"] },
  { code: "ZS_N3", label: "Argelia - Balboa", members: ["Argelia", "Balboa"] },
  { code: "ZS_N4", label: "Bolívar - Santa Rosa - San Sebastián", members: ["Bolívar", "San Sebastián"] },
  { code: "ZS_N5", label: "La Sierra - Rosas", members: ["La Sierra", "Rosas"] },
  { code: "ZS_N6", label: "Florencia - Mercaderes", members: ["Florencia", "Mercaderes"] },
];

const municipioByKey = new Map<string, GeoCenter>();
for (const item of MUNICIPIOS) {
  municipioByKey.set(normPlace(item.name), item);
}
for (const [alias, canonical] of Object.entries(MUNICIPIO_ALIASES)) {
  const center = municipioByKey.get(canonical);
  if (center) municipioByKey.set(alias, center);
}

function centroid(members: string[]): GeoCenter | null {
  const pts = members
    .map((name) => lookupMunicipio(name))
    .filter((item): item is GeoCenter => Boolean(item));
  if (!pts.length) return null;
  return {
    name: members.join(" - "),
    lat: pts.reduce((sum, item) => sum + item.lat, 0) / pts.length,
    lng: pts.reduce((sum, item) => sum + item.lng, 0) / pts.length,
  };
}

export const NUCLEOS: NucleoCenter[] = NUCLEO_DEFS.map((def) => {
  const mid = def.lat != null && def.lng != null ? { lat: def.lat, lng: def.lng } : centroid(def.members);
  return {
    code: def.code,
    name: def.code,
    label: def.label,
    members: def.members,
    lat: mid?.lat ?? 2.45,
    lng: mid?.lng ?? -76.61,
  };
});

const nucleoByKey = new Map<string, NucleoCenter>();
for (const item of NUCLEOS) {
  nucleoByKey.set(normPlace(item.code), item);
  nucleoByKey.set(normPlace(item.label), item);
}

export function lookupMunicipio(name: string): GeoCenter | null {
  const key = normPlace(name);
  if (!key) return null;
  const direct = municipioByKey.get(key);
  if (direct) return direct;
  const aliased = MUNICIPIO_ALIASES[key];
  if (aliased) return municipioByKey.get(aliased) ?? null;
  for (const [k, center] of municipioByKey) {
    if (k.includes(key) || key.includes(k)) return center;
  }
  return null;
}

export function lookupNucleo(name: string): NucleoCenter | null {
  const key = normPlace(name);
  if (!key) return null;
  return nucleoByKey.get(key) ?? nucleoByKey.get(key.replace(/NUCLEO/g, "")) ?? null;
}

export const CAUCA_CENTER = { lat: 2.45, lng: -76.61 };
