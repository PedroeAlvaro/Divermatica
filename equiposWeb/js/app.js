// ─────────────────────────────────────────────
// app.js — adicionada camada de auth
// ─────────────────────────────────────────────

const API_URL = 'http://192.168.0.141/equiposWeb/api';

// ── Autenticação ─────────────────────────────

const PAGINAS_PROTEGIDAS = ['jugadores.html', 'deportes.html', 'equipos.html'];

function _paginaActual() {
    return window.location.pathname.split('/').pop();
}

function getToken() {
    return localStorage.getItem('matchora_token');
}

function guardarToken(token) {
    localStorage.setItem('matchora_token', token);
}

function eliminarToken() {
    localStorage.removeItem('matchora_token');
}

function _tokenExpirado(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}

function verificarSesion() {
    const pagina = _paginaActual();
    if (!PAGINAS_PROTEGIDAS.includes(pagina)) return;

    const token = getToken();
    if (!token || _tokenExpirado(token)) {
        eliminarToken();
        window.location.href = 'login.html';
    }
}

function cerrarSesion() {
    eliminarToken();
    window.location.href = 'login.html';
}

async function apiFetch(url, opciones = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(opciones.headers || {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    };

    const res = await fetch(url, { ...opciones, headers });

    if (res.status === 401) {
        eliminarToken();
        window.location.href = 'login.html';
        return;
    }

    return res;
}

verificarSesion();

// ── Utilitários (inalterados) ─────────────────

function mostrarMensaje(elementoId, texto, esError = false) {
    const el = document.getElementById(elementoId);
    if (el) {
        el.textContent = texto;
        el.style.color = esError ? '#C62828' : '#2E7D32';
    }
}

function limpiarMensaje(elementoId) {
    const el = document.getElementById(elementoId);
    if (el) el.textContent = '';
}

function badgeNivel(nivel) {
    const clases = {
        'Medio':     'nivel-medio',
        'Bueno':     'nivel-bueno',
        'Muy Bueno': 'nivel-muybueno'
    };
    return `<span class="${clases[nivel] || 'nivel-medio'}">${nivel}</span>`;
}

function puntajeNivel(nivel) {
    if (nivel === 'Muy Bueno') return 3;
    if (nivel === 'Bueno')     return 2;
    return 1;
}