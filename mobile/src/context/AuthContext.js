import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, guardarToken, eliminarToken, tokenExpirado } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [autenticado, setAutenticado] = useState(false);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (token && !tokenExpirado(token)) {
                setAutenticado(true);
            } else {
                await eliminarToken();
            }
            setCargando(false);
        })();
    }, []);

    async function login(token) {
        await guardarToken(token);
        setAutenticado(true);
    }

    async function logout() {
        await eliminarToken();
        setAutenticado(false);
    }

    return (
        <AuthContext.Provider value={{ autenticado, cargando, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}