import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atobPolyfill } from 'base-64';

const TOKEN_KEY = 'matchora_token';

export async function getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function guardarToken(token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function eliminarToken() {
    await AsyncStorage.removeItem(TOKEN_KEY);
}

export function tokenExpirado(token) {
    try {
        const payload = JSON.parse(atobPolyfill(token.split('.')[1]));
        return Date.now() / 1000 > payload.exp;
    } catch {
        return true;
    }
}