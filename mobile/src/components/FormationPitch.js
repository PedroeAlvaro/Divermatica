import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlayerJerseyCard from './PlayerJerseyCard';

// Agrupa los jugadores por posición y ordena los grupos de abajo (orden más
// bajo, ej. portero) hacia arriba (orden más alto, ej. delantero), usando la
// lista de posiciones del deporte (con su "orden") cuando está disponible.
function agruparPorPosicion(jugadores, posicionesInfo) {
    const grupos = {};
    jugadores.forEach(j => {
        const pos = j.posicion || 'Sin posición';
        if (!grupos[pos]) grupos[pos] = [];
        grupos[pos].push(j);
    });

    const ordenDe = {};
    (posicionesInfo || []).forEach(p => { ordenDe[p.nombre] = p.orden ?? 0; });

    return Object.keys(grupos)
        .map(nombre => ({
            nombre,
            jugadores: grupos[nombre],
            orden: nombre === 'Sin posición' ? -1 : (ordenDe[nombre] ?? 999),
        }))
        .sort((a, b) => a.orden - b.orden);
}

export default function FormationPitch({ equipo, posicionesInfo, small }) {
    const filas = agruparPorPosicion(equipo, posicionesInfo);
    const muchasFilas = filas.length >= 5;

    return (
        <View style={styles.campo}>
            {/* Textura de franjas del césped */}
            <View style={styles.franjas} pointerEvents="none">
                {Array.from({ length: 8 }).map((_, i) => (
                    <View key={i} style={[styles.franja, { backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'transparent' }]} />
                ))}
            </View>

            {/* Líneas del campo */}
            <View style={styles.lineaMedio} pointerEvents="none" />
            <View style={styles.circuloCentro} pointerEvents="none" />
            <View style={styles.puntoCentro} pointerEvents="none" />

            {/* Área superior (ataque) */}
            <View style={[styles.area, styles.areaArriba]} pointerEvents="none" />
            <View style={[styles.areaChica, styles.areaChicaArriba]} pointerEvents="none" />

            {/* Área inferior (portero) */}
            <View style={[styles.area, styles.areaAbajo]} pointerEvents="none" />
            <View style={[styles.areaChica, styles.areaChicaAbajo]} pointerEvents="none" />

            {/* Filas de jugadores, de portero (abajo) a delantero (arriba) */}
            <View style={styles.filasContenedor}>
                {filas.map((fila, idx) => (
                    <View key={fila.nombre + idx} style={[styles.fila, muchasFilas && styles.filaCompacta]}>
                        {fila.jugadores.map(j => (
                            <PlayerJerseyCard key={j.id} jugador={j} size={small || muchasFilas ? 'small' : 'normal'} />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}

const VERDE_1 = '#0f6b3a';
const LINEA = 'rgba(255,255,255,0.85)';

const styles = StyleSheet.create({
    campo: {
        width: '100%',
        aspectRatio: 0.64,
        backgroundColor: VERDE_1,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: LINEA,
        overflow: 'hidden',
        position: 'relative',
    },
    franjas: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
    franja: { flex: 1 },
    lineaMedio: {
        position: 'absolute', left: 0, right: 0, top: '50%',
        height: 2, backgroundColor: LINEA,
    },
    circuloCentro: {
        position: 'absolute', top: '50%', left: '50%',
        width: 78, height: 78, borderRadius: 39,
        marginTop: -39, marginLeft: -39,
        borderWidth: 2, borderColor: LINEA,
    },
    puntoCentro: {
        position: 'absolute', top: '50%', left: '50%',
        width: 5, height: 5, borderRadius: 2.5,
        marginTop: -2.5, marginLeft: -2.5,
        backgroundColor: LINEA,
    },
    area: {
        position: 'absolute', left: '18%', right: '18%',
        height: '13%', borderWidth: 2, borderColor: LINEA,
    },
    areaArriba: { top: 0, borderTopWidth: 0 },
    areaAbajo: { bottom: 0, borderBottomWidth: 0 },
    areaChica: {
        position: 'absolute', left: '34%', right: '34%',
        height: '6%', borderWidth: 2, borderColor: LINEA,
    },
    areaChicaArriba: { top: 0, borderTopWidth: 0 },
    areaChicaAbajo: { bottom: 0, borderBottomWidth: 0 },
    filasContenedor: {
        flex: 1,
        flexDirection: 'column-reverse',
        justifyContent: 'space-evenly',
        paddingVertical: 14,
        paddingHorizontal: 6,
    },
    fila: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        rowGap: 10,
    },
    filaCompacta: { rowGap: 4 },
});