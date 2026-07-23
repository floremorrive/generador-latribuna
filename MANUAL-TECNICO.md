# Manual técnico · Generador de imágenes de La Tribuna

Documentación para quien deba **mantener o modificar** la aplicación.

---

## Respuesta corta a la pregunta principal

> **¿Si cambian las plantillas hay que volver a hacer toda la aplicación?**

**No. Nunca.**

La aplicación es un **motor de dibujo** que ya está hecho. Las plantillas no están
"pegadas" al programa: son **bloques de configuración** (colores, posiciones y tamaños)
que viven en un solo archivo, `js/render.js`.

Cambiar una plantilla = **cambiar números y colores en ese bloque**. El resto de la
app (formulario, vista previa, carga de foto, exportación a PNG, descarga) no se toca.

Hay tres niveles de cambio, de menor a mayor esfuerzo:

| Nivel | Qué es | Dónde se toca | Esfuerzo |
|---|---|---|---|
| **1** | Ajustar una plantilla existente (color, posición, tamaño, ruido) | 1 bloque en `render.js` | Minutos |
| **2** | Nueva variante de color de un diseño que ya existe | 1 bloque en `render.js` + 2 líneas en `data.js` | ~15 min |
| **3** | Un layout **estructuralmente** distinto (nunca visto antes) | Función nueva en `render.js` + registro | 1–2 horas |

**El 90% de los cambios son de nivel 1.**

---

## 1. Arquitectura

Aplicación **estática**: HTML + CSS + JavaScript puro.

- **Sin framework** (no React, no Vue).
- **Sin compilación** (no npm, no build, no `node_modules`).
- **Sin servidor ni base de datos.** Todo corre en el navegador del usuario.
- **Sin costo de hosting**: GitHub Pages.

Las imágenes se dibujan en un `<canvas>` de **1080 × 1350** y se exportan con
`canvas.toBlob()` como PNG. Es decir: **el navegador es el que "arma" la imagen**,
píxel por píxel, siguiendo las instrucciones de las plantillas.

### Archivos

```
Generador-LaTribuna/
├── index.html            Interfaz (formulario + vista previa)
├── css/app.css           Estilos de la interfaz (NO de las imágenes)
├── js/
│   ├── data.js           Catálogo: categorías, temas y qué plantilla usa cada una
│   ├── render.js         ★ MOTOR DE DIBUJO + definición de las plantillas
│   └── app.js            Lógica de la interfaz (eventos, descargas)
├── assets/
│   ├── fonts/            Tipografías (.ttf) + fonts.css
│   └── img/              Logos y texturas de ruido
├── MANUAL-USO.md         Manual para redacción
└── MANUAL-TECNICO.md     Este documento
```

> **La regla clave:** `css/app.css` da estilo a **la página web**.
> El diseño de **las imágenes generadas** está TODO en `js/render.js`.
> Si quiere cambiar cómo se ve una pieza, el archivo es `render.js`.

### Sistema de coordenadas

El lienzo es de **1080 de ancho × 1350 de alto**.

- `x` = 0 en el borde izquierdo, 1080 en el derecho.
- `y` = 0 **arriba**, 1350 abajo. (Ojo: y crece hacia abajo.)
- Para textos, la `y` es la **línea base** de la primera línea, no el borde superior.

---

## 2. Cómo está definida una plantilla

En `js/render.js` hay un objeto llamado `TEMPLATES`. Cada entrada es una plantilla.
Ejemplo real (*Pasa en el mundo · Oscura*):

```js
"pasa-mundo": (ctx, d) => renderStandard(ctx, {
  bg: COLORS.dark, weaveAlpha: 0.02,
  photo: { x: 31, y: 0, w: 1021, h: 690 },
  accent: { x: 100, w: 9, color: COLORS.gold },
  badge: { x: 96, y: 1225, style: "border", bg: COLORS.gold, text: COLORS.gold, size: 28 },
  title: { x: 146, y: 830, w: 878, size: 56, color: COLORS.cream },
  desc:  { x: 154, w: 872, size: 38, color: COLORS.gold },
  textBottom: 1200,
  logo: "white"
}, d),
```

Eso es **toda** la plantilla. No hay más código detrás de ella: `renderStandard()` es
el motor genérico que interpreta esa configuración.

