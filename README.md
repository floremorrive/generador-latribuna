# Generador de imágenes · La Tribuna

Aplicación web para generar las piezas de redes sociales (Instagram y Facebook) de
**La Tribuna** a partir de plantillas por categoría. Cada nota produce 2 imágenes
de **1080×1350** (una por red), con textos independientes.

## Cómo usarla

1. Abrir la app en el navegador.
2. Elegir la **categoría** (y la subcategoría/plantilla si aplica).
3. Subir la **foto** ilustrativa y reencuadrarla (zoom / posición).
4. Escribir los textos de **Instagram** y **Facebook**.
5. Clic en **Generar** → descarga las 2 imágenes en PNG.

## Plantillas incluidas

- **Pasa en el mundo** (Oscura · Clara)
- **¿Qué está pasando?** (Clara · Dorada, con resaltado de nombres)
- **Especiales** (Clara · Terracota)
- **Genérica** para Temas y secciones (6 combinaciones de color)
- **Portada** y **Cierre** (solo texto)

## Ejecutar localmente

Necesita un servidor local (el navegador no carga fuentes/imágenes desde `file://`):

```
python -m http.server 5601
```

Y abrir `http://localhost:5601`.

## Estructura

- `index.html` — interfaz
- `css/app.css` — estilos de la interfaz
- `js/data.js` — categorías y plantillas
- `js/render.js` — motor de dibujo en canvas (genera las imágenes)
- `js/app.js` — lógica de la interfaz
- `assets/fonts/` — tipografías (Rajdhani, Inter Tight, M PLUS 1p, IBM Plex Sans)
- `assets/img/` — logos y texturas de ruido

Fuentes: Google Fonts (licencia OFL/Apache, gratuitas).
