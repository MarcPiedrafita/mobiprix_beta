/* Piezas compartidas entre el listado y las fichas con página propia:
   carga de datos, formato, placeholders de foto, maquetado de la ficha y
   el modal de reserva simulada. */

import { t, idioma } from './i18n.js';

let datos = null;

export async function cargarDatos() {
  if (datos) return datos;
  const respuesta = await fetch('/data/productos.json');
  if (!respuesta.ok) throw new Error(`No se ha podido cargar productos.json (${respuesta.status})`);
  datos = await respuesta.json();
  return datos;
}

export const productos = () => datos.productos;
export const categorias = () => datos.categorias;
export const tiendas = () => datos.tiendas;

export const buscarProducto = (slug) => datos.productos.find((p) => p.slug === slug);

export function nombreCategoria(id) {
  return datos.categorias.find((c) => c.id === id)?.nombre[idioma()] ?? id;
}

/* Los nombres de tienda son topónimos: no se traducen. */
export function nombreTienda(id) {
  return datos.tiendas.find((s) => s.id === id)?.nombre ?? id;
}

/* useGrouping:'always' porque es-ES omite el separador en números de 4 cifras
   (1370 en vez de 1.370) y en un precio queremos el punto siempre. */
const formateador = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });
export const numero = (n) => formateador.format(n);
export const precio = (n) => `${formateador.format(n)} €`;

export function esc(valor) {
  return String(valor).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

/* --------------------------------------------------------------- Fotos ----
   No se versiona ninguna imagen: mientras el archivo no exista, el <img>
   falla y se muestra el placeholder verde. Cuando lleguen las fotos reales
   basta con dejarlas en assets/img/ con el nombre que indica productos.json;
   no hay que tocar ni el código ni el JSON. */

export function marcaMedia(p, clasesExtra = '') {
  return `
    <div class="media ${clasesExtra}" data-media>
      <img src="" alt="">
      <span class="media__ph" aria-hidden="true">
        <span class="media__ph-ref">${esc(p.ref)}</span>
        <span class="media__ph-nombre"></span>
      </span>
      ${marcaEstado(p)}
    </div>`;
}

export function activarMedia(raiz, p) {
  raiz.querySelectorAll('[data-media]').forEach((contenedor) => {
    const img = contenedor.querySelector('img');
    const nombre = p.nombre[idioma()];

    contenedor.querySelector('.media__ph-nombre').textContent = nombre;
    img.alt = nombre;

    // El oyente va antes que el src: si no, el error puede saltar antes.
    img.addEventListener('error', () => contenedor.classList.add('media--ph'), { once: true });
    img.src = p.imagen;
  });
}

export function marcaEstado(p) {
  return `<span class="estado estado--${esc(p.estado)}">${esc(t(`estados.${p.estado}`))}</span>`;
}

/* -------------------------------------------------------------- Ficha ---- */

export function marcaDetalle(p, { nivelTitulo = 'h2' } = {}) {
  const lang = idioma();
  const ahorro = p.precioOriginal - p.precioOutlet;
  const vendido = p.estado === 'vendido';

  const fila = (clave, valor) => `
    <div class="datos__fila">
      <dt class="datos__clave">${esc(clave)}</dt>
      <dd class="datos__valor">${valor}</dd>
    </div>`;

  return `
    <div class="detalle${vendido ? ' detalle--vendido' : ''}">
      ${marcaMedia(p, 'detalle__media')}
      <div class="detalle__info">
        <p class="detalle__ref">${esc(t('producto.ref'))} ${esc(p.ref)}</p>
        <${nivelTitulo} class="detalle__nombre">${esc(p.nombre[lang])}</${nivelTitulo}>
        <div class="detalle__precios">
          <span class="precio-ahora">${esc(precio(p.precioOutlet))}</span>
          <span class="precio-antes">${esc(precio(p.precioOriginal))}</span>
          <span class="ahorro">${esc(t('producto.ahorro', { n: numero(ahorro) }))}</span>
        </div>
        <dl class="datos">
          ${fila(t('producto.tara'), esc(p.defecto[lang]))}
          ${fila(t('producto.descripcion'), esc(p.descripcion[lang]))}
          ${fila(t('producto.medidas'), esc(p.medidas[lang]))}
          ${fila(t('producto.material'), esc(p.material[lang]))}
          ${fila(t('filtros.tienda'), `<strong>${esc(nombreTienda(p.tienda))}</strong>`)}
        </dl>
        <div class="detalle__acciones">${marcaBotonReserva(p)}</div>
      </div>
    </div>`;
}

export function marcaBotonReserva(p) {
  if (p.estado === 'disponible') {
    return `<button type="button" class="boton boton--principal" data-reservar="${esc(p.slug)}">${esc(
      t('reserva.boton')
    )}</button>`;
  }
  return `<span class="boton boton--inerte">${esc(t(`reserva.${p.estado}`))}</span>`;
}

/* ------------------------------------------------- Modal de reserva ------
   Confirmación simulada: no se envía nada a ningún sitio, y el propio modal
   lo dice para que nadie confunda la beta con algo que ya funciona. */

let productoReservado = null;

const MARCA_MODAL_RESERVA = `
  <div class="modal" id="modal-reserva" hidden>
    <div class="modal__panel modal__panel--estrecho" role="dialog" aria-modal="true"
         aria-labelledby="titulo-reserva">
      <button type="button" class="modal__cerrar" data-cerrar-modal
              data-i18n-aria="producto.cerrar">&times;</button>
      <div class="confirmacion">
        <div class="confirmacion__icono" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h2 class="confirmacion__titulo" id="titulo-reserva" data-i18n="reserva.tituloOk"></h2>
        <p class="confirmacion__texto" data-texto-reserva></p>
        <p class="confirmacion__nota" data-i18n="reserva.nota"></p>
        <button type="button" class="boton boton--principal boton--auto" data-cerrar-modal
                data-i18n="reserva.cerrar"></button>
      </div>
    </div>
  </div>`;

const MARCA_MODAL_FICHA = `
  <div class="modal" id="modal-ficha" hidden>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="titulo-ficha">
      <button type="button" class="modal__cerrar" data-cerrar-modal
              data-i18n-aria="producto.cerrar">&times;</button>
      <div data-cuerpo-ficha></div>
    </div>
  </div>`;

let ultimoFoco = null;

const hayModalAbierto = () =>
  Array.from(document.querySelectorAll('.modal')).some((m) => !m.hidden);

function ocultarPaneles() {
  document.querySelectorAll('.modal').forEach((m) => (m.hidden = true));
}

export function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  // Solo se guarda el foco de origen al abrir el primer modal: si se encadena
  // ficha -> reserva, el foco a devolver sigue siendo el de la página.
  if (!hayModalAbierto()) ultimoFoco = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal__cerrar')?.focus();
}

