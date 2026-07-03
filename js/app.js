// ===== Lógica de la interfaz =====
const $ = id => document.getElementById(id);

const state = {
  categoria: CATEGORIAS[0],
  subcategoria: TEMAS[0],
  plantilla: CATEGORIAS[0].plantillas[0],
  photo: null,
  photoTransform: { zoom: 1, dx: 0, dy: 0 },
  red: "ig"
};

// --- poblar selects ---
function fillSelect(sel, items, getVal, getLabel){
  sel.innerHTML = "";
  items.forEach(it => {
    const o = document.createElement("option");
    o.value = getVal(it); o.textContent = getLabel(it);
    sel.appendChild(o);
  });
}
fillSelect($("categoria"), CATEGORIAS, c => c.id, c => c.nombre);
fillSelect($("subcategoria"), TEMAS, t => t, t => t);

function currentBadge(){
  if (state.categoria.esTexto) return ($("badgetext").value || "CATEGORIA").toUpperCase();
  if (state.categoria.esTemas) return state.subcategoria.toUpperCase();
  return state.categoria.badge;
}
function refreshPlantillas(){
  const plns = state.categoria.plantillas;
  const wrap = $("wrap-plantilla");
  if (plns.length > 1){
    wrap.hidden = false;
    fillSelect($("plantilla"), plns, p => p, p => PLANTILLAS_LABEL[p] || p);
    state.plantilla = plns[0];
  } else {
    wrap.hidden = true;
    state.plantilla = plns[0];
  }
}

// --- eventos ---
$("categoria").addEventListener("change", e => {
  state.categoria = CATEGORIAS.find(c => c.id === e.target.value);
  $("wrap-subcat").hidden = !state.categoria.esTemas;
  $("wrap-highlights").hidden = state.categoria.id !== "que-pasa";
  $("wrap-badgetext").hidden = !state.categoria.esTexto;
  $("wrap-autor").hidden = !state.categoria.esCierre;
  document.querySelector(".foto-box").hidden = !!state.categoria.esTexto;
  if (state.categoria.esTemas) state.subcategoria = $("subcategoria").value;
  refreshPlantillas();
  render();
});
$("highlights").addEventListener("input", render);
$("badgetext").addEventListener("input", render);
$("autor").addEventListener("input", render);
$("subcategoria").addEventListener("change", e => { state.subcategoria = e.target.value; render(); });
$("plantilla").addEventListener("change", e => { state.plantilla = e.target.value; render(); });

$("foto").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImg(url).then(img => {
    state.photo = img;
    document.querySelector(".foto-controls").hidden = false;
    render();
  });
});
["zoom", "posx", "posy"].forEach(id => $(id).addEventListener("input", () => {
  state.photoTransform = { zoom: +$("zoom").value, dx: +$("posx").value, dy: +$("posy").value };
  render();
}));

["ig-titulo", "ig-desc", "fb-titulo", "fb-desc"].forEach(id => $(id).addEventListener("input", render));
$("fb-igual").addEventListener("change", e => {
  $("fb-campos").hidden = e.target.checked;
  render();
});

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  state.red = tab.dataset.red;
  render();
}));

// --- datos por red ---
function dataFor(red){
  const igT = $("ig-titulo").value, igD = $("ig-desc").value;
  const usarIgual = $("fb-igual").checked;
  let titulo, desc;
  if (red === "ig" || usarIgual){ titulo = igT; desc = igD; }
  else { titulo = $("fb-titulo").value; desc = $("fb-desc").value; }
  const highlights = $("highlights").value.split(",").map(s => s.trim()).filter(Boolean);
  return {
    photo: state.photo, photoTransform: state.photoTransform,
    badge: currentBadge(),
    titulo: titulo || "Titulo", descripcion: desc || "Descripcion",
    autor: $("autor").value || "Autor",
    highlights
  };
}

// --- render de la vista previa ---
async function render(){
  await renderTemplate($("lienzo"), state.plantilla, dataFor(state.red));
}

// --- generar y descargar ---
function download(canvas, filename){
  canvas.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "image/png");
}
// Genera y descarga UNA sola red con la plantilla y el texto actuales.
async function generarRed(red){
  const off = document.createElement("canvas");
  off.width = 1080; off.height = 1350;
  const slug = (currentBadge() || "pieza").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await renderTemplate(off, state.plantilla, dataFor(red));
  download(off, `${slug}-${red === "ig" ? "instagram" : "facebook"}.png`);
}
$("gen-ig").addEventListener("click", () => generarRed("ig"));
$("gen-fb").addEventListener("click", () => generarRed("fb"));

// --- arranque ---
(async function(){
  $("gen-ig").disabled = true; $("gen-fb").disabled = true;
  await initAssets();
  refreshPlantillas();
  await render();
  $("gen-ig").disabled = false; $("gen-fb").disabled = false;
})();
