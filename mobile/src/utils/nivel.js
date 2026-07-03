// Colores e helpers relacionados co nivel do xogador e a súa posición.
// As cores seguen exactamente a paleta usada na páxina web (equiposWeb/css/style.css)
// para que a identidade visual sexa igual en mobile e en web.

export const NIVEL_COLORS = {
    'Medio': '#ffc107',
    'Bueno': '#00e676',
    'Muy Bueno': '#00d4ff',
};

export const NIVEL_COLORS_DIM = {
    'Medio': 'rgba(255,193,7,0.16)',
    'Bueno': 'rgba(0,230,118,0.16)',
    'Muy Bueno': 'rgba(0,212,255,0.16)',
};

export const NIVEL_DEFAULT_COLOR = '#7a8290';

export function colorNivel(nivel) {
    return NIVEL_COLORS[nivel] || NIVEL_DEFAULT_COLOR;
}

export function colorNivelDim(nivel) {
    return NIVEL_COLORS_DIM[nivel] || 'rgba(122,130,144,0.16)';
}

export function puntajeNivel(nivel) {
    if (nivel === 'Muy Bueno') return 3;
    if (nivel === 'Bueno') return 2;
    return 1;
}

// Devuelve las iniciales de una posición: "Delantero" -> "DEL", "Base" -> "BAS",
// "Ala Pívot" -> "AP"
export function inicialesPosicion(posicion) {
    if (!posicion) return '—';
    const palabras = posicion.trim().split(/\s+/).filter(Boolean);
    if (palabras.length === 1) {
        return palabras[0].substring(0, 3).toUpperCase();
    }
    return palabras.map(p => p[0]).join('').substring(0, 3).toUpperCase();
}