import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    async function entrar() { b
        if (!username || !password) {
            Alert.alert('Atención', 'Rellena usuario y contraseña');
            return;
        }
        setCargando(true);
        try {
            const res = await fetch(`${API_URL}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                Alert.alert('Error', data.erro || 'Credenciales inválidas');
                return;
            }
            await login(data.token);
        } catch (e) {
            Alert.alert('Error', 'No se pudo conectar con el servidor');
        } finally {
            setCargando(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>MATCHORA</Text>
            <TextInput style={styles.input} placeholder="Usuario" placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.boton} onPress={entrar} disabled={cargando}>
                <Text style={styles.botonTexto}>{cargando ? 'Entrando...' : 'Iniciar sesión'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f1115' },
    titulo: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 32 },
    input: { backgroundColor: '#1c1f26', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 12 },
    boton: { backgroundColor: '#00c2ff', padding: 14, borderRadius: 8, marginTop: 8 },
    botonTexto: { color: '#000', textAlign: 'center', fontWeight: 'bold' },
    link: { color: '#00c2ff', textAlign: 'center', marginTop: 16 },
});