### Diccionario de opciones

**Fondo**

| Opción | Qué hace |
|---|---|
| `bg` | Color de fondo plano. Ej: `"#272624"` o `COLORS.dark` |
| `bgGradient` | Degradado vertical: `{ top, bottom, y0, y1 }` |
| `paperEdges` | `true` = pinta de color papel la zona de la foto (deja márgenes claros) |
| `weaveAlpha` | Intensidad del tejido diagonal (líneas finas). 0.02 = casi invisible, 0.5 = notorio |
| `weaveDark` | `true` = líneas negras; `false`/ausente = líneas blancas |

**Foto**

| Opción | Qué hace |
|---|---|
| `photo` | Recuadro de la foto: `{ x, y, w, h }` |
| `photoBacking` | Color de relleno detrás de la foto (sirve para hacerle marco) |
| `duotone` | Tratamiento de la foto (ver abajo). Si se omite, la foto queda a color |
| `photoGrain` | Opacidad del grano sobre foto a color. Por defecto `0.25` |

`duotone` acepta:

```js
duotone: {
  tintPct: 0.25,        // cuánto tiñe (0 = solo blanco y negro, 1 = filtro pleno)
  tint: "#9C5A4E",      // color del filtro
  brighten: 0.3,        // aclara la foto (efecto "high-key", más blanca)
  grainOp: 0.28,        // intensidad del grano
  grungeOp: 0.2,        // intensidad de las motas
  micro: true           // grano de micropuntos (en vez de la textura estándar)
}
```

**Recuadro de categoría (`badge`)**

| Opción | Qué hace |
|---|---|
| `x`, `y` | Posición (la `y` es el borde superior de la caja) |
| `style` | `"fill"` (relleno) o `"border"` (solo contorno) |
| `bg` | Color de relleno (o del contorno si es `"border"`) |
| `text` | Color del texto |
| `size` | Tamaño de letra |
| `center` | `true` = centrado horizontalmente (ignora la `x`) |
| `bar` | `true` = barra de ancho completo; usar con `barH` (alto de la barra) |
| `line` | Línea que se extiende a la derecha: `{ fromX, toX, thickness, color, atBottom }` |

**Textos**

| Opción | Qué hace |
|---|---|
| `title` | `{ x, y, w, size, color }` — Rajdhani negrita |
| `desc` | `{ x, w, size, color }` — Inter Tight normal. **No lleva `y`**: fluye debajo del título |
| `titleGap` | Separación entre título y descripción. Por defecto `44` |
| `textBottom` | Línea que el texto **no debe pasar**. Por defecto `1170` |
| `accent` | Línea vertical de acento: `{ x, w, color }`. **No lleva `y` ni alto**: se calculan solos |

**Otros**

| Opción | Qué hace |
|---|---|
| `logo` | `"white"` o un color hex (recolorea el logo) |
| `granoOp` / `grungeOp` | Intensidad de las texturas globales sobre toda la pieza |

### Lo que se calcula solo (no hay que tocarlo)

- **La descripción fluye debajo del título.** Por eso `desc` no tiene `y`.
- **Si el texto no cabe**, la letra se reduce automáticamente (hasta un 60%) para no
  pasar de `textBottom`.
- **La línea de acento** (`accent`) se estira sola para cubrir exactamente desde el
  título hasta la última línea de la descripción.

Esa lógica está en la función `layoutTitleDesc()`.

---

## 3. Recetario: cambios frecuentes

### 3.1 Cambiar un color de marca en TODAS las plantillas

Al inicio de `render.js`:

```js
const COLORS = {
  dark:   "#272624",   // negro de la marca
  gold:   "#C6A465",   // dorado
  cream:  "#FAF4F2",   // crema (textos claros)
  terra:  "#914135",   // terracota
  terra2: "#8A3D33",
  paper:  "#ECE6E0",   // fondo papel
  grayTx: "#4a4744"    // gris de textos
};
```

Cambie el hex y **cambia en todas las plantillas que lo usen**.

### 3.2 Subir o bajar el ruido en TODA la app

```js
const FX = { grano: 0.11, grunge: 0.1, weave: 0.14 };
```

