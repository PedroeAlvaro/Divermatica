<?php
/**
 * Middleware para verificar si el usuario es administrador
 * Debe incluirse después de init.php
 */

require_once __DIR__ . '/middleware/jwt.php';

// Obtener la variable JWT_SECRET del .env (cargado por init.php)
$secret = $_ENV['JWT_SECRET'] ?? '';

// Verificar JWT y obtener payload
$payload = jwt_verificar($secret);

// Verificar si tiene rol de admin
if (!isset($payload['role']) || $payload['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['erro' => 'Acceso denegado. Se requiere rol de administrador.']);
    exit;
}

// Si llegamos aquí, es admin válido
// $payload está disponible para uso en el fichero que incluye este archivo
?>
