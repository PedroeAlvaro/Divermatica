import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import JugadoresScreen from '../screens/JugadoresScreen';
import DeportesScreen from '../screens/DeportesScreen';
import EquiposScreen from '../screens/EquiposScreen';
import HistorialScreen from '../screens/HistorialScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BotonSalir() {
    const { logout } = useAuth();
    return (
        <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
            <Text style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Salir</Text>
        </TouchableOpacity>
    );
}

function AppTabs() {
    return (
        <Tab.Navigator screenOptions={{ headerRight: () => <BotonSalir /> }}>
            <Tab.Screen name="Jugadores" component={JugadoresScreen} />
            <Tab.Screen name="Deportes" component={DeportesScreen} />
            <Tab.Screen name="Equipos" component={EquiposScreen} />
            <Tab.Screen name="Historial" component={HistorialScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { autenticado, cargando } = useAuth();

    if (cargando) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {autenticado ? (
                    <Stack.Screen name="App" component={AppTabs} />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}