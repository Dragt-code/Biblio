const API = '';
const tokenGuardado = () => localStorage.getItem('token');
const usuarioGuardado = () => JSON.parse(localStorage.getItem('usuario') || 'null');

let usuario = usuarioGuardado();

async function api(ruta, metodo = 'GET', cuerpo) {
  const encabezados = { 'Content-Type': 'application/json' };
  if (tokenGuardado()) encabezados.Authorization = `Bearer ${tokenGuardado()}`;

  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la operación');
  return datos;
}

function seleccionar(elemento) {
  document.querySelectorAll('.vista').forEach((vista) => vista.classList.remove('activa'));
  document.getElementById(elemento).classList.add('activa');
  document.querySelectorAll('.nav button').forEach((boton) => {
    boton.classList.toggle('activo', boton.dataset.vista === elemento);
  });
}

function actualizarSesion() {
  usuario = usuarioGuardado();
  const autenticado = Boolean(tokenGuardado() && usuario);
  document.getElementById('nav').classList.toggle('oculto', !autenticado);
  document.getElementById('sesion').classList.toggle('oculto', !autenticado);

  if (autenticado) {
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    document.querySelectorAll('.solo-admin').forEach((elemento) => {
      elemento.classList.toggle('oculto', usuario.rol !== 'admin');
    });
    document.querySelectorAll('.solo-usuario').forEach((elemento) => {
      elemento.classList.toggle('oculto', usuario.rol !== 'usuario');
    });
    seleccionar(usuario.rol === 'admin' ? 'admin-libros' : 'catalogo');
    if (usuario.rol === 'admin') cargarLibrosAdmin();
    else cargarCatalogo();
    return;
  }

  document.querySelectorAll('.vista').forEach((vista) => vista.classList.remove('activa'));
  document.getElementById('auth').classList.add('activa');
  document.querySelectorAll('.nav button').forEach((boton) => boton.classList.remove('activo'));
  mostrarAviso('');
}

async function cargarCatalogo() {
  try {
    const titulo = document.getElementById('buscador').value.trim();
    const libros = await api(`/libros${titulo ? `?titulo=${encodeURIComponent(titulo)}` : ''}`);
    document.getElementById('lista-libros').innerHTML = libros.map((libro, indice) => `
      <article class="libro" style="--fondo-libro: url('${fondoLibro(libro, indice)}')">
        <div class="libro-contenido">
          <h3>${escaparHtml(libro.titulo)}</h3>
          <p class="autor">${escaparHtml(libro.autor)}</p>
          <p class="meta">${escaparHtml(libro.categoria || 'Sin categoría')} · ${libro.cantidad} disponibles</p>
          <button class="btn" data-solicitar="${libro.id}" ${libro.cantidad < 1 ? 'disabled' : ''}>
            Solicitar préstamo
          </button>
        </div>
      </article>
    `).join('');
  } catch (error) {
    mostrarAviso(error.message);
  }

  function fondoLibro(libro, indice) {
    const titulo = libro.titulo.toLowerCase();
    let archivo;

    if (titulo.includes('cien años')) archivo = '100 Años de soledad.webp';
    else if (titulo.includes('quijote')) archivo = 'Quijote.jpg';
    else if (titulo.includes('harry')) archivo = 'Harry.jpg';
    else {
      const fondos = ['100 Años de soledad.webp', 'Quijote.jpg', 'Harry.jpg'];
      archivo = fondos[indice % fondos.length];
    }

    return `/assets/${encodeURIComponent(archivo)}`;
  }
}

