import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';
import { generarEquiposBalanceados } from '../utils/teamBalancer';

export default function EquiposScreen() {
    const [deportes, setDeportes] = useState([]);
    const [deporteId, setDeporteId] = useState('');
    const [jugadoresDeporte, setJugadoresDeporte] = useState([]);
    const [numEquipos, setNumEquipos] = useState('2');
    const [equipos, setEquipos] = useState([]);
    const [puntuaciones, setPuntuaciones] = useState({});

    const cargarDeportes = useCallback(async () => {
        const res = await apiFetch('/deportes.php');
        if (res && res.ok) setDeportes(await res.json());
    }, []);

    useFocusEffect(useCallback(() => { cargarDeportes(); }, []));

    useEffect(() => {
        (async () => {
            if (!deporteId) { setJugadoresDeporte([]); return; }
            const res = await apiFetch(`/jugadores.php?deporte_id=${deporteId}`);
            if (res && res.ok) setJugadoresDeporte(await res.json());
        })();
    }, [deporteId]);

    function generar() {
        if (!deporteId) { Alert.alert('Atención', 'Selecciona un deporte'); return; }
        if (jugadoresDeporte.length === 0) { Alert.alert('Atención', 'No hay jugadores para este deporte'); return; }

        const n = parseInt(numEquipos, 10) || 2;
        setEquipos(generarEquiposBalanceados(jugadoresDeporte, n));
        setPuntuaciones({});
    }

    async function guardarPartido() {
        if (equipos.length === 0) return;

        const body = {
            deporte_id: parseInt(deporteId, 10),
            numero_equipos: equipos.length,
            equipos: equipos.map((eq, i) => ({
                nombre_equipo: `Equipo ${i + 1}`,
                puntuacion: puntuaciones[i] ? parseInt(puntuaciones[i], 10) : null,
                jugadores: eq.map(j => ({ id: j.id, nombre: j.nombre, posicion: j.posicion })),
            })),
        };

        const res = await apiFetch('/partidos.php', { method: 'POST', body: JSON.stringify(body) });
        if (res && res.ok) {
            Alert.alert('Listo', 'Partido guardado en el historial');
        } else {
            Alert.alert('Error', 'No se pudo guardar el partido');
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.titulo}>Generar Equipos</Text>

            <Text style={styles.label}>Deporte</Text>
            <Picker selectedValue={deporteId} onValueChange={setDeporteId} style={styles.picker}>
                <Picker.Item label="— Seleccionar —" value="" />
                {deportes.map(d => <Picker.Item key={d.id} label={d.nombre} value={String(d.id)} />)}
            </Picker>

            <Text style={styles.label}>Número de equipos</Text>
            <TextInput style={styles.input} value={numEquipos} onChangeText={setNumEquipos} keyboardType="numeric" />

            <Text style={styles.hint}>Jugadores disponibles para este deporte: {jugadoresDeporte.length}</Text>

            <TouchableOpacity style={styles.boton} onPress={generar}>
                <Text style={styles.botonTexto}>⚡ Generar equipos</Text>
            </TouchableOpacity>

            {equipos.map((eq, i) => (
                <View key={i} style={styles.card}>
                    <Text style={styles.cardTitulo}>Equipo {i + 1}</Text>
                    {eq.map(j => (
                        <Text key={j.id} style={styles.cardJugador}>{j.nombre} — {j.posicion || 'Sin posición'} — {j.nivel}</Text>
                    ))}
                    <Text style={styles.label}>Resultado (goles/puntos)</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={puntuaciones[i] || ''}
                        onChangeText={v => setPuntuaciones({ ...puntuaciones, [i]: v })}
                    />
                </View>
            ))}

            {equipos.length > 0 && (
                <TouchableOpacity style={styles.botonSecundario} onPress={guardarPartido}>
                    <Text style={styles.botonTextoClaro}>💾 Guardar en historial</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115', padding: 16 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    label: { color: '#999', marginTop: 8, marginBottom: 4 },
    picker: { backgroundColor: '#1c1f26', color: '#fff', marginBottom: 8 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
    hint: { color: '#999', marginBottom: 12 },
    boton: { backgroundColor: '#00c2ff', padding: 14, borderRadius: 8, marginBottom: 16 },
    botonSecundario: { backgroundColor: '#333', padding: 14, borderRadius: 8, marginVertical: 16 },
    botonTexto: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
    botonTextoClaro: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    card: { backgroundColor: '#1c1f26', borderRadius: 8, padding: 12, marginBottom: 12 },
    cardTitulo: { color: '#00c2ff', fontWeight: 'bold', marginBottom: 6 },
    cardJugador: { color: '#fff', marginBottom: 2 },
});