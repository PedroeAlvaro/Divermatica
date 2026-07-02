import { API_URL } from '../config';
import { getToken, eliminarToken } from '../utils/auth';

export async function apiFetch(path, opciones = {}) {
    const token = await getToken();

    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(opciones.headers || {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
    };

    try {
        const res = await fetch(`${API_URL}${path}`, { ...opciones, headers });

        if (res.status === 401) {
            await eliminarToken();
        }

        return res;
    } catch (err) {
        console.error('Erro API:', err);
        return null;
    }
}