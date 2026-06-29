<?php

header("Access-Control-Allow-Origin: https://felipesmb.github.io");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, ngrok-skip-browser-warning");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método no permitido']);
    exit;
}

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

$dados    = json_decode(file_get_contents('php://input'), true);
$username = sanitizar_string($dados['username'] ?? '');
$password = $dados['password'] ?? '';
$confirmar = $dados['confirmar'] ?? '';

// Validações
$erros = [];

if (mb_strlen($username) < 3 || mb_strlen($username) > 50) {
    $erros[] = 'El usuario debe tener entre 3 y 50 caracteres';
}
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    $erros[] = 'El usuario solo puede contener letras, números y guión bajo';
}
if (mb_strlen($password) < 8) {
    $erros[] = 'La contraseña debe tener al menos 8 caracteres';
}
if ($password !== $confirmar) {
    $erros[] = 'Las contraseñas no coinciden';
}

if (!empty($erros)) {
    http_response_code(422);
    echo json_encode(['erro' => $erros]);
    exit;
}

// Verificar se username já existe
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['erro' => 'El nombre de usuario ya está en uso']);
    exit;
}

// Criar utilizador
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$stmt = $pdo->prepare('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)');
$stmt->execute([$username, $hash]);

// Obtener IP del cliente
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'desconocido';

// Registrar log de registo
try {
    $stmtLog = $pdo->prepare('INSERT INTO admin_logs (tipo, username, ip, detalhes) VALUES (?, ?, ?, ?)');
    $stmtLog->execute(['registro', $username, $ip, 'Novo utilizador registado']);
} catch (Exception $e) {
    // Silenciar errores de logging
}

http_response_code(201);
echo json_encode(['ok' => true]);