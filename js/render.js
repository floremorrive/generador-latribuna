// ===== Motor de render en canvas (1080 x 1350) =====
const W = 1080, H = 1350;

const COLORS = {
  dark:   "#272624",
  gold:   "#C6A465",
  cream:  "#FAF4F2",
  terra:  "#914135",
  terra2: "#8A3D33",
  paper:  "#ECE6E0",
  grayTx: "#4a4744"
};

// --- carga de assets compartidos ---
const ASSETS = {};
function loadImg(src){
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
async function initAssets(){
  const base = "assets/img/";
  const [grano, grunge, logo, ltmono] = await Promise.all([
    loadImg(base + "fx-grano.png"),
    loadImg(base + "fx-grunge.png"),
    loadImg(base + "logo-latribuna-white-trim.png"),
    loadImg(base + "logo-lt-monograma.png")
  ]);
  ASSETS.grano = grano; ASSETS.grunge = grunge; ASSETS.logo = logo; ASSETS.ltmono = ltmono;
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
}

// --- helpers ---
function drawCover(ctx, img, x, y, w, h, t){
  t = t || { zoom: 1, dx: 0, dy: 0 };
  const scale = Math.max(w / img.width, h / img.height) * (t.zoom || 1);
  const dw = img.width * scale, dh = img.height * scale;
  const ox = x + (w - dw) / 2 + (t.dx || 0);
  const oy = y + (h - dh) / 2 + (t.dy || 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, ox, oy, dw, dh);
  ctx.restore();
}
// Tratamiento de foto: blanco y negro + filtro de color opcional + grano.
// opts = { tintPct 0..1, tint '#hex', grainOp, grungeOp }
function duotone(ctx, x, y, w, h, opts){
  opts = opts || {};
  const tintPct = opts.tintPct != null ? opts.tintPct : 0.25;
  const grainOp = opts.grainOp != null ? opts.grainOp : 0.28;
  const grungeOp = opts.grungeOp != null ? opts.grungeOp : 0;
  const tint = opts.tint || "#9C5A4E";
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  // 1) blanco y negro
  ctx.globalCompositeOperation = "saturation";
  ctx.fillStyle = "hsl(0,0%,50%)"; ctx.fillRect(x, y, w, h);
  // 2) filtro de color con blend 'color' (mantiene el brillo)
  if (tintPct > 0){
    ctx.globalCompositeOperation = "color";
    ctx.globalAlpha = tintPct; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h);
  }
  // 3) aclarar (high-key: imagen más blanca)
  if (opts.brighten){
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = opts.brighten; ctx.fillStyle = "#FFFFFF"; ctx.fillRect(x, y, w, h);
  }
  // 4) grano: micro procedural (puntos aleatorios, sin rayas) o textura estándar
  ctx.globalCompositeOperation = "source-over";
  if (grainOp > 0){
    if (opts.micro){
      ctx.globalAlpha = grainOp;
      ctx.drawImage(getMicroNoise(), x, y, w, h, x, y, w, h);
    } else {
      ctx.globalAlpha = grainOp; ctx.drawImage(ASSETS.grano, x, y, w, h);
    }
  }
  if (grungeOp > 0){ ctx.globalAlpha = grungeOp; ctx.drawImage(ASSETS.grunge, x, y, w, h); }
  ctx.restore();
}

// Ruido micro procedural (puntos claros y oscuros aleatorios, 1px). Se genera una vez.
let _microNoise = null;
function getMicroNoise(){
  if (_microNoise) return _microNoise;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"); const im = g.createImageData(W, H); const d = im.data;
  for (let i = 0; i < d.length; i += 4){
    const r = Math.random();
    if (r < 0.28){ d[i] = d[i+1] = d[i+2] = 0; d[i+3] = Math.random() * 255; }        // punto oscuro
    else if (r > 0.72){ d[i] = d[i+1] = d[i+2] = 255; d[i+3] = Math.random() * 255; } // punto claro
    else d[i+3] = 0;
  }
  g.putImageData(im, 0, 0); _microNoise = c; return c;
}

