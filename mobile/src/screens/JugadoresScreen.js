import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';

const NIVELES = ['Medio', 'Bueno', 'Muy Bueno'];

export default function JugadoresScreen() {
    const [jugadores, setJugadores] = useState([]);
    const [deportes, setDeportes] = useState([]);
    const [posiciones, setPosiciones] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [mail, setMail] = useState('');
    const [deporteId, setDeporteId] = useState('');
    const [posicion, setPosicion] = useState('');
    const [nivel, setNivel] = useState('');

    const cargarJugadores = useCallback(async () => {
        const res = await apiFetch('/jugadores.php');
        if (res && res.ok) setJugadores(await res.json());
    }, []);

    const cargarDeportes = useCallback(async () => {
        const res = await apiFetch('/deportes.php');
        if (res && res.ok) setDeportes(await res.json());
    }, []);

    useFocusEffect(useCallback(() => { cargarJugadores(); cargarDeportes(); }, []));

    useEffect(() => {
        (async () => {
            if (!deporteId) { setPosiciones([]); return; }
            const res = await apiFetch(`/posiciones.php?deporte_id=${deporteId}`);
            if (res && res.ok) setPosiciones(await res.json());
        })();
    }, [deporteId]);

    function abrirNuevo() {
        setEditandoId(null);
        setNombre(''); setTelefono(''); setMail(''); setDeporteId(''); setPosicion(''); setNivel('');
        setModalVisible(true);
    }

    function abrirEditar(j) {
        setEditandoId(j.id);
        setNombre(j.nombre); setTelefono(j.telefono || ''); setMail(j.mail || '');
        setDeporteId(j.deporte_id ? String(j.deporte_id) : '');
        setPosicion(j.posicion || ''); setNivel(j.nivel);
        setModalVisible(true);
    }

    async function guardar() {
        if (!nombre || !nivel) {
            Alert.alert('Atención', 'Nombre y nivel son obligatorios');
            return;
        }
        const body = {
            nombre, telefono, mail, posicion, nivel,
            deporte_id: deporteId ? parseInt(deporteId, 10) : null,
        };
        if (editandoId) body.id = editandoId;

        const res = await apiFetch('/jugadores.php', {
            method: editandoId ? 'PUT' : 'POST',
            body: JSON.stringify(body),
        });

        if (res && res.ok) {
            setModalVisible(false);
            cargarJugadores();
        } else {
            const data = res ? await res.json() : {};
            Alert.alert('Error', Array.isArray(data.erro) ? data.erro.join('\n') : (data.erro || 'No se pudo guardar'));
        }
    }

    async function eliminar(id) {
        const res = await apiFetch(`/jugadores.php?id=${id}`, { method: 'DELETE' });
        if (res && res.ok) cargarJugadores();
    }

    return (
        <View style={styles.container}>
            <View style={styles.cabecera}>
                <Text style={styles.titulo}>Jugadores</Text>
                <TouchableOpacity style={styles.botonPeq} onPress={abrirNuevo}>
                    <Text style={styles.botonTexto}>+ Nuevo</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={jugadores}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => abrirEditar(item)}>
                        <View>
                            <Text style={styles.itemNombre}>{item.nombre}</Text>
                            <Text style={styles.itemSub}>{item.deporte_nombre || 'Sin deporte'} · {item.posicion || 'Sin posición'} · {item.nivel}</Text>
                        </View>
                        <TouchableOpacity onPress={() => eliminar(item.id)}>
                            <Text style={styles.eliminar}>Eliminar</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={modalVisible} animationType="slide">
                <ScrollView style={styles.modal}>
                    <Text style={styles.titulo}>{editandoId ? 'Editar jugador' : 'Nuevo jugador'}</Text>

                    <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#888" value={nombre} onChangeText={setNombre} />
                    <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#888" value={telefono} onChangeText={setTelefono} />
                    <TextInput style={styles.input} placeholder="Correo" placeholderTextColor="#888" value={mail} onChangeText={setMail} />

                    <Text style={styles.label}>Deporte</Text>
                    <Picker selectedValue={deporteId} onValueChange={v => { setDeporteId(v); setPosicion(''); }} style={styles.picker}>
                        <Picker.Item label="— Seleccionar —" value="" />
                        {deportes.map(d => <Picker.Item key={d.id} label={d.nombre} value={String(d.id)} />)}
                    </Picker>

                    <Text style={styles.label}>Posición</Text>
                    <Picker selectedValue={posicion} onValueChange={setPosicion} style={styles.picker} enabled={posiciones.length > 0}>
                        <Picker.Item label={deporteId ? '— Seleccionar —' : 'Elige un deporte primero'} value="" />
                        {posiciones.map(p => <Picker.Item key={p.id} label={p.nombre} value={p.nombre} />)}
                    </Picker>

                    <Text style={styles.label}>Nivel</Text>
                    <Picker selectedValue={nivel} onValueChange={setNivel} style={styles.picker}>
                        <Picker.Item label="— Seleccionar —" value="" />
                        {NIVELES.map(n => <Picker.Item key={n} label={n} value={n} />)}
                    </Picker>

                    <TouchableOpacity style={styles.boton} onPress={guardar}>
                        <Text style={styles.botonTexto}>💾 Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.botonSecundario} onPress={() => setModalVisible(false)}>
                        <Text style={styles.botonTextoClaro}>Cancelar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115', padding: 16 },
    cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1c1f26', padding: 12, borderRadius: 8, marginBottom: 8 },
    itemNombre: { color: '#fff', fontWeight: 'bold' },
    itemSub: { color: '#999' },
    eliminar: { color: '#ff4d4d' },
    botonPeq: { backgroundColor: '#00c2ff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    botonTexto: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
    botonTextoClaro: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    modal: { flex: 1, backgroundColor: '#0f1115', padding: 20 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
    label: { color: '#999', marginTop: 8, marginBottom: 4 },
    picker: { backgroundColor: '#1c1f26', color: '#fff', marginBottom: 8 },
    boton: { backgroundColor: '#00c2ff', padding: 14, borderRadius: 8, marginTop: 16 },
    botonSecundario: { backgroundColor: '#333', padding: 14, borderRadius: 8, marginTop: 8 },
});