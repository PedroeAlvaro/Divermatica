

let idEditando = null;


async function cargarJugadores() {
    try {
        const res  = await apiFetch(`${API_URL}/jugadores.php`);
        const data = await res.json();
        renderizarTabla(data);
    } catch (e) {
        mostrarMensaje('mensajeEstado', '❌ Error al conectar con el servidor', true);
    }
}


function renderizarTabla(lista) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!lista.length) {
        cuerpo.innerHTML = '<tr><td colspan="7" class="sin-datos">No hay jugadores</td></tr>';
        return;
    }
    cuerpo.innerHTML = lista.map(j => `
        <tr>
            <td>${j.id}</td>
            <td><strong>${j.nombre}</strong></td>
            <td>${j.telefono || '—'}</td>
            <td>${j.mail || '—'}</td>
            <td>${j.posicion || '—'}</td>
            <td>${badgeNivel(j.nivel)}</td>
            <td>
                <button class="btn-accion btn-accion-editar" onclick="editarJugador(${j.id},'${j.nombre}','${j.telefono}','${j.mail}','${j.posicion}','${j.nivel}')"></button>
                <button class="btn-accion btn-accion-eliminar" onclick="eliminarJugador(${j.id})"></button>            </td>
        </tr>
    `).join('');
}


async function buscarJugador() {
    const texto = document.getElementById('txtBuscar').value.trim();
    const res   = await apiFetch(`${API_URL}/jugadores.php?buscar=${encodeURIComponent(texto)}`);
    const data  = await res.json();
    renderizarTabla(data);
}

async function mostrarTodos() {
    document.getElementById('txtBuscar').value = '';
    await cargarJugadores();
}


async function guardarJugador() {
    const nombre = document.getElementById('fNombre').value.trim();
    const nivel  = document.getElementById('fNivel').value;
	const posicion  = document.getElementById('fPosicion').value;

	

    if (!nombre) { mostrarMensaje('mensajeEstado','⚠️ Nombre obligatorio', true); return; }
    if (!nivel)  { mostrarMensaje('mensajeEstado','⚠️ Seleccione nivel',    true); return; }
	if (!posicion)  { mostrarMensaje('mensajeEstado','⚠️ Seleccione posicion',    true); return; }


    const jugador = {
        nombre,
        telefono: document.getElementById('fTelefono').value.trim(),
        mail:     document.getElementById('fMail').value.trim(),
        posicion: document.getElementById('fPosicion').value,
        nivel
    };

    const esEdicion = idEditando !== null;
    if (esEdicion) jugador.id = idEditando;

    const res = await apiFetch(`${API_URL}/jugadores.php`, {
        method:  esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(jugador)
    });

    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeEstado', esEdicion ? '✅ Jugador actualizado' : '✅ Jugador guardado');
        await cargarJugadores();
        limpiarFormulario();
    } else {
        mostrarMensaje('mensajeEstado', '❌ Error al guardar', true);
    }
}


function editarJugador(id, nombre, telefono, mail, posicion, nivel) {
    idEditando = id;
    document.getElementById('fNombre').value   = nombre;
    document.getElementById('fTelefono').value = telefono !== 'null' ? telefono : '';
    document.getElementById('fMail').value     = mail     !== 'null' ? mail     : '';
    document.getElementById('fPosicion').value = posicion !== 'null' ? posicion : '';
    document.getElementById('fNivel').value    = nivel;
    mostrarMensaje('mensajeEstado', '✏️ Modifique y presione Guardar');
    document.getElementById('modalJugadorTitulo').textContent = 'Editar Jugador';
    document.getElementById('modalJugador').classList.add('ativo');
}


async function eliminarJugador(id) {
    if (!confirm('¿Eliminar este jugador?')) return;
    const res  = await apiFetch(`${API_URL}/jugadores.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeEstado', '✅ Jugador eliminado');
        await cargarJugadores();
    }
}


function limpiarFormulario() {
    idEditando = null;
    ['fNombre','fTelefono','fMail'].forEach(id =>
        document.getElementById(id).value = ''
    );
    document.getElementById('fPosicion').value = '';
    document.getElementById('fNivel').value    = '';
    limpiarMensaje('mensajeEstado');
}

function abrirModalJugador() {
    idEditando = null;
    document.getElementById('modalJugadorTitulo').textContent = 'Nuevo Jugador';
    limpiarFormulario();
    document.getElementById('modalJugador').classList.add('ativo');
}

function cerrarModalJugador() {
    document.getElementById('modalJugador').classList.remove('ativo');
    limpiarMensaje('mensajeEstado');
}