let jugadoresEquipos = [];

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

async function iniciarModuloEquipos() {
    try {
        const [resJ, resD] = await Promise.all([
            apiFetch(`${API_URL}/jugadores.php`),
            apiFetch(`${API_URL}/deportes.php`)
        ]);

        if (!resJ || !resD || !resJ.ok || !resD.ok) {
            mostrarMensaje('mensajeEquipos', '❌ Error al cargar datos', true);
            return;
        }

        const jugadores = await resJ.json();
        const deportes = await resD.json();

        jugadoresEquipos = Array.isArray(jugadores) ? jugadores : [];

        renderizarListaJugadores();

        const sel = document.getElementById('selDeporte');

        sel.innerHTML = Array.isArray(deportes) && deportes.length
            ? deportes.map(d => `
                <option value="${d.id}" data-num="${d.num_jugadores}">
                    ${escapeHtml(d.nombre)}
                </option>
            `).join('')
            : '<option value="">Sin deportes disponibles</option>';

        document.getElementById('numEquipos')
            .addEventListener('input', actualizarNombresEquipos);

        actualizarNombresEquipos();

    } catch (err) {
        console.error(err);
        mostrarMensaje('mensajeEquipos', '❌ Error inesperado', true);
    }
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

    lista.innerHTML = jugadoresEquipos.map(j =>
        `<li>${j.nombre} — ${j.posicion || '—'} — ${badgeNivel(j.nivel)}</li>`
    ).join('');

    total.textContent = `Total: ${jugadoresEquipos.length}`;
}

// ─────────────────────────────────────────────
// GERAR EQUIPOS
// ─────────────────────────────────────────────

function generarEquipos() {
    const numEquipos = parseInt(document.getElementById('numEquipos').value, 10);

    const sel = document.getElementById('selDeporte');
    if (!sel.selectedOptions.length) {
        mostrarMensaje('mensajeEquipos', '⚠️ Seleccione un deporte', true);
        return;
    }

    const limite = parseInt(sel.selectedOptions[0].dataset.num || 0, 10);

    if (!limite || jugadoresEquipos.length === 0) {
        mostrarMensaje('mensajeEquipos', '⚠️ Datos insuficientes', true);
        return;
    }

    const max = limite * numEquipos;
    const usados = jugadoresEquipos.slice(0, max);

    const ordenados = [...usados].sort(
        (a, b) => puntajeNivel(b.nivel) - puntajeNivel(a.nivel)
    );

    const equipos = Array.from({ length: numEquipos }, () => []);

    let i = 0;
    let dir = 1;

    for (const j of ordenados) {
        equipos[i].push(j);

        if (dir === 1) {
            if (i === numEquipos - 1) dir = -1;
            else i++;
        } else {
            if (i === 0) dir = 1;
            else i--;
        }
    }

    renderizarEquiposCards(equipos);
}

// ─────────────────────────────────────────────
// RENDER CARDS
// ─────────────────────────────────────────────

function renderizarEquiposCards(equipos) {
    const container = document.getElementById('resultadoEquipos');
    container.innerHTML = '';

    equipos.forEach((eq, i) => {

        const card = document.createElement('div');
        card.className = 'equipo-card';

        card.innerHTML = `
            <h3>Equipo ${i + 1}</h3>
            ${eq.map(j => `
                <div>${j.nombre} — ${j.nivel}</div>
            `).join('')}
        `;

        container.appendChild(card);
    });
    window.abrirCampo = abrirCampo;
window.fecharCampo = fecharCampo;
window.iniciarModuloEquipos = iniciarModuloEquipos;
window.generarEquipos = generarEquipos;
}