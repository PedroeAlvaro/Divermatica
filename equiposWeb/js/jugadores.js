let idEditando = null;
let deportesCache = [];

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

async function cargarDeportesSelect() {
    const res = await apiFetch(`${API_URL}/deportes.php`);
    if (!res || !res.ok) return;
    deportesCache = await res.json();

    const sel = document.getElementById('fDeporte');
    sel.innerHTML = '<option value="">— Seleccionar —</option>' +
        deportesCache.map(d => `<option value="${d.id}">${escapeHtml(d.nombre)}</option>`).join('');

    sel.addEventListener('change', (e) => cargarPosicionesSelect(e.target.value));
}

async function cargarPosicionesSelect(deporteId, posicionSeleccionada = '') {
    const sel = document.getElementById('fPosicion');

    if (!deporteId) {
        sel.innerHTML = '<option value="">Elige un deporte primero</option>';
        return;
    }

    const res = await apiFetch(`${API_URL}/posiciones.php?deporte_id=${deporteId}`);
    if (!res || !res.ok) {
        sel.innerHTML = '<option value="">Error al cargar posiciones</option>';
        return;
    }
    const posiciones = await res.json();

    sel.innerHTML = '<option value="">— Seleccionar —</option>' +
        posiciones.map(p => `<option value="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</option>`).join('');

    if (posicionSeleccionada) sel.value = posicionSeleccionada;
}


function renderizarTabla(lista) {
    const cuerpo = document.getElementById('cuerpoTabla');
    if (!lista.length) {
        cuerpo.innerHTML = '<tr><td colspan="8" class="sin-datos">No hay jugadores</td></tr>';
        return;
    }
    cuerpo.innerHTML = lista.map(j => `
        <tr>
            <td>${escapeHtml(j.id)}</td>
            <td><strong>${escapeHtml(j.nombre)}</strong></td>
            <td>${escapeHtml(j.telefono || '—')}</td>
            <td>${escapeHtml(j.mail || '—')}</td>
            <td>${escapeHtml(j.deporte_nombre || '—')}</td>
            <td>${escapeHtml(j.posicion || '—')}</td>
            <td>${badgeNivel(j.nivel)}</td>
            <td>
                <button class="btn-accion btn-accion-editar"
        data-id="${j.id}"
        data-nombre="${escapeHtml(j.nombre)}"
        data-telefono="${escapeHtml(j.telefono || '')}"
        data-mail="${escapeHtml(j.mail || '')}"
        data-deporte-id="${j.deporte_id || ''}"
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
    const nombre    = document.getElementById('fNombre').value.trim();
    const nivel     = document.getElementById('fNivel').value;
    const deporteId = document.getElementById('fDeporte').value;
    const posicion  = document.getElementById('fPosicion').value;

    if (!nombre) { mostrarMensaje('mensajeModalEstado','⚠️ Nombre obligatorio', true); return; }
    if (!nivel)  { mostrarMensaje('mensajeModalEstado','⚠️ Seleccione nivel',    true); return; }
    if (!deporteId) { mostrarMensaje('mensajeModalEstado','⚠️ Seleccione deporte', true); return; }

    const jugador = {
        nombre,
        telefono:   document.getElementById('fTelefono').value.trim(),
        mail:       document.getElementById('fMail').value.trim(),
        deporte_id: parseInt(deporteId, 10),
        posicion,
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


async function editarJugador(id, nombre, telefono, mail, deporteId, posicion, nivel) {
    idEditando = id;
    document.getElementById('fNombre').value   = nombre;
    document.getElementById('fTelefono').value = telefono !== 'null' ? telefono : '';
    document.getElementById('fMail').value     = mail     !== 'null' ? mail     : '';
    document.getElementById('fDeporte').value  = deporteId || '';
    document.getElementById('fNivel').value    = nivel;

    await cargarPosicionesSelect(deporteId, posicion);

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
    document.getElementById('fDeporte').value = '';
    document.getElementById('fPosicion').innerHTML = '<option value="">Elige un deporte primero</option>';
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
        btn.dataset.deporteId,
        btn.dataset.posicion,
        btn.dataset.nivel
    );
}