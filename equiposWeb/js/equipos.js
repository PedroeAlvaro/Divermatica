let jugadoresEquipos = [];

async function iniciarModuloEquipos() {
    try {
        const resJ = await fetch(`${API_URL}/jugadores.php`);
        jugadoresEquipos = await resJ.json();
        renderizarListaJugadores();

        const resD = await fetch(`${API_URL}/deportes.php`);
        const deportes = await resD.json();
        const sel = document.getElementById('selDeporte');
        sel.innerHTML = deportes.map(d =>
            `<option value="${d.id}" data-num="${d.num_jugadores}">${d.nombre}</option>`
        ).join('');

        document.getElementById('numEquipos')
            .addEventListener('input', actualizarNombresEquipos);
        actualizarNombresEquipos();

    } catch (e) {
        mostrarMensaje('mensajeEquipos', '❌ Error al cargar datos', true);
    }
}

function actualizarNombresEquipos() {
    const num = parseInt(document.getElementById('numEquipos').value);
    const contenedor = document.getElementById('nombresEquipos');
    contenedor.innerHTML = Array.from({ length: num }, (_, i) => `
        <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:12px;font-weight:bold;color:#546E7A;">
                EQUIPO ${i + 1}
            </label>
            <input type="text" id="nombreEquipo${i}"
                   placeholder="Equipo ${i + 1}"
                   style="padding:8px;border:1px solid #CFD8DC;
                          border-radius:6px;font-size:13px;width:130px;">
        </div>
    `).join('');
}

function renderizarListaJugadores() {
    const lista = document.getElementById('listaJugadoresEquipos');
    const total = document.getElementById('totalJugadores');
    lista.innerHTML = jugadoresEquipos.map(j =>
        `<li>• ${j.nombre} — <em>${j.posicion || '—'}</em> — ${badgeNivel(j.nivel)}</li>`
    ).join('');
    total.textContent = 'Total: ' + jugadoresEquipos.length + ' jugadores';
}

function generarEquipos() {
    const numEquipos = parseInt(document.getElementById('numEquipos').value);

    const selDeporte = document.getElementById('selDeporte');
    const limiteXEquipo = parseInt(
        selDeporte.selectedOptions[0]?.dataset.num || 99
    );

    const nombres = Array.from({ length: numEquipos }, (_, i) => {
        const val = document.getElementById(`nombreEquipo${i}`).value.trim();
        return val || `Equipo ${i + 1}`;
    });

    if (!jugadoresEquipos.length) {
        mostrarMensaje('mensajeEquipos', '⚠️ No hay jugadores registrados', true);
        return;
    }
    if (jugadoresEquipos.length < numEquipos) {
        mostrarMensaje('mensajeEquipos', `⚠️ Necesita al menos ${numEquipos} jugadores`, true);
        return;
    }

    const maxJugadores = limiteXEquipo * numEquipos;
    const jugadoresUsados = jugadoresEquipos.slice(0, maxJugadores);

    if (jugadoresEquipos.length > maxJugadores) {
        mostrarMensaje('mensajeEquipos',
            `⚠️ Solo se usarán ${maxJugadores} jugadores (${limiteXEquipo} por equipo). ` +
            `${jugadoresEquipos.length - maxJugadores} quedan fuera.`, false);
    }

    // Snake draft
    const ordenados = [...jugadoresUsados].sort(
        (a, b) => puntajeNivel(b.nivel) - puntajeNivel(a.nivel)
    );
    const equipos = Array.from({ length: numEquipos }, () => []);
    let direccionIda = true, indice = 0;

    for (const jugador of ordenados) {
        if (equipos[indice].length >= limiteXEquipo) continue;
        equipos[indice].push(jugador);
        if (direccionIda) {
            if (indice === numEquipos - 1) direccionIda = false;
            else indice++;
        } else {
            if (indice === 0) direccionIda = true;
            else indice--;
        }
    }

    renderizarEquiposCards(equipos, nombres);

if (jugadoresEquipos.length <= maxJugadores) {
    mostrarMensaje('mensajeEquipos',
        `✅ ${jugadoresUsados.length} jugadores distribuidos en ${numEquipos} equipos`);
}
}

