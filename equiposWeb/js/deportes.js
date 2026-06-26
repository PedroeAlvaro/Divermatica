

let deporteEditandoId = null;

async function cargarDeportes() {
    const res  = await apiFetch(`${API_URL}/deportes.php`);
    const data = await res.json();
    const cuerpo = document.getElementById('cuerpoTablaDeportes');
    if (!data.length) {
        cuerpo.innerHTML = '<tr><td colspan="4" class="sin-datos">Sin deportes</td></tr>';
        return;
    }
    cuerpo.innerHTML = data.map(d => `
        <tr>
            <td>${d.id}</td>
            <td><strong>${d.nombre}</strong></td>
            <td>${d.num_jugadores}</td>
            <td>
                <button class="btn-secundario"
                        onclick="editarDeporte(${d.id},'${d.nombre}',${d.num_jugadores})"
                        style="padding:5px 10px;font-size:12px;">✏️</button>
                <button class="btn-peligro"
                        onclick="eliminarDeporte(${d.id})"
                        style="padding:5px 10px;font-size:12px;margin-left:4px;">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function guardarDeporte() {
    const nombre = document.getElementById('dNombre').value.trim();
    const num    = parseInt(document.getElementById('dNumJugadores').value);
    if (!nombre) { mostrarMensaje('mensajeDeporte','⚠️ Nombre obligatorio',true); return; }
	

    const deporte  = { nombre, num_jugadores: num };
    const esEdicion = deporteEditandoId !== null;
    if (esEdicion) deporte.id = deporteEditandoId;

    const res  = await apiFetch(`${API_URL}/deportes.php`, {
        method:  esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(deporte)
    });
    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeDeporte', esEdicion ? '✅ Actualizado' : '✅ Guardado');
        await cargarDeportes();
        limpiarDeporte();
    }
}

function editarDeporte(id, nombre, num) {
    deporteEditandoId = id;
    document.getElementById('dNombre').value       = nombre;
    document.getElementById('dNumJugadores').value = num;
    mostrarMensaje('mensajeDeporte', '✏️ Modifique y presione Guardar');
    document.getElementById('modalDeporteTitulo').textContent = 'Editar Deporte';
    document.getElementById('modalDeporte').classList.add('ativo');
}

async function eliminarDeporte(id) {
    if (!confirm('¿Eliminar este deporte?')) return;
    const res  = await apiFetch(`${API_URL}/deportes.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
        mostrarMensaje('mensajeDeporte', '✅ Eliminado');
        await cargarDeportes();
    }
}

function limpiarDeporte() {
    deporteEditandoId = null;
    document.getElementById('dNombre').value       = '';
    document.getElementById('dNumJugadores').value = 7;
    document.getElementById('dNumDisplay').textContent = 7;
    limpiarMensaje('mensajeDeporte');
}

function alterarNum(delta) {
    const input = document.getElementById('dNumJugadores');
    const display = document.getElementById('dNumDisplay');
    let val = parseInt(input.value) + delta;
    val = Math.min(20, Math.max(2, val));
    input.value = val;
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