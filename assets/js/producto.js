/* Fichas con página propia (out-01, out-02, out-05).
   El slug lo declara el HTML en <body data-slug="out-01">. */

import { iniciarIdioma, alCambiarIdioma, idioma } from './i18n.js';
import {
  cargarDatos, buscarProducto, esc,
  marcaDetalle, activarMedia,
  montarModales, abrirReserva, repintarReserva,
} from './comun.js';

const slug = document.body.dataset.slug;

function pintar() {
  const p = buscarProducto(slug);
  const destino = document.getElementById('ficha');
  if (!p) {
    destino.innerHTML = `<p>Producto no encontrado: ${esc(slug)}</p>`;
    return;
  }

  document.title = `${p.nombre[idioma()]} — Mobiprix Outlet`;
  destino.innerHTML = marcaDetalle(p, { nivelTitulo: 'h1' });
  activarMedia(destino, p);
  repintarReserva();
}

function engancharEventos() {
  document.addEventListener('click', (e) => {
    const reservar = e.target.closest('[data-reservar]');
    if (!reservar) return;
    const p = buscarProducto(reservar.dataset.reservar);
    if (p) abrirReserva(p);
  });
}

async function iniciar() {
  await cargarDatos();
  montarModales();
  engancharEventos();
  alCambiarIdioma(pintar);
  await iniciarIdioma();
}

iniciar().catch((err) => {
  console.error(err);
  document.getElementById('ficha').innerHTML =
    '<p style="color:#b00">No se han podido cargar los datos. Sirve el proyecto por HTTP (npx serve .), no abriendo el archivo directamente.</p>';
});
