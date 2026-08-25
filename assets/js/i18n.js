/* Conmutador de idioma ES/CA.
   Requisito del briefing: debe traducir TODO el contenido, no solo el menú.
   Por eso conviven dos mecanismos:
     - [data-i18n] para el texto fijo del HTML (nav, etiquetas, pie...)
     - los oyentes registrados con alCambiarIdioma(), que vuelven a pintar
       el contenido que sale de productos.json
   Regla al añadir texto: si se ve en pantalla, sale de ui.json o de
   productos.json. Nada escrito a pelo en el HTML. */

const CLAVE_ALMACEN = 'mobiprix-outlet-idioma';
const IDIOMAS = ['es', 'ca'];
const POR_DEFECTO = 'es';

let textos = null;
let actual = POR_DEFECTO;
const oyentes = [];

export function idioma() {
  return actual;
}

/** t('reserva.textoOk', { ref: 'OUT-01' }) */
export function t(ruta, vars) {
  const valor = ruta
    .split('.')
    .reduce((obj, clave) => (obj == null ? undefined : obj[clave]), textos?.[actual]);

  if (typeof valor !== 'string') {
    console.warn(`[i18n] falta la clave "${ruta}" en "${actual}"`);
    return ruta;
  }
  if (!vars) return valor;

  return Object.entries(vars).reduce(
    (texto, [clave, sustituto]) => texto.split(`{${clave}}`).join(sustituto),
    valor
  );
}

/** Registrar antes de iniciarIdioma(): se dispara también en el pintado inicial. */
export function alCambiarIdioma(fn) {
  oyentes.push(fn);
}

function aplicarTextosFijos() {
  document.documentElement.lang = actual;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  document.querySelectorAll('[data-i18n-titulo]').forEach((el) => {
    el.setAttribute('title', t(el.dataset.i18nTitulo));
  });

  const claveTitulo = document.documentElement.dataset.i18nDocumento;
  if (claveTitulo) document.title = t(claveTitulo);

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.descripcion'));
}

export function ponerIdioma(nuevo) {
  if (!IDIOMAS.includes(nuevo)) return;
  actual = nuevo;

  try {
    localStorage.setItem(CLAVE_ALMACEN, nuevo);
  } catch {
    /* navegación privada: se pierde al cambiar de página, no es grave */
  }

  aplicarTextosFijos();
  document.querySelectorAll('.idioma__btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.idioma === actual));
  });
  oyentes.forEach((fn) => fn(actual));
}

export async function iniciarIdioma() {
  const respuesta = await fetch('/data/ui.json');
  if (!respuesta.ok) throw new Error(`No se ha podido cargar ui.json (${respuesta.status})`);
  textos = await respuesta.json();

  let guardado = null;
  try {
    guardado = localStorage.getItem(CLAVE_ALMACEN);
  } catch {
    /* ídem */
  }
  actual = IDIOMAS.includes(guardado) ? guardado : POR_DEFECTO;

  document.querySelectorAll('.idioma__btn').forEach((btn) => {
    btn.addEventListener('click', () => ponerIdioma(btn.dataset.idioma));
  });

  ponerIdioma(actual);
}