// 
// Campo dinâmico por desporte + Draft visual
// 

// SVGs dos campos — um por desporte
const CAMPOS_SVG = {
    'football': `
    <svg class="campo-football" width="520" height="340" viewBox="0 0 520 340">
        <rect class="relva"     width="520" height="340"/>
        <rect class="relva-alt" x="0" y="0" width="260" height="340" opacity="0.15"/>
        <!-- Linha central -->
        <line class="linha" x1="260" y1="10" x2="260" y2="330" stroke-width="2"/>
        <circle class="linha" cx="260" cy="170" r="50" stroke-width="2"/>
        <circle class="linha" cx="260" cy="170" r="3" fill="white"/>
        <!-- Área esq -->
        <rect class="linha" x="10" y="95" width="80" height="150" stroke-width="2"/>
        <rect class="linha" x="10" y="130" width="30" height="80" stroke-width="2"/>
        <!-- Área dir -->
        <rect class="linha" x="430" y="95" width="80" height="150" stroke-width="2"/>
        <rect class="linha" x="480" y="130" width="30" height="80" stroke-width="2"/>
        <!-- Balizas -->
        <rect class="linha" x="5"   y="145" width="10" height="50" stroke-width="2"/>
        <rect class="linha" x="505" y="145" width="10" height="50" stroke-width="2"/>
        <!-- Contorno -->
        <rect class="linha" x="10" y="10" width="500" height="320" stroke-width="2"/>
    </svg>`,

    'fut7': `
    <svg class="campo-fut7" width="460" height="300" viewBox="0 0 460 300">
        <rect class="relva" width="460" height="300"/>
        <line class="linha" x1="230" y1="10" x2="230" y2="290" stroke-width="2"/>
        <circle class="linha" cx="230" cy="150" r="40" stroke-width="2"/>
        <circle class="linha" cx="230" cy="150" r="3" fill="white"/>
        <!-- Área esq -->
        <rect class="linha" x="10" y="90" width="65" height="120" stroke-width="2"/>
        <rect class="linha" x="10" y="115" width="25" height="70" stroke-width="2"/>
        <!-- Área dir -->
        <rect class="linha" x="385" y="90" width="65" height="120" stroke-width="2"/>
        <rect class="linha" x="425" y="115" width="25" height="70" stroke-width="2"/>
        <!-- Balizas -->
        <rect class="linha" x="5"   y="125" width="8" height="50" stroke-width="2"/>
        <rect class="linha" x="447" y="125" width="8" height="50" stroke-width="2"/>
        <rect class="linha" x="10" y="10" width="440" height="280" stroke-width="2"/>
    </svg>`,

    'futsal': `
    <svg class="campo-futsal" width="460" height="280" viewBox="0 0 460 280">
        <rect class="piso" width="460" height="280"/>
        <line class="linha" x1="230" y1="10" x2="230" y2="270" stroke-width="2"/>
        <circle class="linha" cx="230" cy="140" r="35" stroke-width="2"/>
        <circle class="linha" cx="230" cy="140" r="3" fill="white"/>
        <!-- Áreas -->
        <rect class="linha" x="10" y="85" width="55" height="110" stroke-width="2"/>
        <rect class="linha" x="395" y="85" width="55" height="110" stroke-width="2"/>
        <!-- Semicírculos -->
        <path class="linha" d="M65,85 Q110,140 65,195" stroke-width="2"/>
        <path class="linha" d="M395,85 Q350,140 395,195" stroke-width="2"/>
        <!-- Balizas -->
        <rect class="linha" x="5"   y="118" width="8" height="44" stroke-width="2"/>
        <rect class="linha" x="447" y="118" width="8" height="44" stroke-width="2"/>
        <rect class="linha" x="10" y="10" width="440" height="260" stroke-width="2"/>
    </svg>`,

    'basquete': `
    <svg class="campo-basquete" width="500" height="300" viewBox="0 0 500 300">
        <rect class="piso" width="500" height="300"/>
        <!-- Keys -->
        <rect class="key" x="10" y="100" width="120" height="100"/>
        <rect class="key" x="370" y="100" width="120" height="100"/>
        <!-- Linha central -->
        <line class="linha" x1="250" y1="10" x2="250" y2="290" stroke-width="2"/>
        <circle class="linha" cx="250" cy="150" r="45" stroke-width="2"/>
        <circle class="linha" cx="250" cy="150" r="3" fill="white"/>
        <!-- Arcos 3pts -->
        <path class="linha" d="M10,70 Q130,150 10,230" stroke-width="2"/>
        <path class="linha" d="M490,70 Q370,150 490,230" stroke-width="2"/>
        <!-- Tabelas -->
        <rect class="linha" x="110" y="133" width="4" height="34" stroke-width="2"/>
        <rect class="linha" x="386" y="133" width="4" height="34" stroke-width="2"/>
        <circle class="linha" cx="130" cy="150" r="18" stroke-width="2"/>
        <circle class="linha" cx="370" cy="150" r="18" stroke-width="2"/>
        <rect class="linha" x="10" y="10" width="480" height="280" stroke-width="2"/>
    </svg>`,

    'andebol': `
    <svg class="campo-andebol" width="500" height="300" viewBox="0 0 500 300">
        <rect class="piso" width="500" height="300"/>
        <line class="linha" x1="250" y1="10" x2="250" y2="290" stroke-width="2"/>
        <circle class="linha" cx="250" cy="150" r="40" stroke-width="2"/>
        <!-- Área de golo (D de 6m) -->
        <path class="linha" d="M10,90 Q110,150 10,210" stroke-width="2.5"/>
        <path class="linha" d="M490,90 Q390,150 490,210" stroke-width="2.5"/>
        <!-- Linha 9m tracejada -->
        <path class="linha" d="M10,65 Q145,150 10,235"
              stroke-width="1.5" stroke-dasharray="8,6"/>
        <path class="linha" d="M490,65 Q355,150 490,235"
              stroke-width="1.5" stroke-dasharray="8,6"/>
        <!-- Balizas -->
        <rect class="linha" x="5"   y="125" width="10" height="50" stroke-width="2"/>
        <rect class="linha" x="485" y="125" width="10" height="50" stroke-width="2"/>
        <rect class="linha" x="10" y="10" width="480" height="280" stroke-width="2"/>
    </svg>`,

    'hoquei': `
    <svg class="campo-hoquei" width="500" height="280" viewBox="0 0 500 280">
        <rect class="piso" width="500" height="280"/>
        <!-- Cantos arredondados da pista -->
        <rect class="balizas" x="10" y="10" width="480" height="260" rx="30" ry="30"/>
        <!-- Linha central -->
        <line class="linha" x1="250" y1="20" x2="250" y2="260" stroke-width="2.5"/>
        <circle class="linha" cx="250" cy="140" r="35" stroke-width="2"/>
        <circle class="linha" cx="250" cy="140" r="4" fill="white"/>
        <!-- Zonas de penalti -->
        <circle class="linha" cx="90"  cy="140" r="50" stroke-width="2"/>
        <circle class="linha" cx="410" cy="140" r="50" stroke-width="2"/>
        <!-- Pontos de penalti -->
        <circle cx="60"  cy="140" r="4" fill="white"/>
        <circle cx="440" cy="140" r="4" fill="white"/>
        <!-- Balizas -->
        <rect class="balizas" x="12"  y="115" width="18" height="50" rx="3"/>
        <rect class="balizas" x="470" y="115" width="18" height="50" rx="3"/>
    </svg>`
};