// Grano visible sobre la foto (para todas las plantillas, incluidas las de foto a color)
function photoGrain(ctx, x, y, w, h, op){
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = op != null ? op : 0.25;
  ctx.drawImage(getMicroNoise(), x, y, w, h, x, y, w, h);
  ctx.restore();
}
function diagonalWeave(ctx, alpha, spacing, dark){
  ctx.save();
  ctx.strokeStyle = "rgba(" + (dark ? "0,0,0" : "255,255,255") + "," + alpha + ")";
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += (spacing || 4)){
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }
  ctx.restore();
}
function textureOverlays(ctx, granoOp, grungeOp){
  ctx.save();
  ctx.globalAlpha = granoOp; ctx.drawImage(ASSETS.grano, 0, 0, W, H);
  ctx.globalAlpha = grungeOp; ctx.drawImage(ASSETS.grunge, 0, 0, W, H);
  ctx.restore();
}
// Intensidad global del ruido (multiplicador). Ajustable para toda la app.
const FX = { grano: 0.11, grunge: 0.1, weave: 0.14 };
function wrap(ctx, text, maxW){
  const words = (text || "").split(/\s+/);
  const lines = []; let line = "";
  for (const wd of words){
    const test = line ? line + " " + wd : wd;
    if (ctx.measureText(test).width > maxW && line){ lines.push(line); line = wd; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function paragraph(ctx, text, x, y, maxW, font, color, lh, align){
  ctx.save();
  ctx.font = font; ctx.fillStyle = color;
  ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
  const lines = wrap(ctx, text, maxW);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
  ctx.restore();
  return y + lines.length * lh; // baseline y final
}
function tintedLogo(color){
  // devuelve un canvas con el logo blanco recoloreado a `color`
  const c = document.createElement("canvas");
  c.width = ASSETS.logo.width; c.height = ASSETS.logo.height;
  const g = c.getContext("2d");
  g.drawImage(ASSETS.logo, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function drawLogo(ctx, colorVariant, lw, ly){
  lw = lw || 214;
  ly = ly || 1196;
  const src = (colorVariant === "white") ? ASSETS.logo : tintedLogo(colorVariant);
  const lh = src.height * lw / src.width;
  const lx = W - 44 - lw;
  ctx.drawImage(src, lx, ly, lw, lh);
  const lemaCol = (colorVariant === "white") ? COLORS.cream : colorVariant;
  ctx.save();
  ctx.font = "500 " + Math.round(11 * lw / 214) + "px 'M PLUS 1p'";
  ctx.fillStyle = lemaCol; ctx.textAlign = "center";
  drawSpaced(ctx, "En defensa de Colombia", lx + lw / 2, ly + lh + 16, 1.5 * lw / 214);
  ctx.restore();
}
function drawSpaced(ctx, text, cx, y, ls){
  const widths = [...text].map(ch => ctx.measureText(ch).width + ls);
  const total = widths.reduce((a, b) => a + b, 0) - ls;
  let x = cx - total / 2;
  ctx.textAlign = "left";
  for (let i = 0; i < text.length; i++){ ctx.fillText(text[i], x, y); x += widths[i]; }
}
function drawBadge(ctx, cfg, text){
  ctx.save();
  ctx.font = "700 " + cfg.size + "px 'Inter Tight'";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const padx = 20, pady = 11;
  const tw = m.width, th = asc + desc;
  const boxH = th + pady * 2, boxW = tw + padx * 2;
  const y = cfg.y;
  // barra de ancho completo (badge tipo banner); texto centrado en alto y ancho
  if (cfg.bar){
    const barH = cfg.barH || boxH;
    ctx.fillStyle = cfg.bg; ctx.fillRect(0, y, W, barH);
    ctx.fillStyle = cfg.text; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, W / 2, y + barH / 2);
    ctx.restore(); return;
  }
  const x = cfg.center ? (W - boxW) / 2 : cfg.x;
  // línea que se extiende a la derecha (se dibuja primero, el badge la tapa a la izquierda)
  if (cfg.line){
    const th2 = cfg.line.thickness || 8;
    const fromX = cfg.line.fromX != null ? cfg.line.fromX : x;
    const ly = cfg.line.atBottom ? (y + boxH) : (y + boxH / 2);
    ctx.fillStyle = cfg.line.color || cfg.bg;
    ctx.fillRect(fromX, ly - th2 / 2, cfg.line.toX - fromX, th2);
  }
  if (cfg.style === "fill"){
    ctx.fillStyle = cfg.bg; ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = cfg.text;
  } else {
    ctx.strokeStyle = cfg.bg; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxW, boxH);
    ctx.fillStyle = cfg.text;
  }
  ctx.fillText(text, x + padx, y + pady + asc);
  ctx.restore();
}

// ===== Plantilla estándar (foto arriba + bloque de texto) =====
function renderStandard(ctx, cfg, data){
  // fondo (color plano o gradiente vertical)
  if (cfg.bgGradient){
    const gr = ctx.createLinearGradient(0, cfg.bgGradient.y0 || 0, 0, cfg.bgGradient.y1 || H);
    gr.addColorStop(0, cfg.bgGradient.top); gr.addColorStop(1, cfg.bgGradient.bottom);
    ctx.fillStyle = gr;
  } else ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, W, H);
  if (cfg.paperEdges){ ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, W, cfg.photo.h + cfg.photo.y); }
  diagonalWeave(ctx, (cfg.weaveAlpha != null ? cfg.weaveAlpha : 0.02) * FX.weave, 4, cfg.weaveDark);
  // marco/fondo oscuro detrás de la foto (los bordes se ven como marco)
  if (cfg.photoBacking){
    ctx.fillStyle = cfg.photoBacking;
    ctx.fillRect(0, 0, W, cfg.photo.y + cfg.photo.h);
  }
  // foto
  if (data.photo) drawCover(ctx, data.photo, cfg.photo.x, cfg.photo.y, cfg.photo.w, cfg.photo.h, data.photoTransform);
  else { ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(cfg.photo.x, cfg.photo.y, cfg.photo.w, cfg.photo.h); }
  // tratamiento de foto (B&N / filtro / grano)
  if (cfg.duotone) duotone(ctx, cfg.photo.x, cfg.photo.y, cfg.photo.w, cfg.photo.h,
                           cfg.duotone === true ? {} : cfg.duotone);
  else if (data.photo) photoGrain(ctx, cfg.photo.x, cfg.photo.y, cfg.photo.w, cfg.photo.h, cfg.photoGrain);
  // texturas
  textureOverlays(ctx, (cfg.granoOp != null ? cfg.granoOp : 0.5) * FX.grano,
                       (cfg.grungeOp != null ? cfg.grungeOp : 0.4) * FX.grunge);
  // linea de acento
  if (cfg.accent){ ctx.fillStyle = cfg.accent.color;
    ctx.fillRect(cfg.accent.x, cfg.accent.y, cfg.accent.w, cfg.accent.h); }
  // badge
  drawBadge(ctx, cfg.badge, data.badge);
  // titulo
  const tFont = "700 " + cfg.title.size + "px 'Rajdhani'";
  paragraph(ctx, data.titulo, cfg.title.x, cfg.title.y, cfg.title.w, tFont, cfg.title.color,
            cfg.title.size * 1.02);
  // descripcion
  paragraph(ctx, data.descripcion, cfg.desc.x, cfg.desc.y, cfg.desc.w,
            "400 " + cfg.desc.size + "px 'Inter Tight'", cfg.desc.color, cfg.desc.size * 1.2);
  // logo
  drawLogo(ctx, cfg.logo);
}

// ===== Configuraciones por plantilla =====
const TEMPLATES = {
  "pasa-mundo": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.dark, weaveAlpha: 0.02,
    photo: { x: 31, y: 0, w: 1021, h: 690 },
    accent: { x: 100, y: 742, w: 9, h: 262, color: COLORS.gold },
    badge: { x: 96, y: 1225, style: "border", bg: COLORS.gold, text: COLORS.gold, size: 28 },
    title: { x: 146, y: 862, w: 850, size: 54, color: COLORS.cream },
    desc:  { x: 154, y: 1040, w: 700, size: 36, color: COLORS.gold },
    logo: "white"
  }, d),

  "pasa-mundo-claro": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.paper, weaveAlpha: 0.03,
    photoBacking: COLORS.dark,
    photo: { x: 35, y: 0, w: 1010, h: 700 },
    badge: { x: 60, y: 735, style: "fill", bg: COLORS.gold, text: COLORS.dark, size: 34,
             line: { toX: 1020, thickness: 10, color: COLORS.gold } },
    title: { x: 63, y: 875, w: 963, size: 60, color: COLORS.dark },
    desc:  { x: 78, y: 1055, w: 909, size: 40, color: COLORS.grayTx },
    logo: COLORS.terra
  }, d),

  // ===== Genéricas (CATEGORIA) — 6 combinaciones [Fondo]-[Acento] =====
  "gen-blanca-dorado": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.paper, weaveAlpha: 0.03, photoBacking: COLORS.dark,
    photo: { x: 35, y: 0, w: 1010, h: 700 },
    // badge a caballo sobre el borde de la foto: mitad sobre la imagen, mitad en el hueco; la línea va al pie del badge
    badge: { center: true, y: 674, style: "fill", bg: COLORS.gold, text: COLORS.dark, size: 34,
             line: { fromX: 60, toX: 1020, thickness: 10, color: COLORS.gold, atBottom: true } },
    title: { x: 63, y: 885, w: 963, size: 60, color: COLORS.dark },
    desc:  { x: 78, y: 1065, w: 909, size: 40, color: COLORS.grayTx },
    logo: COLORS.dark
  }, d),

  "gen-dorado-negro": (ctx, d) => renderStandard(ctx, {
    bg: "#C4A76A", weaveAlpha: 0.025, paperEdges: true,
    photo: { x: 60, y: 60, w: 960, h: 610 },
    badge: { x: 70, y: 700, style: "fill", bg: COLORS.dark, text: "#C4A76A", size: 34,
             line: { toX: 1020, thickness: 10, color: COLORS.dark } },
    title: { x: 70, y: 855, w: 950, size: 60, color: COLORS.dark },
    desc:  { x: 78, y: 1035, w: 900, size: 40, color: "#33302c" },
    logo: COLORS.dark
  }, d),

  "gen-blanco-terracota": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.paper, weaveAlpha: 0.03, photoBacking: COLORS.terra,
    photo: { x: 35, y: 30, w: 1010, h: 665 },
    accent: { x: 100, y: 790, w: 8, h: 225, color: COLORS.terra },
    badge: { center: true, y: 672, style: "fill", bg: COLORS.terra, text: "#FFFFFF", size: 34 },
    title: { x: 146, y: 875, w: 880, size: 60, color: COLORS.dark },
    desc:  { x: 154, y: 1055, w: 850, size: 40, color: COLORS.terra },
    logo: COLORS.terra
  }, d),

  "gen-terracota-blanco": (ctx, d) => renderStandard(ctx, {
    bg: "#9E5749", weaveAlpha: 0.5, weaveDark: true, paperEdges: true,
    photo: { x: 56, y: 0, w: 968, h: 700 },
    badge: { x: 59, y: 706, style: "fill", bg: "#FFFFFF", text: "#9E5749", size: 32,
             line: { toX: 1020, thickness: 10, color: "#FFFFFF" } },
    title: { x: 70, y: 860, w: 954, size: 60, color: COLORS.cream },
    desc:  { x: 78, y: 1040, w: 900, size: 40, color: COLORS.cream },
    granoOp: 3, grungeOp: 3.2,          // ruido notorio pero un poco más transparente
    logo: "white"
  }, d),

  "gen-negro-blanco": (ctx, d) => renderStandard(ctx, {
    bg: "#2B2926", weaveAlpha: 0.4,
    photo: { x: 0, y: 0, w: 1080, h: 685 },
    // B&N high-key (más blanca) + grano micro procedural
    duotone: { tintPct: 0, brighten: 0.3, grainOp: 0.5, micro: true },
    badge: { bar: true, y: 685, barH: 82, style: "fill", bg: "#A65C50", text: "#FFFFFF", size: 34 },
    title: { x: 70, y: 915, w: 950, size: 60, color: COLORS.cream },
    desc:  { x: 78, y: 1090, w: 900, size: 40, color: "#C9C4BF" },
    logo: COLORS.terra
  }, d),

  "gen-terracota": (ctx, d) => renderStandard(ctx, {
    bgGradient: { top: "#814C44", bottom: "#69352E", y0: 690, y1: 1350 },
    weaveAlpha: 0.5, weaveDark: true,
    photo: { x: 0, y: 0, w: 1080, h: 690 },
    duotone: { tintPct: 0.6, tint: "#9C3F34", grainOp: 0.45, grungeOp: 0.2 },   // filtro rojo + ruido
    badge: { x: 107, y: 1232, style: "border", bg: COLORS.cream, text: COLORS.cream, size: 28 },
    title: { x: 125, y: 800, w: 901, size: 60, color: COLORS.cream },
    desc:  { x: 125, y: 1050, w: 829, size: 40, color: COLORS.cream },
    logo: "white"
  }, d),

  "generica": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.terra, weaveAlpha: 0.03, paperEdges: true,
    photo: { x: 56, y: 0, w: 968, h: 722 },
    badge: { x: 59, y: 752, style: "fill", bg: "#FFFFFF", text: COLORS.terra, size: 30 },
    title: { x: 70, y: 890, w: 954, size: 60, color: COLORS.cream },
    desc:  { x: 78, y: 1085, w: 900, size: 40, color: COLORS.cream },
    logo: "white"
  }, d),

  "especiales-terracota": (ctx, d) => renderStandard(ctx, {
    bgGradient: { top: "#814C44", bottom: "#69352E", y0: 690, y1: 1350 },
    weaveAlpha: 0.5, weaveDark: true,
    photo: { x: 0, y: 0, w: 1080, h: 690 }, duotone: { tintPct: 0.25, grainOp: 0.28 },
    accent: { x: 108, y: 735, w: 8, h: 250, color: COLORS.dark },
    badge: { x: 107, y: 1232, style: "border", bg: COLORS.cream, text: COLORS.cream, size: 28 },
    title: { x: 125, y: 800, w: 901, size: 60, color: COLORS.cream },
    desc:  { x: 125, y: 1050, w: 829, size: 40, color: COLORS.cream },
    logo: "white"
  }, d),

  "especiales-claro": (ctx, d) => renderStandard(ctx, {
    bg: COLORS.paper, weaveAlpha: 0.03,
    photoBacking: COLORS.dark,
    photo: { x: 35, y: 0, w: 1010, h: 700 },
    badge: { x: 60, y: 735, style: "fill", bg: COLORS.gold, text: COLORS.dark, size: 34,
             line: { toX: 1020, thickness: 10, color: COLORS.gold } },
    title: { x: 63, y: 875, w: 963, size: 60, color: COLORS.dark },
    desc:  { x: 78, y: 1055, w: 909, size: 40, color: COLORS.grayTx },
    logo: COLORS.terra
  }, d),

  "que-pasa-claro": (ctx, d) => renderQuePasaClaro(ctx, d),
  "que-pasa-dorado": (ctx, d) => renderQuePasaDorado(ctx, d),
  "portada": (ctx, d) => renderPortada(ctx, d),
  "cierre": (ctx, d) => renderCierre(ctx, d)
};

