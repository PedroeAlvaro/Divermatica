let jugadoresEquipos = [];
let deportesCache = [];
let equiposActuales = [];

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

async function iniciarModuloEquipos() {
    try {
        const resD = await apiFetch(`${API_URL}/deportes.php`);
        if (!resD || !resD.ok) {
            mostrarMensaje('mensajeEquipos', '❌ Error al cargar deportes', true);
            return;
        }
        deportesCache = await resD.json();

        const sel = document.getElementById('selDeporte');
        sel.innerHTML = deportesCache.length
            ? deportesCache.map(d => `
                <option value="${d.id}" data-num="${d.num_jugadores}">
                    ${escapeHtml(d.nombre)}
                </option>
            `).join('')
            : '<option value="">Sin deportes disponibles</option>';

        sel.addEventListener('change', cargarJugadoresDelDeporte);
        document.getElementById('numEquipos')
            .addEventListener('input', actualizarNombresEquipos);

        actualizarNombresEquipos();
        await cargarJugadoresDelDeporte();

    } catch (err) {
        console.error(err);
        mostrarMensaje('mensajeEquipos', '❌ Error inesperado', true);
    }
}

async function cargarJugadoresDelDeporte() {
    const sel = document.getElementById('selDeporte');
    const deporteId = sel.value;

    if (!deporteId) {
        jugadoresEquipos = [];
        renderizarListaJugadores();
        return;
    }

    const res = await apiFetch(`${API_URL}/jugadores.php?deporte_id=${deporteId}`);
    if (!res || !res.ok) {
        mostrarMensaje('mensajeEquipos', '❌ Error al cargar jugadores', true);
        return;
    }
    const jugadores = await res.json();
    jugadoresEquipos = Array.isArray(jugadores) ? jugadores : [];
    renderizarListaJugadores();
}

// ─────────────────────────────────────────────
// NOMES EQUIPOS
// ─────────────────────────────────────────────

function actualizarNombresEquipos() {
    const num = Math.max(2, parseInt(document.getElementById('numEquipos').value || 2));
    const cont = document.getElementById('nombresEquipos');

    cont.innerHTML = Array.from({ length: num }, (_, i) => `
        <div style="display:flex;flex-direction:column;gap:4px;">
            <label>EQUIPO ${i + 1}</label>
            <input id="nombreEquipo${i}" placeholder="Equipo ${i + 1}">
        </div>
    `).join('');
}

// ─────────────────────────────────────────────
// LISTA JOGADORES
// ─────────────────────────────────────────────

function renderizarListaJugadores() {
    const lista = document.getElementById('listaJugadoresEquipos');
    const total = document.getElementById('totalJugadores');

    lista.innerHTML = jugadoresEquipos.length
        ? jugadoresEquipos.map(j =>
            `<li>${escapeHtml(j.nombre)} — ${escapeHtml(j.posicion || 'Sin posición')} — ${badgeNivel(j.nivel)}</li>`
          ).join('')
        : '<li>Selecciona un deporte para ver sus jugadores</li>';

    total.textContent = `Total: ${jugadoresEquipos.length}`;
}

// ─────────────────────────────────────────────
// GERAR EQUIPOS — balanceado por nivel Y posición
// ─────────────────────────────────────────────

function generarEquipos() {
    const numEquipos = parseInt(document.getElementById('numEquipos').value, 10);

    const sel = document.getElementById('selDeporte');
    if (!sel.value) {
        mostrarMensaje('mensajeEquipos', '⚠️ Seleccione un deporte', true);
        return;
    }

    if (jugadoresEquipos.length === 0) {
        mostrarMensaje('mensajeEquipos', '⚠️ No hay jugadores para este deporte', true);
        return;
    }

    // Agrupa por posición para que ningún equipo quede
    // solo con jugadores de la misma posición
    const grupos = {};
    jugadoresEquipos.forEach(j => {
        const pos = j.posicion || 'Sin posición';
        if (!grupos[pos]) grupos[pos] = [];
        grupos[pos].push(j);
    });

    const equipos = Array.from({ length: numEquipos }, () => []);

    Object.values(grupos).forEach(grupo => {
        const ordenado = [...grupo].sort(
            (a, b) => puntajeNivel(b.nivel) - puntajeNivel(a.nivel)
        );

        let i = 0;
        let dir = 1;

        for (const j of ordenado) {
            equipos[i].push(j);

            if (dir === 1) {
                if (i === numEquipos - 1) dir = -1;
                else i++;
            } else {
                if (i === 0) dir = 1;
                else i--;
            }
        }
    });

    equiposActuales = equipos;
    mostrarMensaje('mensajeEquipos', '✅ Equipos generados');
    renderizarEquiposCards(equipos);
}

// ─────────────────────────────────────────────
// RENDER CARDS
// ─────────────────────────────────────────────

function renderizarEquiposCards(equipos) {
    const container = document.getElementById('equiposGenerados');
    container.innerHTML = '';

    equipos.forEach((eq, i) => {
        const card = document.createElement('div');
        card.className = 'equipo-card';

        card.innerHTML = `
            <h3>${document.getElementById('nombreEquipo' + i)?.value || ('Equipo ' + (i + 1))}</h3>
            ${eq.map(j => `
                <div>${escapeHtml(j.nombre)} — ${escapeHtml(j.posicion || 'Sin posición')} — ${j.nivel}</div>
            `).join('')}
            <div style="margin-top:8px;">
                <label>Resultado:</label>
                <input type="number" id="puntuacionEquipo${i}" placeholder="Goles / puntos">
            </div>
        `;

        container.appendChild(card);
    });

    document.getElementById('btnGuardarPartido').style.display = equipos.length ? 'inline-block' : 'none';
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

async function guardarPartido() {
    if (equiposActuales.length === 0) return;

    const deporteId = document.getElementById('selDeporte').value;

    const body = {
        deporte_id: parseInt(deporteId, 10),
        numero_equipos: equiposActuales.length,
        equipos: equiposActuales.map((eq, i) => ({
            nombre_equipo: document.getElementById('nombreEquipo' + i)?.value || ('Equipo ' + (i + 1)),
            puntuacion: document.getElementById('puntuacionEquipo' + i)?.value || null,
            jugadores: eq.map(j => ({ id: j.id, nombre: j.nombre, posicion: j.posicion })),
        })),
    };

    const res = await apiFetch(`${API_URL}/partidos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (res && res.ok) {
        mostrarMensaje('mensajeEquipos', '✅ Partido guardado en el historial');
    } else {
        mostrarMensaje('mensajeEquipos', '❌ Error al guardar el partido', true);
    }
}

window.iniciarModuloEquipos = iniciarModuloEquipos;
window.generarEquipos = generarEquipos;
window.guardarPartido = guardarPartido;