Son multiplicadores globales. Subirlos = más ruido en todo. Bajarlos = más limpio.
Para ajustar **una sola** plantilla, use `granoOp` / `grungeOp` en su bloque.

### 3.3 Mover o redimensionar un texto

En el bloque de la plantilla, cambie `title` o `desc`:

```js
title: { x: 146, y: 830, w: 878, size: 56, color: COLORS.cream },
//        ↑        ↑       ↑        ↑
//     izquierda  altura  ancho  tamaño de letra
```

- Para **bajar** el título: suba el número de `y`.
- Para que el texto sea **más ancho**: suba `w` (y verifique que `x + w` no pase de ~1030).
- Para dar **más aire** entre título y descripción: agregue `titleGap: 60`.

### 3.4 Separar la línea de acento del texto

La línea está en `accent.x`. El texto en `title.x` / `desc.x`.
El espacio entre ambos es `title.x − (accent.x + accent.w)`.
Para más aire, **suba** `title.x` y `desc.x` (y baje `w` en la misma cantidad).

### 3.5 Cambiar el pie de la Portada/Cierre

El texto `www.latribunacolombia.co` está escrito directamente en la función
`renderCierre()`, cerca del final.

---

## 4. Nivel 2 · Agregar una variante de color nueva

Ejemplo: agregar *Especiales · Azul*.

**Paso 1 — Copiar el bloque en `render.js`** y cambiarle el id y los colores:

```js
"especiales-azul": (ctx, d) => renderStandard(ctx, {
  bgGradient: { top: "#2E4A6B", bottom: "#1B2E44", y0: 690, y1: 1350 },
  weaveAlpha: 0.5, weaveDark: true,
  photo: { x: 0, y: 0, w: 1080, h: 690 },
  duotone: { tintPct: 0.25, tint: "#3E5F87", grainOp: 0.28 },
  accent: { x: 108, w: 8, color: COLORS.dark },
  badge: { x: 107, y: 1232, style: "border", bg: COLORS.cream, text: COLORS.cream, size: 28 },
  title: { x: 150, y: 800, w: 876, size: 60, color: COLORS.cream },
  desc:  { x: 150, w: 876, size: 40, color: COLORS.cream },
  textBottom: 1200,
  logo: "white"
}, d),
```

**Paso 2 — Ponerle nombre visible en `data.js`:**

```js
const PLANTILLAS_LABEL = {
  ...
  "especiales-azul": "Azul",
};
```

**Paso 3 — Ofrecerla en la categoría, en `data.js`:**

```js
{ id: "especiales", nombre: "Especiales", badge: "ESPECIALES",
  plantillas: ["especiales-claro", "especiales-terracota", "especiales-azul"] },
```

Listo. Aparece sola en el selector. **No se toca `app.js` ni `index.html`.**

### Agregar un tema nuevo (ej. "Vivienda")

Una sola línea, en el arreglo `TEMAS` de `data.js`:

```js
const TEMAS = [ "Agro", "Arte y Cultura", ..., "Energía", "Vivienda" ];
```

---

## 5. Nivel 3 · Un layout estructuralmente nuevo

Solo si el diseño **no se puede describir** como "foto arriba + texto abajo".
Ya hay cuatro casos así: `renderQuePasaClaro`, `renderQuePasaDorado`,
`renderPortada`, `renderCierre`.

Se escribe una función que recibe `(ctx, d)` y dibuja por capas, y se registra:

```js
"mi-plantilla": (ctx, d) => renderMiPlantilla(ctx, d),
```

Herramientas disponibles para esa función:

| Función | Para qué |
|---|---|
| `drawCover(ctx, img, x, y, w, h, t)` | Dibuja la foto recortada al recuadro |
| `duotone(ctx, x, y, w, h, opts)` | Blanco y negro + filtro + grano |
| `photoGrain(ctx, x, y, w, h, op)` | Grano sobre foto a color |
| `diagonalWeave(ctx, alpha, spacing, dark)` | Tejido de líneas diagonales |
| `textureOverlays(ctx, granoOp, grungeOp)` | Texturas globales |
| `paragraph(ctx, texto, x, y, w, font, color, lh)` | Párrafo con salto de línea automático |
| `richParagraph(...)` | Párrafo con palabras resaltadas |
| `drawBadge(ctx, cfg, texto)` | Recuadro de categoría |
| `drawLogo(ctx, color, ancho, y)` | Logo + lema |
| `layoutTitleDesc(ctx, cfg, d)` | Título + descripción con auto-ajuste |

