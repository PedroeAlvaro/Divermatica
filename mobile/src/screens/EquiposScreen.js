import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
    Alert, Modal, Pressable, Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api/client';
import { generarEquiposBalanceados } from '../utils/teamBalancer';
import FormationPitch from '../components/FormationPitch';

const { width: ANCHO_PANTALLA } = Dimensions.get('window');

export default function EquiposScreen() {
    const [deportes, setDeportes] = useState([]);
    const [deporteId, setDeporteId] = useState('');
    const [jugadoresDeporte, setJugadoresDeporte] = useState([]);
    const [posicionesDeporte, setPosicionesDeporte] = useState([]);
    const [numEquipos, setNumEquipos] = useState('2');
    const [equipos, setEquipos] = useState([]);
    const [campoVisible, setCampoVisible] = useState(false);
    const [equipoActivo, setEquipoActivo] = useState(0);
    const [guardando, setGuardando] = useState(false);

    const scrollRef = useRef(null);

    const cargarDeportes = useCallback(async () => {
        const res = await apiFetch('/deportes.php');
        if (res && res.ok) setDeportes(await res.json());
    }, []);

    useFocusEffect(useCallback(() => { cargarDeportes(); }, [cargarDeportes]));

    useEffect(() => {
        (async () => {
            if (!deporteId) { setJugadoresDeporte([]); setPosicionesDeporte([]); return; }
            const [resJ, resP] = await Promise.all([
                apiFetch(`/jugadores.php?deporte_id=${deporteId}`),
                apiFetch(`/posiciones.php?deporte_id=${deporteId}`),
            ]);
            setJugadoresDeporte(resJ && resJ.ok ? await resJ.json() : []);
            setPosicionesDeporte(resP && resP.ok ? await resP.json() : []);
        })();
    }, [deporteId]);

    function generar() {
        if (!deporteId) { Alert.alert('Atención', 'Selecciona un deporte'); return; }
        if (jugadoresDeporte.length === 0) { Alert.alert('Atención', 'No hay jugadores para este deporte'); return; }

        const n = Math.max(2, parseInt(numEquipos, 10) || 2);
        if (n > jugadoresDeporte.length) {
            Alert.alert('Atención', 'No puedes crear más equipos que jugadores disponibles');
            return;
        }

        setEquipos(generarEquiposBalanceados(jugadoresDeporte, n));
        setEquipoActivo(0);
        setCampoVisible(true);
    }

    function abrirCampo() {
        if (equipos.length === 0) return;
        setCampoVisible(true);
    }

    function cerrarCampo() {
        setCampoVisible(false);
    }

    function irAEquipo(i) {
        setEquipoActivo(i);
        scrollRef.current?.scrollTo({ x: i * ANCHO_PANTALLA, animated: true });
    }

    function onScrollFin(e) {
        const i = Math.round(e.nativeEvent.contentOffset.x / ANCHO_PANTALLA);
        setEquipoActivo(i);
    }

    async function guardarPartido() {
        if (equipos.length === 0) return;
        setGuardando(true);
        const body = {
            deporte_id: parseInt(deporteId, 10),
            numero_equipos: equipos.length,
            equipos: equipos.map((eq, i) => ({
                nombre_equipo: `Equipo ${i + 1}`,
                puntuacion: null,
                jugadores: eq.map(j => ({ id: j.id, nombre: j.nombre, posicion: j.posicion })),
            })),
        };

        const res = await apiFetch('/partidos.php', { method: 'POST', body: JSON.stringify(body) });
        setGuardando(false);
        if (res && res.ok) {
            Alert.alert('Listo', 'Equipo guardado en el historial');
        } else {
            Alert.alert('Error', 'No se pudo guardar el partido');
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContenido}>
                <Text style={styles.titulo}>Generar Equipos</Text>

                <Text style={styles.label}>Deporte</Text>
                <Picker selectedValue={deporteId} onValueChange={setDeporteId} style={styles.picker} dropdownIconColor="#fff">
                    <Picker.Item label="— Seleccionar —" value="" color="#fff" />
                    {deportes.map(d => (
                        <Picker.Item key={d.id} label={d.nombre} value={String(d.id)} color="#fff" />
                    ))}
                </Picker>

                <Text style={styles.label}>Número de equipos</Text>
                <TextInput style={styles.input} value={numEquipos} onChangeText={setNumEquipos} keyboardType="numeric" />

                <Text style={styles.hint}>Jugadores disponibles para este deporte: {jugadoresDeporte.length}</Text>

                <TouchableOpacity style={styles.boton} onPress={generar} activeOpacity={0.85}>
                    <Text style={styles.botonTexto}>⚡ Generar equipos</Text>
                </TouchableOpacity>

                {equipos.length > 0 && !campoVisible && (
                    <TouchableOpacity style={styles.resumen} onPress={abrirCampo} activeOpacity={0.85}>
                        <Text style={styles.resumenTexto}>✅ {equipos.length} equipos generados — toca para ver el campo</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {equipos.length > 0 && !campoVisible && (
                <TouchableOpacity style={styles.fab} onPress={abrirCampo} activeOpacity={0.85}>
                    <Text style={styles.fabTexto}>🏟️  Revisar equipo</Text>
                </TouchableOpacity>
            )}

            <Modal visible={campoVisible} animationType="fade" transparent onRequestClose={cerrarCampo}>
                <Pressable style={styles.backdrop} onPress={cerrarCampo}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalCabecera}>
                            <Text style={styles.modalTitulo}>Formación</Text>
                            <TouchableOpacity onPress={cerrarCampo} style={styles.botonCerrar}>
                                <Text style={styles.botonCerrarTexto}>✕ Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        {equipos.length > 1 && (
                            <View style={styles.tabs}>
                                {equipos.map((_, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.tab, equipoActivo === i && styles.tabActiva]}
                                        onPress={() => irAEquipo(i)}
                                    >
                                        <Text style={[styles.tabTexto, equipoActivo === i && styles.tabTextoActiva]}>
                                            Equipo {i + 1}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <ScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={onScrollFin}
                            style={{ width: ANCHO_PANTALLA - 24 }}
                        >
                            {equipos.map((eq, i) => (
                                <ScrollView key={i} style={{ width: ANCHO_PANTALLA - 24 }} contentContainerStyle={styles.paginaCampo}>
                                    <Text style={styles.nombreEquipo}>Equipo {i + 1} · {eq.length} jugadores</Text>
                                    <FormationPitch equipo={eq} posicionesInfo={posicionesDeporte} />
                                </ScrollView>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={styles.botonGuardar} onPress={guardarPartido} disabled={guardando} activeOpacity={0.85}>
                            <Text style={styles.botonTextoClaro}>{guardando ? 'Guardando…' : '💾 Guardar en historial'}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f1115' },
    scrollContenido: { padding: 16, paddingBottom: 100 },
    titulo: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
    label: { color: '#999', marginTop: 8, marginBottom: 4 },
    picker: { backgroundColor: '#1c1f26', color: '#fff', marginBottom: 8 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
    hint: { color: '#999', marginBottom: 12 },
    boton: { backgroundColor: '#00c2ff', padding: 14, borderRadius: 8, marginBottom: 16 },
    botonTexto: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
    botonTextoClaro: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
    resumen: { backgroundColor: '#132a24', borderWidth: 1, borderColor: '#00e676', borderRadius: 10, padding: 14, marginBottom: 8 },
    resumenTexto: { color: '#00e676', fontWeight: '700', textAlign: 'center' },

    fab: {
        position: 'absolute',
        bottom: 22,
        left: 20,
        right: 20,
        backgroundColor: '#00c2ff',
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#00c2ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    fabTexto: { color: '#000', fontWeight: '800', fontSize: 15 },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center', padding: 12 },
    modalCard: {
        width: '100%', height: '94%',
        backgroundColor: '#0f1115',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#232833',
        paddingTop: 14,
    },
    modalCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    modalTitulo: { color: '#fff', fontSize: 18, fontWeight: '800' },
    botonCerrar: { backgroundColor: '#1c1f26', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    botonCerrarTexto: { color: '#ff6b6b', fontWeight: '700', fontSize: 12 },

    tabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 10 },
    tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1c1f26' },
    tabActiva: { backgroundColor: '#00c2ff' },
    tabTexto: { color: '#999', fontWeight: '700', fontSize: 12 },
    tabTextoActiva: { color: '#000' },

    paginaCampo: { paddingHorizontal: 12, paddingBottom: 12 },
    nombreEquipo: { color: '#00c2ff', fontWeight: '800', fontSize: 14, textAlign: 'center', marginBottom: 8 },

    botonGuardar: { backgroundColor: '#00e676', padding: 14, marginHorizontal: 12, marginVertical: 12, borderRadius: 10 },
});