// Párrafo con palabras resaltadas (negrita + color). `highlights` = lista de frases.
function richParagraph(ctx, text, x, y, maxW, size, weight, color, lh, highlights, hiColor){
  highlights = highlights || [];
  const norm = s => s.toLowerCase().replace(/[^0-9a-záéíóúñü]/gi, "");
  const words = (text || "").split(/\s+/).filter(Boolean);
  const low = words.map(norm);
  const hi = new Array(words.length).fill(false);
  highlights.forEach(phrase => {
    const pw = phrase.split(/\s+/).map(norm).filter(Boolean);
    if (!pw.length) return;
    for (let i = 0; i <= words.length - pw.length; i++){
      let ok = true;
      for (let j = 0; j < pw.length; j++) if (low[i + j] !== pw[j]) { ok = false; break; }
      if (ok) for (let j = 0; j < pw.length; j++) hi[i + j] = true;
    }
  });
  ctx.save(); ctx.textBaseline = "alphabetic";
  ctx.font = weight + " " + size + "px 'Inter Tight'";
  const sp = ctx.measureText(" ").width;
  let cx = x, cy = y;
  for (let i = 0; i < words.length; i++){
    const bold = hi[i];
    ctx.font = (bold ? 700 : weight) + " " + size + "px 'Inter Tight'";
    const ww = ctx.measureText(words[i]).width;
    if (cx > x && cx + ww > x + maxW){ cx = x; cy += lh; }
    ctx.fillStyle = bold ? hiColor : color;
    ctx.fillText(words[i], cx, cy);
    cx += ww + sp;
  }
  ctx.restore();
  return cy;
}