export function cerrarModales() {
  ocultarPaneles();
  document.body.style.overflow = '';
  productoReservado = null;
  ultimoFoco?.focus?.();
  ultimoFoco = null;
}

export function abrirReserva(p) {
  // La ficha en modal se cierra antes de confirmar: si no, quedan dos capas
  // oscuras apiladas y la confirmación se pinta por detrás de la ficha.
  // Al ocultarla se pierde el activeElement, así que el origen del foco se
  // guarda antes y se restituye después de abrir.
  const origen = hayModalAbierto() ? ultimoFoco : document.activeElement;
  ocultarPaneles();
  productoReservado = p;
  pintarTextoReserva();
  abrirModal('modal-reserva');
  ultimoFoco = origen;
}

function pintarTextoReserva() {
  const destino = document.querySelector('[data-texto-reserva]');
  if (!destino || !productoReservado) return;
  destino.textContent = t('reserva.textoOk', {
    producto: productoReservado.nombre[idioma()],
    ref: productoReservado.ref,
    tienda: nombreTienda(productoReservado.tienda),
  });
}

/** Inyecta los modales una sola vez y engancha cerrar por botón, fondo y Esc. */
export function montarModales({ conFicha = false } = {}) {
  document.body.insertAdjacentHTML(
    'beforeend',
    MARCA_MODAL_RESERVA + (conFicha ? MARCA_MODAL_FICHA : '')
  );

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cerrar-modal]')) return cerrarModales();
    // Clic en el fondo oscuro, fuera del panel
    if (e.target.classList.contains('modal')) cerrarModales();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModales();
  });
}

/** Si se cambia de idioma con la confirmación abierta, se repinta. */
export const repintarReserva = pintarTextoReserva;
