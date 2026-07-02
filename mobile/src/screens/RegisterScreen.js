import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_URL } from '../config';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [cargando, setCargando] = useState(false);

    async function registrar() {
        setCargando(true);
        try {
            const res = await fetch(`${API_URL}/registro.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ username, password, confirmar }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert('Error', Array.isArray(data.erro) ? data.erro.join('\n') : (data.erro || 'Error al registrar'));
                return;
            }
            Alert.alert('Listo', 'Cuenta creada. Ya puedes iniciar sesión.');
            navigation.navigate('Login');
        } catch (e) {
            Alert.alert('Error', 'No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Crear cuenta</Text>
            <TextInput style={styles.input} placeholder="Usuario" placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirmar contraseña" placeholderTextColor="#888" value={confirmar} onChangeText={setConfirmar} secureTextEntry />
            <TouchableOpacity style={styles.boton} onPress={registrar} disabled={cargando}>
                <Text style={styles.botonTexto}>{cargando ? 'Creando...' : 'Registrarse'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Ya tengo cuenta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f1115' },
    titulo: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 32 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 12 },
    boton: { backgroundColor: '#00c2ff', padding: 14, borderRadius: 8, marginTop: 8 },
    botonTexto: { color: '#000', textAlign: 'center', fontWeight: 'bold' },
    link: { color: '#00c2ff', textAlign: 'center', marginTop: 16 },
});