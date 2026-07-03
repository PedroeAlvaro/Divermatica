import { puntajeNivel } from './nivel';

export { puntajeNivel };

// Agrupa los jugadores por posición y reparte cada grupo entre los equipos
// en zig-zag según su nivel, para que ningún equipo quede con todos los
// mejores (o todos los peores) jugadores de una misma posición.
export function generarEquiposBalanceados(jugadores, numEquipos) {
    const grupos = {};
    jugadores.forEach(j => {
        const pos = j.posicion || 'Sin posición';
        if (!grupos[pos]) grupos[pos] = [];
        grupos[pos].push(j);
    });

    const equipos = Array.from({ length: numEquipos }, () => []);

    Object.values(grupos).forEach(grupo => {
        const ordenado = [...grupo].sort((a, b) => puntajeNivel(b.nivel) - puntajeNivel(a.nivel));
        let i = 0;
        let dir = 1;
        for (const j of ordenado) {
            equipos[i].push(j);
            if (dir === 1) {
                if (i === numEquipos - 1) dir = -1; else i++;
            } else {
                if (i === 0) dir = 1; else i--;
            }
        }
    });

    return equipos;
}