// ===== "¿Qué está pasando?" — CLARA (barra superior + banda + párrafos) =====
function renderQuePasaClaro(ctx, d){
  ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, W, H);
  // barra superior terracota con línea
  ctx.fillStyle = COLORS.terra; ctx.fillRect(0, 0, W, 70);
  ctx.strokeStyle = COLORS.cream; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(95, 40); ctx.lineTo(985, 40); ctx.stroke();
  // foto
  if (d.photo){ drawCover(ctx, d.photo, 0, 70, W, 610, d.photoTransform); photoGrain(ctx, 0, 70, W, 610); }
  // banda oscura
  ctx.fillStyle = "#3a3735"; ctx.fillRect(0, 680, W, 140);
  // puntos "..."
  ctx.fillStyle = COLORS.cream;
  for (let k = 0; k < 3; k++){ ctx.beginPath(); ctx.arc(975 + k * 24, 720, 6, 0, 7); ctx.fill(); }
  textureOverlays(ctx, 0.5 * FX.grano, 0.5 * FX.grunge);
  drawBadge(ctx, { center: true, y: 723, style: "fill", bg: COLORS.terra, text: "#FFFFFF", size: 32 }, d.badge);
  // párrafo principal (negrita) + secundario, con nombres resaltados
  const hl = d.highlights || [];
  const endLead = richParagraph(ctx, d.titulo, 70, 910, 950, 46, 700, COLORS.dark, 58, hl, COLORS.terra);
  richParagraph(ctx, d.descripcion, 70, endLead + 78, 950, 39, 400, COLORS.grayTx, 50, hl, COLORS.terra);
  drawLogo(ctx, COLORS.terra);
}