// Mapeamento nome do deporte (minúsculas) → chave do SVG
const DEPORTE_MAP = {
    'football': 'football', 'fútbol': 'football', 'futbol': 'football',
    'fútbol 11': 'football', 'futbol 11': 'football',
    'fútbol 7': 'fut7', 'futbol 7': 'fut7', 'fut7': 'fut7',
    'futsal': 'futsal', 'fútsal': 'futsal',
    'baloncesto': 'basquete', 'basketball': 'basquete', 'basquete': 'basquete',
    'balonmano': 'andebol', 'andebol': 'andebol', 'handball': 'andebol',
    'hockey': 'hoquei', 'hóquei': 'hoquei', 'hoquei': 'hoquei',
    'hockey en patines': 'hoquei'
};

// Cria o overlay uma única vez
function criarOverlayCampo() {
    if (document.getElementById('campoOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id        = 'campoOverlay';
    overlay.className = 'campo-overlay';
    overlay.innerHTML = `
        <button class="fechar-campo" onclick="fecharCampo()">✕</button>
        <div class="campo-svg-wrapper" id="campoSvgWrapper"></div>`;
    overlay.addEventListener('click', e => {
        if (e.target === overlay) fecharCampo();
    });
    document.body.appendChild(overlay);
}

function abrirCampo() {
    criarOverlayCampo();
    const sel    = document.getElementById('selDeporte');
    const nome   = sel.selectedOptions[0]?.text?.toLowerCase().trim() || '';
    const chave  = DEPORTE_MAP[nome] || 'fut7';
    const svg    = CAMPOS_SVG[chave] || CAMPOS_SVG['fut7'];

    document.getElementById('campoSvgWrapper').innerHTML = svg;
    requestAnimationFrame(() => {
        document.getElementById('campoOverlay').classList.add('ativo');
    });
}

function fecharCampo() {
    const overlay = document.getElementById('campoOverlay');
    if (overlay) overlay.classList.remove('ativo');
}

// -------------------------------------------------------
// Renderiza resultado como cards com animação draft
// -------------------------------------------------------
function renderizarEquiposCards(equipos, nomes) {
    const container = document.getElementById('resultadoEquipos');
    container.innerHTML = '';

    equipos.forEach((equipo, i) => {
        const puntaje = equipo.reduce((s, j) => s + puntajeNivel(j.nivel), 0);

        const card = document.createElement('div');
        card.className = 'equipo-card';
        card.innerHTML = `
            <div class="equipo-card-titulo">⚽ ${nomes[i].toUpperCase()}</div>
            <div class="equipo-card-puntaje">Puntaje: ${puntaje} | ${equipo.length} jugadores</div>
            <div id="listaEquipo${i}"></div>`;
        container.appendChild(card);

        // Entrada sequencial dos jogadores
        const lista = card.querySelector(`#listaEquipo${i}`);
        equipo.forEach((j, idx) => {
            setTimeout(() => {
                const nivelClass = j.nivel === 'Muy Bueno'
                    ? 'nivel-muybueno-card'
                    : j.nivel === 'Bueno'
                        ? 'nivel-bueno-card'
                        : 'nivel-medio-card';

                const div = document.createElement('div');
                div.className = `card-jugador ${nivelClass} draft-animar`;
                div.style.animationDelay = '0ms';
                div.innerHTML = `
                    <strong style="color:#E3F2FD">${j.nombre}</strong>
                    <span style="color:#90A4AE;font-size:11px;margin-left:6px;">
                        ${j.posicion || '—'}
                    </span>
                    <span style="float:right">${badgeNivel(j.nivel)}</span>`;
                lista.appendChild(div);

                // Destaque ao aparecer
                setTimeout(() => div.classList.add('draft-highlight'), 200);
            }, idx * 120 + i * 80);
        });
    });
}