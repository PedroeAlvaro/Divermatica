

let idEditando = null;


async function cargarJugadores() {
    try {
        const res  = await apiFetch(`${API_URL}/jugadores.php`);
        if (!res || !res.ok) {
            mostrarMensaje('mensajeEstado', '❌ Error al cargar jugadores', true);
            return;
        }
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
            <td>${escapeHtml(j.id)}</td>
            <td><strong>${escapeHtml(j.nombre)}</strong></td>
            <td>${escapeHtml(j.telefono || '—')}</td>
            <td>${escapeHtml(j.mail || '—')}</td>
            <td>${escapeHtml(j.posicion || '—')}</td>
            <td>${badgeNivel(j.nivel)}</td>
            <td>
                <button class="btn-accion btn-accion-editar"
        data-id="${j.id}"
        data-nombre="${escapeHtml(j.nombre)}"
        data-telefono="${escapeHtml(j.telefono || '')}"
        data-mail="${escapeHtml(j.mail || '')}"
        data-posicion="${escapeHtml(j.posicion || '')}"
        data-nivel="${escapeHtml(j.nivel)}"
        onclick="editarJugadorDesdeBoton(this)"></button>
                <button class="btn-accion btn-accion-eliminar"
                        onclick="eliminarJugador(${j.id})"></button>
            </td>
        </tr>
    `).join('');
}


async function buscarJugador() {
    const texto = document.getElementById('txtBuscar').value.trim();
    const res   = await apiFetch(`${API_URL}/jugadores.php?buscar=${encodeURIComponent(texto)}`);
    if (!res || !res.ok) {
        mostrarMensaje('mensajeEstado', '❌ Error al buscar jugadores', true);
        return;
    }
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

    if (!nombre) { mostrarMensaje('mensajeModalEstado','⚠️ Nombre obligatorio', true); return; }
    if (!nivel)  { mostrarMensaje('mensajeModalEstado','⚠️ Seleccione nivel',    true); return; }
    if (!posicion)  { mostrarMensaje('mensajeModalEstado','⚠️ Seleccione posicion',    true); return; }

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

    if (!res || !res.ok) {
        mostrarMensaje('mensajeModalEstado', '❌ Error al guardar', true);
        return;
    }

    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeModalEstado', esEdicion ? '✅ Jugador actualizado' : '✅ Jugador guardado');
        await cargarJugadores();
        limpiarFormulario();
    } else {
        mostrarMensaje('mensajeModalEstado', '❌ Error al guardar', true);
    }
}


function editarJugador(id, nombre, telefono, mail, posicion, nivel) {
    idEditando = id;
    document.getElementById('fNombre').value   = nombre;
    document.getElementById('fTelefono').value = telefono !== 'null' ? telefono : '';
    document.getElementById('fMail').value     = mail     !== 'null' ? mail     : '';
    document.getElementById('fPosicion').value = posicion !== 'null' ? posicion : '';
    document.getElementById('fNivel').value    = nivel;
    mostrarMensaje('mensajeModalEstado', '✏️ Modifique y presione Guardar');
    document.getElementById('modalJugadorTitulo').textContent = 'Editar Jugador';
    document.getElementById('modalJugador').classList.add('ativo');
}


async function eliminarJugador(id) {
    if (!confirm('¿Eliminar este jugador?')) return;
    const res  = await apiFetch(`${API_URL}/jugadores.php?id=${id}`, { method: 'DELETE' });
    if (!res || !res.ok) {
        mostrarMensaje('mensajeEstado', '❌ Error al eliminar', true);
        return;
    }
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
    limpiarMensaje('mensajeModalEstado');
}

function abrirModalJugador() {
    idEditando = null;
    document.getElementById('modalJugadorTitulo').textContent = 'Nuevo Jugador';
    limpiarFormulario();
    document.getElementById('modalJugador').classList.add('ativo');
}

function cerrarModalJugador() {
    document.getElementById('modalJugador').classList.remove('ativo');
    limpiarMensaje('mensajeModalEstado');
}

function editarJugadorDesdeBoton(btn) {
    editarJugador(
        btn.dataset.id,
        btn.dataset.nombre,
        btn.dataset.telefono,
        btn.dataset.mail,
        btn.dataset.posicion,
        btn.dataset.nivel
    );
}