// ===== "¿Qué está pasando?" — DORADA (bordes de papel + zona dorada + título/desc) =====
function renderQuePasaDorado(ctx, d){
  ctx.fillStyle = COLORS.paper; ctx.fillRect(0, 0, W, H);
  const gold = "#C2A063";
  ctx.fillStyle = gold; ctx.fillRect(0, 670, W, H - 670);
  diagonalWeave(ctx, 0.02 * FX.weave, 4);
  if (d.photo){ drawCover(ctx, d.photo, 60, 60, 960, 610, d.photoTransform); photoGrain(ctx, 60, 60, 960, 610); }
  textureOverlays(ctx, 0.5 * FX.grano, 0.5 * FX.grunge);
  drawBadge(ctx, { x: 70, y: 700, style: "fill", bg: COLORS.dark, text: gold, size: 32,
                   line: { toX: 1020, thickness: 10, color: COLORS.dark } }, d.badge);
  paragraph(ctx, d.titulo, 70, 860, 950, "700 60px 'Rajdhani'", COLORS.dark, 62);
  paragraph(ctx, d.descripcion, 78, 1040, 900, "400 40px 'Inter Tight'", "#33302c", 48);
  drawLogo(ctx, COLORS.dark);
}

// ===== Plantillas solo texto =====
// Portada: fondo oscuro, título grande, badge, logo grande
function renderPortada(ctx, d){
  ctx.fillStyle = COLORS.dark; ctx.fillRect(0, 0, W, H);
  diagonalWeave(ctx, 0.02 * FX.weave, 4);
  textureOverlays(ctx, 0.5 * FX.grano, 0.4 * FX.grunge);
  paragraph(ctx, d.titulo, 108, 640, 880, "500 66px 'Inter Tight'", COLORS.cream, 80);
  drawBadge(ctx, { x: 90, y: 1236, style: "fill", bg: "#F2EDEA", text: COLORS.dark, size: 30 }, d.badge);
  drawLogo(ctx, "white", 330, 1150);
}

