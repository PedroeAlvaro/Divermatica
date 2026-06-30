let deporteEditandoId = null;

async function cargarDeportes() {
    const res = await apiFetch(`${API_URL}/deportes.php`);
    const cuerpo = document.getElementById('cuerpoTablaDeportes');
    if (!res || !res.ok) {
        cuerpo.innerHTML = '<tr><td colspan="4" class="sin-datos">❌ Error al cargar deportes</td></tr>';
        return;
    }
    const data = await res.json();
    if (!data.length) {
        cuerpo.innerHTML = '<tr><td colspan="4" class="sin-datos">Sin deportes</td></tr>';
        return;
    }
    cuerpo.innerHTML = data.map(d => `
        <tr>
            <td>${escapeHtml(d.id)}</td>
            <td><strong>${escapeHtml(d.nombre)}</strong></td>
            <td>${escapeHtml(d.num_jugadores)}</td>
            <td>
                <button class="btn-accion btn-accion-editar"
        data-id="${d.id}"
        data-nombre="${escapeHtml(d.nombre)}"
        data-num="${d.num_jugadores}"
        onclick="editarDeporteDesdeBoton(this)"></button>
                <button class="btn-accion btn-accion-eliminar"
                        onclick="eliminarDeporte(${d.id})"></button>
            </td>
        </tr>
    `).join('');
}

async function guardarDeporte() {
    const nombre = document.getElementById('dNombre').value.trim();
    const num    = parseInt(document.getElementById('dNumJugadores').value, 10);
    if (!nombre) { mostrarMensaje('mensajeDeporte', '⚠️ Nombre obligatorio', true); return; }

    const deporte = { nombre, num_jugadores: num };
    const esEdicion = deporteEditandoId !== null;
    if (esEdicion) deporte.id = deporteEditandoId;

    const res = await apiFetch(`${API_URL}/deportes.php`, {
        method:  esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(deporte)
    });

    if (!res || !res.ok) {
        mostrarMensaje('mensajeDeporte', '❌ Error al guardar deporte', true);
        return;
    }

    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeDeporte', esEdicion ? '✅ Actualizado' : '✅ Guardado');
        await cargarDeportes();
        cerrarModalDeporte();
    } else {
        mostrarMensaje('mensajeDeporte', '❌ Error al guardar deporte', true);
    }
}

function editarDeporte(id, nombre, num) {
    deporteEditandoId = id;
    document.getElementById('dNombre').value       = nombre;
    document.getElementById('dNumJugadores').value = num;
    document.getElementById('dNumDisplay').textContent = num;
    document.getElementById('modalDeporteTitulo').textContent = 'Editar Deporte';
    document.getElementById('modalDeporte').classList.add('ativo');
}

async function eliminarDeporte(id) {
    if (!confirm('¿Eliminar este deporte?')) return;
    const res = await apiFetch(`${API_URL}/deportes.php?id=${id}`, { method: 'DELETE' });
    if (!res || !res.ok) {
        mostrarMensaje('mensajeDeporte', '❌ Error al eliminar deporte', true);
        return;
    }
    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeDeporte', '✅ Eliminado');
        await cargarDeportes();
    }
}

function limpiarDeporte() {
    deporteEditandoId = null;
    document.getElementById('dNombre').value           = '';
    document.getElementById('dNumJugadores').value     = 7;
    document.getElementById('dNumDisplay').textContent = 7;
    limpiarMensaje('mensajeDeporte');
}

function alterarNum(delta) {
    const input   = document.getElementById('dNumJugadores');
    const display = document.getElementById('dNumDisplay');
    let val = parseInt(input.value) + delta;
    val = Math.min(20, Math.max(2, val));
    input.value        = val;
    display.textContent = val;
}

function abrirModalDeporte() {
    deporteEditandoId = null;
    document.getElementById('modalDeporteTitulo').textContent = 'Nuevo Deporte';
    limpiarDeporte();
    document.getElementById('modalDeporte').classList.add('ativo');
}

function cerrarModalDeporte() {
    document.getElementById('modalDeporte').classList.remove('ativo');
    limpiarMensaje('mensajeDeporte');
}

function editarDeporteDesdeBoton(btn) {
    editarDeporte(
        btn.dataset.id,
        btn.dataset.nombre,
        parseInt(btn.dataset.num, 10)
    );
}