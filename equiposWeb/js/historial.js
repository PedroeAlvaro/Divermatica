async function cargarHistorial() {
    const res = await apiFetch(`${API_URL}/partidos.php`);
    if (!res || !res.ok) {
        mostrarMensaje('mensajeHistorial', '❌ Error al cargar historial', true);
        return;
    }
    const partidos = await res.json();
    const lista = document.getElementById('listaPartidos');

    lista.innerHTML = partidos.length
        ? partidos.map(p => `
            <li style="cursor:pointer;" onclick="verDetallePartido(${p.id})">
                <strong>${escapeHtml(p.deporte_nombre)}</strong> —
                ${new Date(p.fecha).toLocaleString()} —
                ${p.numero_equipos} equipos
                ${p.resultado_texto ? ' — ' + escapeHtml(p.resultado_texto) : ''}
            </li>
        `).join('')
        : '<li>Todavía no hay partidos guardados</li>';
}

async function verDetallePartido(id) {
    const res = await apiFetch(`${API_URL}/partidos.php?id=${id}`);
    if (!res || !res.ok) {
        mostrarMensaje('mensajeHistorial', '❌ Error al cargar el partido', true);
        return;
    }
    const partido = await res.json();

    document.getElementById('detallePartido').innerHTML = `
        <h3>${escapeHtml(partido.deporte_nombre)} — ${new Date(partido.fecha).toLocaleString()}</h3>
        ${partido.equipos.map(eq => `
            <div class="equipo-card">
                <h4>${escapeHtml(eq.nombre_equipo)} ${eq.puntuacion !== null ? '— ' + eq.puntuacion + ' pts' : ''}</h4>
                ${eq.jugadores.map(j => `<div>${escapeHtml(j.nombre_jugador)} — ${escapeHtml(j.posicion_jugador || 'Sin posición')}</div>`).join('')}
            </div>
        `).join('')}
    `;

    document.getElementById('vistaLista').style.display = 'none';
    document.getElementById('vistaDetalle').style.display = 'block';
}

function volverALista() {
    document.getElementById('vistaDetalle').style.display = 'none';
    document.getElementById('vistaLista').style.display = 'block';
}