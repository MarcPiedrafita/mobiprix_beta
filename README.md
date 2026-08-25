# Outlet Mobiprix — beta de diseño

Demo **estática y desechable** de la sección Outlet, para enseñársela al cliente
antes de aprobar el diseño definitivo.

> No es la web de producción. No hay Notion, ni backend, ni reservas reales.
> El botón de reservar abre una confirmación simulada que lo dice explícitamente.
> El contenido (productos, precios y taras) es ficticio.
> La web final irá en Astro + Notion; este código no se reutiliza.

## Previsualizar en local

No hay dependencias ni build. Solo hace falta servirlo por HTTP:

```bash
npx serve .
```

Abrir <http://localhost:3000>. **No vale abrir `index.html` a pelo**: el
contenido se carga con `fetch` desde `data/`, y el protocolo `file://` lo bloquea.

## Desplegar

Importar el repo en Vercel. No hay que configurar nada: `vercel.json` ya deja
puestas las URLs limpias (`/producto/out-01`) y el `noindex`, y no hay comando
de build.

## Qué contiene

| | |
|---|---|
| Idiomas | Español y catalán, escritos a mano. Por defecto ES |
| Productos | 6 ficticios: 2 sofás, 2 armarios, 2 colchones |
| Estados | Disponible, Reservado y Vendido, con tratamiento visual distinto |
| Filtros | Categoría y tienda, **combinables**, con estado vacío |
| Fichas | Página propia (OUT-01, OUT-02, OUT-05) y modal (OUT-03, OUT-04, OUT-06) |
| Tiendas | 4 de las 18 reales |

Las dos formas de ficha conviven a propósito: la idea es que el cliente compare
página y modal y elija una para la web final.

## Cambiar cosas

### Textos

- Interfaz (menú, filtros, botones, pie): `data/ui.json`
- Productos (nombres, taras, descripciones, precios): `data/productos.json`

Los dos archivos llevan `es` y `ca`. **Si un texto se ve en pantalla, sale de uno
de estos dos sitios** — no hay nada escrito a mano en el HTML, para que el
conmutador de idioma traduzca de verdad todo el contenido y no solo el menú.

### Fotos

Están en `assets/img/`, una por producto:

```
out-01.jpg   out-02.jpg   out-03.jpg
out-04.jpg   out-05.jpg   out-06.jpg
```

Están las seis. Si alguna se borra, esa tarjeta pasa a mostrar un placeholder
con la referencia y el nombre; volver a dejar el archivo con ese nombre la
restituye, sin tocar código.

Las fotos actuales son de 1500 px de ancho y suman unos 800 KB. Para la demo va
bien, pero **en la web final hay que redimensionarlas y comprimirlas**: se
muestran a menos de 600 px y se cargan las seis de golpe.

No hay que tocar ni el código ni el JSON. Se recomienda formato apaisado (4:3);
la tarjeta recorta con `object-fit: cover`.

Si se prefiere otro nombre o extensión, se cambia el campo `imagen` del producto
en `data/productos.json`.

### Favicon

Está en `assets/img/favicon.jpg`, referenciado con `<link rel="icon">` desde las
cuatro páginas. Es un JPEG de 225×225 pese a que el archivo original venía con
extensión `.ico`; se sirve como JPEG a propósito, porque dejarlo en una ruta
`.ico` haría que el servidor declarase un `Content-Type` que no corresponde a
los bytes. Para cambiarlo basta con sustituir el archivo; si el nuevo tiene otra
extensión, hay que actualizar el `href` en los cuatro HTML.

### Foto del hero

`assets/img/hero.jpg`, el fondo de la cabecera de la portada.

El original venía a 5000 × 3000 y 1,5 MB. Está redimensionada a 2400 × 1440 y
recomprimida a calidad 78, lo que la deja en 273 KB: el hero nunca se ve a más
de ~1400 px CSS, así que 2400 cubre pantallas retina de sobra.

Sobre ella va un **velo blanco**, no oscuro. La foto es muy clara (pared
blanca, sofá crema, suelo pálido): oscurecerla para poner texto blanco apagaría
su luz y chocaría con el resto de la página. El texto sigue siendo oscuro y lo
que se refuerza es el fondo.

Si se cambia la foto por una más oscura **hay que rehacer esa decisión**, no
solo sustituir el archivo. La suite mide el contraste real (oculta el texto,
fotografía el fondo que queda debajo y calcula el peor caso WCAG de toda la
caja), así que un cambio que rompa la legibilidad falla el test en vez de
colarse.

### Logo

`assets/img/logo.svg`, el oficial de mobiprix.com, referenciado desde la
cabecera de las cuatro páginas. Vector puro, 2,3 KB.

Su viewBox es 320 × 123 con el dibujo en 298,9 × 103,3: unos 10 px de aire
arriba y abajo. Con `height: 36px` la marca se ve a unos 30 px, que es lo que
pide una cabecera de 68 px. **Si se sustituye el archivo hay que volver a medir
ese aire**, no reutilizar el 36: el PNG anterior llevaba un 24 % de margen y
necesitaba 52 px para verse igual de grande.

### Previsualización al compartir el enlace

`assets/img/og.jpg` (2400 × 1260, proporción 1,91:1) es lo que se ve cuando se
manda la URL por WhatsApp, Slack o correo. Las metaetiquetas `og:` están en las
cuatro páginas, cada una con su `og:url`.

Esos textos son **la única excepción** a la regla de que todo el texto visible
sale de `ui.json`: van en estático y en castellano porque los rastreadores no
ejecutan JavaScript y el conmutador de idioma no les llega.

Para regenerar la imagen tras un cambio de diseño: servir el proyecto, abrirlo
a 1200 × 630 con `deviceScaleFactor: 2`, compactar el hero (`.hero{padding:22px
0 14px} .hero__subtitulo{display:none} .filtros{margin-bottom:22px}`) para que
entren cabecera, titular, filtros y una fila de tarjetas, y capturar en JPEG con
calidad 82. El encuadre está pensado para que no se transparente texto tras la
cabecera sticky.

### Color y tipografía

Todo sale de los tokens del principio de `assets/css/styles.css`. El verde de
la interfaz es `#29b12d` (variable `--verde`), el que se indicó al arrancar.

Ojo: **el verde del logo es `#00b33f`**, distinto del anterior. Conviven en la
misma cabecera. Está pendiente de decidir si se unifica la interfaz al verde
del logo. La tipografía es el stack del sistema,
pendiente del manual de marca: se cambia en `--fuente`.

## Estructura

```
index.html            Listado con los filtros
producto/*.html       Las 3 fichas con página propia
assets/css/           Un único stylesheet, con tokens arriba
assets/js/i18n.js     Conmutador ES/CA
assets/js/comun.js    Datos, formato, ficha y modal de reserva
assets/js/outlet.js   Listado y filtros
assets/js/producto.js Fichas con página propia
data/                 El contenido, en JSON
```