// Cierre / contraportada: fondo terracota, monograma LT, descripción, autor, web
function renderCierre(ctx, d){
  ctx.fillStyle = "#8A4A3E"; ctx.fillRect(0, 0, W, H);
  diagonalWeave(ctx, 0.5 * FX.weave, 4, true);
  textureOverlays(ctx, 0.5 * FX.grano, 0.4 * FX.grunge);
  // monograma LT arriba-izquierda
  const lw = 210, lh = ASSETS.ltmono.height * lw / ASSETS.ltmono.width;
  ctx.drawImage(ASSETS.ltmono, 108, 150, lw, lh);
  // badge
  drawBadge(ctx, { x: 108, y: 590, style: "fill", bg: "#F2EDEA", text: "#8A4A3E", size: 28 }, d.badge);
  // descripción grande + autor
  paragraph(ctx, d.descripcion, 108, 720, 880, "400 60px 'Inter Tight'", COLORS.cream, 74);
  paragraph(ctx, d.autor || "Autor", 108, 1010, 880, "400 40px 'Inter Tight'", COLORS.cream, 48);
  // web centrado abajo
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = COLORS.cream;
  ctx.font = "700 34px 'Inter Tight'";
  ctx.fillText("www.latribunacolombia.co", W / 2, 1300);
  ctx.restore();
}

// ===== API principal =====
async function renderTemplate(canvas, templateId, data){
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  const fn = TEMPLATES[templateId] || TEMPLATES["generica"];
  fn(ctx, data);
}