async function cargarPrestamos() {
  try {
    const prestamos = await api('/prestamos');
    const cuerpo = usuario.rol === 'admin' ? document.getElementById('tbody-prestamos') : document.getElementById('tbody-mis-prestamos');

    if (usuario.rol === 'admin') {
      cuerpo.innerHTML = prestamos.map((prestamo) => `
        <tr>
          <td>${escaparHtml(prestamo.codigo)}</td>
          <td>${escaparHtml(prestamo.Usuario?.nombre || '')}</td>
          <td>${escaparHtml(prestamo.Libro?.titulo || '')}</td>
          <td><span class="estado ${prestamo.estado}">${prestamo.estado}</span></td>
          <td class="acciones">
            ${prestamo.estado === 'pendiente' ? `<button class="btn btn-chico" data-aprobar="${prestamo.id}">Aprobar</button>` : ''}
            ${prestamo.estado === 'prestado' ? `<button class="btn btn-chico btn-secundario" data-devolver="${prestamo.id}">Registrar devolución</button>` : ''}
          </td>
        </tr>
      `).join('');
      return;
    }

    cuerpo.innerHTML = prestamos.map((prestamo) => `
      <tr>
        <td>${escaparHtml(prestamo.codigo)}</td>
        <td>${escaparHtml(prestamo.Libro?.titulo || '')}</td>
        <td>${prestamo.fecha_prestamo || '—'}</td>
        <td>${prestamo.fecha_devolucion || '—'}</td>
        <td><span class="estado ${prestamo.estado}">${prestamo.estado}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    mostrarAviso(error.message);
  }
}

async function cargarLibrosAdmin() {
  try {
    const libros = await api('/libros');
    document.getElementById('tbody-libros').innerHTML = libros.map((libro) => `
      <tr>
        <td>${libro.id}</td>
        <td>${escaparHtml(libro.titulo)}</td>
        <td>${escaparHtml(libro.autor)}</td>
        <td>${escaparHtml(libro.categoria || '')}</td>
        <td>${libro.cantidad}</td>
        <td class="acciones">
          <button class="btn btn-chico btn-secundario" data-editar-libro="${libro.id}" data-titulo="${escaparAtributo(libro.titulo)}" data-autor="${escaparAtributo(libro.autor)}" data-categoria="${escaparAtributo(libro.categoria || '')}" data-cantidad="${libro.cantidad}">Editar</button>
          <button class="btn btn-chico btn-peligro" data-eliminar-libro="${libro.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    mostrarAviso(error.message);
  }
}

async function cargarUsuarios() {
  try {
    const usuarios = await api('/usuarios');
    document.getElementById('tbody-usuarios').innerHTML = usuarios.map((usuarioItem) => `
      <tr>
        <td>${usuarioItem.id}</td>
        <td>${escaparHtml(usuarioItem.nombre)}</td>
        <td>${escaparHtml(usuarioItem.email)}</td>
        <td>${usuarioItem.rol}</td>
        <td class="acciones">
          <button class="btn btn-chico btn-secundario" data-editar-usuario="${usuarioItem.id}" data-nombre="${escaparAtributo(usuarioItem.nombre)}" data-rol="${usuarioItem.rol}">Editar</button>
          <button class="btn btn-chico btn-peligro" data-eliminar-usuario="${usuarioItem.id}" ${usuarioItem.id === usuario.id ? 'disabled' : ''}>Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    mostrarAviso(error.message);
  }
}

function escaparHtml(valor) {
  const div = document.createElement('div');
  div.textContent = valor ?? '';
  return div.innerHTML;
}

function escaparAtributo(valor) {
  return escaparHtml(valor).replaceAll('"', '&quot;');
}

function mostrarAviso(mensaje, exitoso = false) {
  const elemento = document.getElementById('auth-mensaje');
  elemento.textContent = mensaje;
  elemento.classList.toggle('ok', exitoso);
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('activo'));
    tab.classList.add('activo');
    document.querySelectorAll('#auth form').forEach((form) => form.classList.add('oculto'));
    document.getElementById(tab.dataset.form).classList.remove('oculto');
    mostrarAviso('');
  });
});

document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault();
  const datos = Object.fromEntries(new FormData(event.target));
  try {
    const resultado = await api('/auth/login', 'POST', datos);
    localStorage.setItem('token', resultado.token);
    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
    event.target.reset();
    actualizarSesion();
  } catch (error) {
    mostrarAviso(error.message);
  }
});

document.getElementById('form-registro').addEventListener('submit', async (event) => {
  event.preventDefault();
  const datos = Object.fromEntries(new FormData(event.target));
  try {
    await api('/auth/register', 'POST', datos);
    event.target.reset();
    mostrarAviso('Cuenta creada. Ya puedes iniciar sesión.', true);
    document.querySelector('[data-form="form-login"]').click();
  } catch (error) {
    mostrarAviso(error.message);
  }
});

document.querySelectorAll('.nav button').forEach((boton) => {
  boton.addEventListener('click', () => {
    seleccionar(boton.dataset.vista);
    if (boton.dataset.vista === 'catalogo') cargarCatalogo();
    if (boton.dataset.vista === 'mis-prestamos') cargarPrestamos();
    if (boton.dataset.vista === 'admin-libros') cargarLibrosAdmin();
    if (boton.dataset.vista === 'admin-prestamos') cargarPrestamos();
    if (boton.dataset.vista === 'admin-usuarios') cargarUsuarios();
  });
});

document.getElementById('btn-salir').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  usuario = null;
  actualizarSesion();
});

document.getElementById('buscador').addEventListener('input', cargarCatalogo);

document.addEventListener('click', async (event) => {
  const solicitar = event.target.closest('[data-solicitar]');
  if (solicitar) {
    try {
      await api('/prestamos', 'POST', { libro_id: Number(solicitar.dataset.solicitar) });
      await cargarCatalogo();
      alert('Solicitud enviada.');
    } catch (error) {
      alert(error.message);
    }
  }

  const aprobar = event.target.closest('[data-aprobar]');
  if (aprobar) {
    await ejecutarAccion(`/prestamos/${aprobar.dataset.aprobar}/aprobar`, 'PUT');
  }

  const devolver = event.target.closest('[data-devolver]');
  if (devolver) {
    await ejecutarAccion(`/prestamos/${devolver.dataset.devolver}/devolver`, 'PUT');
  }

  const editarLibro = event.target.closest('[data-editar-libro]');
  if (editarLibro) {
    const formulario = document.getElementById('form-libro');
    formulario.elements.id.value = editarLibro.dataset.editarLibro;
    formulario.elements.titulo.value = editarLibro.dataset.titulo;
    formulario.elements.autor.value = editarLibro.dataset.autor;
    formulario.elements.categoria.value = editarLibro.dataset.categoria;
    formulario.elements.cantidad.value = editarLibro.dataset.cantidad;
    formulario.elements.titulo.focus();
  }

  const eliminarLibro = event.target.closest('[data-eliminar-libro]');
  if (eliminarLibro && confirm('¿Eliminar este libro?')) {
    await ejecutarAccion(`/libros/${eliminarLibro.dataset.eliminarLibro}`, 'DELETE');
  }

  const editarUsuario = event.target.closest('[data-editar-usuario]');
  if (editarUsuario) {
    const nombre = prompt('Nombre', editarUsuario.dataset.nombre);
    if (nombre) {
      try {
        await api(`/usuarios/${editarUsuario.dataset.editarUsuario}`, 'PUT', { nombre, rol: editarUsuario.dataset.rol });
        await cargarUsuarios();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  const eliminarUsuario = event.target.closest('[data-eliminar-usuario]');
  if (eliminarUsuario && confirm('¿Eliminar este usuario?')) {
    await ejecutarAccion(`/usuarios/${eliminarUsuario.dataset.eliminarUsuario}`, 'DELETE');
  }
});

async function ejecutarAccion(ruta, metodo) {
  try {
    await api(ruta, metodo);
    await cargarPrestamos();
    await cargarLibrosAdmin();
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById('form-libro').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formulario = event.target;
  const datos = Object.fromEntries(new FormData(formulario));
  const id = datos.id;
  delete datos.id;
  datos.cantidad = Number(datos.cantidad);
  try {
    await api(id ? `/libros/${id}` : '/libros', id ? 'PUT' : 'POST', datos);
    formulario.reset();
    formulario.elements.cantidad.value = 1;
    await cargarLibrosAdmin();
  } catch (error) {
    alert(error.message);
  }
});

actualizarSesion();