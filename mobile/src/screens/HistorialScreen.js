import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export default function HistorialScreen() {
    const [partidos, setPartidos] = useState([]);
    const [detalle, setDetalle] = useState(null);

    const cargar = useCallback(async () => {
        const res = await apiFetch('/partidos.php');
        if (res && res.ok) setPartidos(await res.json());
    }, []);

    useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

    async function verDetalle(id) {
        const res = await apiFetch(`/partidos.php?id=${id}`);
        if (res && res.ok) setDetalle(await res.json());
    }

    if (detalle) {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={() => setDetalle(null)}>
                    <Text style={styles.volver}>‹ Volver al historial</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>{detalle.deporte_nombre} — {new Date(detalle.fecha).toLocaleString()}</Text>
                {detalle.equipos.map(eq => (
                    <View key={eq.id} style={styles.card}>
                        <Text style={styles.cardTitulo}>{eq.nombre_equipo} {eq.puntuacion !== null ? `— ${eq.puntuacion} pts` : ''}</Text>
                        {eq.jugadores.map(j => (
                            <Text key={j.id} style={styles.cardJugador}>{j.nombre_jugador} — {j.posicion_jugador || 'Sin posición'}</Text>
                        ))}
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Historial de partidos</Text>
            <FlatList
                data={partidos}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => verDetalle(item.id)}>
                        <Text style={styles.itemNombre}>{item.deporte_nombre}</Text>
                        <Text style={styles.itemSub}>{new Date(item.fecha).toLocaleString()} · {item.numero_equipos} equipos</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.hint}>Todavía no hay partidos guardados</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115', padding: 16 },
    titulo: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    item: { backgroundColor: '#1c1f26', padding: 12, borderRadius: 8, marginBottom: 8 },
    itemNombre: { color: '#fff', fontWeight: 'bold' },
    itemSub: { color: '#999' },
    hint: { color: '#999' },
    volver: { color: '#00c2ff', marginBottom: 12 },
    card: { backgroundColor: '#1c1f26', borderRadius: 8, padding: 12, marginBottom: 12 },
    cardTitulo: { color: '#00c2ff', fontWeight: 'bold', marginBottom: 6 },
    cardJugador: { color: '#fff' },
});