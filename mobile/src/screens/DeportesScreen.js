import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';

export default function DeportesScreen() {
    const [deportes, setDeportes] = useState([]);
    const [nombre, setNombre] = useState('');
    const [numJugadores, setNumJugadores] = useState('7');

    const cargar = useCallback(async () => {
        const res = await apiFetch('/deportes.php');
        if (res && res.ok) setDeportes(await res.json());
    }, []);

    useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

    async function crear() {
        if (!nombre) return;
        const res = await apiFetch('/deportes.php', {
            method: 'POST',
            body: JSON.stringify({ nombre, num_jugadores: parseInt(numJugadores, 10) || 7 }),
        });
        if (res && res.ok) {
            setNombre('');
            cargar();
        } else {
            Alert.alert('Error', 'No se pudo crear el deporte');
        }
    }

    async function eliminar(id) {
        const res = await apiFetch(`/deportes.php?id=${id}`, { method: 'DELETE' });
        if (res && res.ok) cargar();
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Deportes</Text>
            <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Nombre del deporte" placeholderTextColor="#888" value={nombre} onChangeText={setNombre} />
                <TextInput style={styles.input} placeholder="Nº jugadores" placeholderTextColor="#888" value={numJugadores} onChangeText={setNumJugadores} keyboardType="numeric" />
                <TouchableOpacity style={styles.boton} onPress={crear}>
                    <Text style={styles.botonTexto}>+ Añadir</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={deportes}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.itemTexto}>{item.nombre} ({item.num_jugadores} jugadores)</Text>
                        <TouchableOpacity onPress={() => eliminar(item.id)}>
                            <Text style={styles.eliminar}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115', padding: 16 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    form: { marginBottom: 16 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
    boton: { backgroundColor: '#00c2ff', padding: 12, borderRadius: 8 },
    botonTexto: { color: '#000', textAlign: 'center', fontWeight: 'bold' },
    item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1c1f26', padding: 12, borderRadius: 8, marginBottom: 8 },
    itemTexto: { color: '#fff' },
    eliminar: { color: '#ff4d4d' },
});