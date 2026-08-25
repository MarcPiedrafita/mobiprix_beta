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

Ahora mismo no hay ninguna imagen en el repo: mientras el archivo no existe se ve
un placeholder verde con la referencia y el nombre del producto.

Para poner las fotos reales, dejarlas en `assets/img/` con estos nombres:

```
out-01.jpg   out-02.jpg   out-03.jpg
out-04.jpg   out-05.jpg   out-06.jpg
```

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

### Color y tipografía

Todo sale de los tokens del principio de `assets/css/styles.css`. El verde de
marca es `#29b12d` (variable `--verde`). La tipografía es el stack del sistema,
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