---

## 6. Los datos que recibe cada plantilla

Toda función de plantilla recibe `d` con:

```js
{
  photo,            // la imagen cargada (o null)
  photoTransform,   // { zoom, dx, dy } del reencuadre
  badge,            // texto del recuadro de categoría
  titulo,
  descripcion,
  autor,            // solo Cierre
  highlights        // lista de frases a resaltar (solo ¿Qué está pasando?)
}
```

---

## 7. Probar los cambios antes de publicar

En la carpeta del proyecto:

```bash
python -m http.server 5601
```

Y abrir `http://localhost:5601`.

> Hay que usar un servidor local: abriendo el `index.html` con doble clic
> (`file://`) el navegador bloquea la carga de las tipografías y las texturas.

Durante el desarrollo, `index.html` carga los `.js` con un truco anti-caché
(`?_=Date.now()`), para que el navegador no use versiones viejas.

---

## 8. Publicar

La app está en GitHub Pages. Para que los cambios queden en vivo:

```bash
git add -A && git commit -m "Descripción del cambio" && git push
```

GitHub Pages **redespliega solo** en aproximadamente 1 minuto.

- **Repositorio:** `floremorrive/generador-latribuna` (rama `main`, carpeta raíz)
- **URL pública:** https://floremorrive.github.io/generador-latribuna/

Después de publicar, abrir la web con **Ctrl + Shift + R** para forzar la recarga.

---

## 9. Recursos y origen del diseño

- **Plantillas originales de PowerPoint:** `I:\000.PlantillasLT\plantillas LT.pptm`
  y `plantillas LTroja.pptm`. Sirven de referencia para muestrear colores exactos
  (exportar la diapositiva a PNG y tomar el color con un cuentagotas).
- **Tipografías** (Google Fonts, licencias libres OFL/Apache), en `assets/fonts/`:
  - **Rajdhani** — títulos
  - **Inter Tight** — descripciones y categorías
  - **M PLUS 1p** — el lema "En defensa de Colombia"
  - **IBM Plex Sans**
- **Imágenes** en `assets/img/`: `fx-grano.png` y `fx-grunge.png` (texturas de ruido),
  `logo-latribuna-white-trim.png` (logo blanco, se recolorea por código),
  `logo-lt-monograma.png` (monograma del Cierre).

---

## 10. Catálogo actual de plantillas

| Categoría | Plantillas (id → nombre visible) |
|---|---|
| Pasa en el mundo | `pasa-mundo` → Oscura · `pasa-mundo-claro` → Clara |
| ¿Qué está pasando? | `que-pasa-claro` → Clara · `que-pasa-dorado` → Dorada |
| Especiales | `especiales-claro` → Claro · `especiales-terracota` → Terracota |
| Pasa en las regiones · Pura paja · Le pasa a las Mujeres · Temas | Las 6 genéricas |
| Portada | `portada` |
| Cierre | `cierre` |

**Las 6 genéricas** (constante `GENERICAS` en `data.js`), nombradas `[Fondo]-[Acento]`:
`gen-blanca-dorado`, `gen-dorado-negro`, `gen-blanco-terracota`,
`gen-terracota-blanco`, `gen-negro-blanco`, `gen-terracota`.

---

## 11. Advertencias

- **No usar `mix-blend-mode` de CSS.** Se probó y cuelga la exportación. Los efectos
  de mezcla se hacen con `globalCompositeOperation` dentro del canvas.
- **El texto tiene longitudes de diseño:** Título 60–80 caracteres, Descripción 140–160.
  Fuera de ese rango la letra se encoge y la pieza pierde jerarquía.
- **Si toca `layoutTitleDesc()`**, revise que no se dañen las demás: la usan **todas**
  las plantillas que pasan por `renderStandard()` (o sea, todas las de foto) **más**
  `que-pasa-dorado`. Las únicas que no la usan son `que-pasa-claro`, `portada` y `cierre`.
- **Después de publicar**, siempre verificar con Ctrl + Shift + R: el navegador
  cachea con fuerza y puede hacer creer que un cambio "no funcionó".
