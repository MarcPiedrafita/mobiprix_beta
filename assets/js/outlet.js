/* Listado del Outlet: filtros combinables de categoría y tienda, tarjetas,
   ficha en modal para los productos que no tienen página propia. */

import { iniciarIdioma, alCambiarIdioma, t, idioma } from './i18n.js';
import {
  cargarDatos, productos, categorias, tiendas, buscarProducto,
  nombreCategoria, nombreTienda, precio, numero, esc,
  marcaMedia, activarMedia, marcaDetalle,
  montarModales, abrirModal, abrirReserva, repintarReserva,
} from './comun.js';

const TODAS = 'todas';

const filtro = { categoria: TODAS, tienda: TODAS };

const $rejilla = () => document.getElementById('rejilla');
const $vacio = () => document.getElementById('vacio');
const $recuento = () => document.getElementById('recuento');
const $pills = () => document.getElementById('pills-categoria');
const $selectTienda = () => document.getElementById('select-tienda');

/* Los dos filtros se aplican a la vez: son combinables. */
function filtrados() {
  return productos().filter(
    (p) =>
      (filtro.categoria === TODAS || p.categoria === filtro.categoria) &&
      (filtro.tienda === TODAS || p.tienda === filtro.tienda)
  );
}

function marcaTarjeta(p) {
  const lang = idioma();
  const ahorro = p.precioOriginal - p.precioOutlet;
  const destino = p.fichaPropia
    ? `<a class="boton boton--secundario" href="/producto/${esc(p.slug)}">${esc(t('producto.verFicha'))}</a>`
    : `<button type="button" class="boton boton--secundario" data-ficha="${esc(p.slug)}">${esc(
        t('producto.verFicha')
      )}</button>`;

  return `
    <article class="tarjeta${p.estado === 'vendido' ? ' tarjeta--vendido' : ''}">
      ${marcaMedia(p)}
      <div class="tarjeta__cuerpo">
        <p class="meta">
          <span>${esc(nombreCategoria(p.categoria))}</span>
          <span class="meta__sep">·</span>
          <span>${esc(nombreTienda(p.tienda))}</span>
        </p>
        <h2 class="tarjeta__nombre">${esc(p.nombre[lang])}</h2>
        <div class="precios">
          <span class="precio-ahora">${esc(precio(p.precioOutlet))}</span>
          <span class="precio-antes">${esc(precio(p.precioOriginal))}</span>
        </div>
        <p><span class="ahorro">${esc(t('producto.ahorro', { n: numero(ahorro) }))}</span></p>
        <p class="tara">
          <span class="tara__etiqueta">${esc(t('producto.tara'))}</span>
          ${esc(p.defecto[lang])}
        </p>
        <div class="tarjeta__pie">${destino}</div>
      </div>
    </article>`;
}

function pintarFiltros() {
  // Pills de categoría
  const pills = [{ id: TODAS, nombre: t('filtros.todas') }].concat(
    categorias().map((c) => ({ id: c.id, nombre: nombreCategoria(c.id) }))
  );
  $pills().innerHTML = pills
    .map(
      (c) =>
        `<button type="button" class="pill" data-categoria="${esc(c.id)}"
                 aria-pressed="${filtro.categoria === c.id}">${esc(c.nombre)}</button>`
    )
    .join('');

  // Selector de tienda
  const select = $selectTienda();
  select.innerHTML =
    `<option value="${TODAS}">${esc(t('filtros.todasTiendas'))}</option>` +
    tiendas()
      .map((s) => `<option value="${esc(s.id)}">${esc(s.nombre)}</option>`)
      .join('');
  select.value = filtro.tienda;
}

function pintarListado() {
  const lista = filtrados();
  const rejilla = $rejilla();

  rejilla.innerHTML = lista.map(marcaTarjeta).join('');
  lista.forEach((p, i) => {
    const tarjeta = rejilla.children[i];
    if (tarjeta) activarMedia(tarjeta, p);
  });

  // Algunas combinaciones de filtros dan cero resultados: hace falta estado vacío.
  const hayResultados = lista.length > 0;
  rejilla.classList.toggle('oculto', !hayResultados);
  $vacio().classList.toggle('oculto', hayResultados);

  $recuento().textContent =
    lista.length === 1 ? t('filtros.resultadosUno') : t('filtros.resultadosVarios', { n: lista.length });
}

function pintarTodo() {
  pintarFiltros();
  pintarListado();
  repintarReserva();

  // Si hay una ficha abierta en modal, se repinta en el idioma nuevo.
  const cuerpo = document.querySelector('[data-cuerpo-ficha]');
  const abierta = cuerpo?.dataset.slug;
  if (abierta && !document.getElementById('modal-ficha').hidden) abrirFicha(abierta);
}

function abrirFicha(slug) {
  const p = buscarProducto(slug);
  if (!p) return;
  const cuerpo = document.querySelector('[data-cuerpo-ficha]');
  cuerpo.dataset.slug = slug;
  cuerpo.innerHTML = `<h2 class="solo-lectores" id="titulo-ficha">${esc(p.nombre[idioma()])}</h2>` + marcaDetalle(p);
  activarMedia(cuerpo, p);
  abrirModal('modal-ficha');
}

function limpiarFiltros() {
  filtro.categoria = TODAS;
  filtro.tienda = TODAS;
  pintarFiltros();
  pintarListado();
}

function engancharEventos() {
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-categoria]');
    if (pill) {
      filtro.categoria = pill.dataset.categoria;
      pintarFiltros();
      pintarListado();
      return;
    }
    const ficha = e.target.closest('[data-ficha]');
    if (ficha) return abrirFicha(ficha.dataset.ficha);

    const reservar = e.target.closest('[data-reservar]');
    if (reservar) {
      const p = buscarProducto(reservar.dataset.reservar);
      if (p) abrirReserva(p);
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'select-tienda') {
      filtro.tienda = e.target.value;
      pintarListado();
    }
  });

  document.querySelectorAll('[data-limpiar]').forEach((b) => b.addEventListener('click', limpiarFiltros));
}

async function iniciar() {
  await cargarDatos();
  montarModales({ conFicha: true });
  engancharEventos();
  alCambiarIdioma(pintarTodo); // se dispara ya en el pintado inicial
  await iniciarIdioma();
}

iniciar().catch((err) => {
  console.error(err);
  document.getElementById('rejilla').innerHTML =
    '<p style="color:#b00">No se han podido cargar los datos. Sirve el proyecto por HTTP (npx serve .), no abriendo el archivo directamente.</p>';
});
