import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colorNivel, colorNivelDim, inicialesPosicion } from '../utils/nivel';

// Card en forma de camisola para representar un jugador dentro de una
// formación. El color del borde / mangas cambia según el nivel del
// jugador (Medio, Bueno, Muy Bueno), igual que en la web.
export default function PlayerJerseyCard({ jugador, size = 'normal' }) {
    const color = colorNivel(jugador.nivel);
    const colorDim = colorNivelDim(jugador.nivel);
    const iniciales = inicialesPosicion(jugador.posicion);
    const letra = (jugador.nombre || '?').trim().charAt(0).toUpperCase();
    const small = size === 'small';

    const jerseySize = small ? 44 : 56;
    const sleeveW = small ? 13 : 16;
    const sleeveH = small ? 16 : 20;

    return (
        <View style={[styles.wrap, { width: small ? 62 : 78 }]}>
            <View style={[styles.badge, { backgroundColor: colorDim, borderColor: color }]}>
                <Text style={[styles.badgeTexto, { color }]} numberOfLines={1}>{iniciales}</Text>
            </View>

            <View style={styles.jerseyWrap}>
                <View
                    style={[
                        styles.manga,
                        {
                            width: sleeveW, height: sleeveH, borderColor: color,
                            top: small ? -3 : -4, left: small ? -7 : -9,
                            transform: [{ rotate: '-24deg' }],
                        },
                    ]}
                />
                <View
                    style={[
                        styles.manga,
                        {
                            width: sleeveW, height: sleeveH, borderColor: color,
                            top: small ? -3 : -4, right: small ? -7 : -9,
                            transform: [{ rotate: '24deg' }],
                        },
                    ]}
                />

                <View style={[styles.torso, { width: jerseySize, height: jerseySize - 4, borderColor: color }]}>
                    <View style={[styles.cuello, { backgroundColor: color }]} />
                    <Text style={[styles.letra, { color }]}>{letra}</Text>
                </View>
            </View>

            <Text style={styles.nombre} numberOfLines={1}>{jugador.nombre}</Text>
            <View style={[styles.nivelPill, { backgroundColor: colorDim }]}>
                <View style={[styles.nivelDot, { backgroundColor: color }]} />
                <Text style={[styles.nivelTexto, { color }]} numberOfLines={1}>{jugador.nivel || '—'}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    badge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 3,
        maxWidth: 60,
    },
    badgeTexto: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    jerseyWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    manga: {
        position: 'absolute',
        backgroundColor: '#eef2f7',
        borderWidth: 2,
        borderRadius: 6,
    },
    torso: {
        backgroundColor: '#eef2f7',
        borderWidth: 2.2,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 4,
    },
    cuello: {
        position: 'absolute',
        top: -3,
        width: 16,
        height: 7,
        borderRadius: 4,
    },
    letra: { fontSize: 19, fontWeight: '800' },
    nombre: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4, maxWidth: 74, textAlign: 'center' },
    nivelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 8,
        marginTop: 3,
    },
    nivelDot: { width: 5, height: 5, borderRadius: 3 },
    nivelTexto: { fontSize: 8.5, fontWeight: '700' },
});