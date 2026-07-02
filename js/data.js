// ===== Datos de categorías y plantillas de La Tribuna =====
// Cada "sección" define qué plantilla(s) de diseño usa.
// El badge muestra el nombre indicado (nunca "Temas").

// Subcategorías del grupo "Temas" (el badge muestra el nombre elegido)
const TEMAS = [
  "Agro", "Arte y Cultura", "Economía", "Educación", "Industria",
  "Magisterio", "Medio ambiente", "Minería", "Mujeres", "Salud",
  "Servicios públicos", "Mercado Laboral", "Trabajadores", "Género",
  "Petróleo", "Ciencia y Tecnología", "Pensiones", "Historia", "Energía"
];

// Variantes genéricas (CATEGORIA) — 6 combinaciones [Fondo]-[Acento] (3 más por llegar)
const GENERICAS = ["gen-blanca-dorado", "gen-dorado-negro", "gen-blanco-terracota",
                   "gen-terracota-blanco", "gen-negro-blanco", "gen-terracota"];

// Secciones. `plantillas` = ids de diseños disponibles (si hay varias, se puede elegir).
// `badge` fijo, salvo en "temas" donde lo define la subcategoría.
const CATEGORIAS = [
  { id: "pasa-mundo",    nombre: "Pasa en el mundo",   badge: "PASA EN EL MUNDO",   plantillas: ["pasa-mundo", "pasa-mundo-claro"] },
  { id: "que-pasa",      nombre: "¿Qué está pasando?", badge: "¿QUÉ ESTÁ PASANDO?", plantillas: ["que-pasa-claro", "que-pasa-dorado"] },
  { id: "especiales",    nombre: "Especiales",         badge: "ESPECIALES",         plantillas: ["especiales-claro", "especiales-terracota"] },
  { id: "pasa-regiones", nombre: "Pasa en las regiones", badge: "PASA EN LAS REGIONES", plantillas: GENERICAS },
  { id: "pura-paja",     nombre: "Pura paja",          badge: "PURA PAJA",          plantillas: GENERICAS },
  { id: "le-pasa-mujeres", nombre: "Le pasa a las Mujeres", badge: "LE PASA A LAS MUJERES", plantillas: GENERICAS },
  { id: "temas",         nombre: "Temas",              badge: null,                 plantillas: GENERICAS, esTemas: true },
  { id: "portada",       nombre: "Portada (solo texto)", badge: null,               plantillas: ["portada"], esTexto: true },
  { id: "cierre",        nombre: "Cierre (solo texto)",  badge: null,               plantillas: ["cierre"], esTexto: true, esCierre: true }
];

// Nombres legibles de cada plantilla de diseño (para el selector de plantilla)
const PLANTILLAS_LABEL = {
  "pasa-mundo": "Oscura",
  "pasa-mundo-claro": "Clara",
  "que-pasa-claro": "Clara",
  "que-pasa-dorado": "Dorada",
  "especiales-claro": "Claro",
  "especiales-terracota": "Terracota",
  "generica": "Terracota · foto arriba",
  "gen-blanca-dorado": "Blanca-Dorado",
  "gen-dorado-negro": "Dorado-Negro",
  "gen-blanco-terracota": "Blanco-Terracota",
  "gen-terracota-blanco": "Terracota-Blanco",
  "gen-negro-blanco": "Negro-Blanco",
  "gen-terracota": "Terracota",
  "portada": "Portada",
  "cierre": "Cierre"
};
