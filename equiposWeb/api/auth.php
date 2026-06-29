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
    echo json_encode(['erro' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

$dados    = json_decode(file_get_contents('php://input'), true);
$username = trim($dados['username'] ?? '');
$password = $dados['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Username e password são obrigatórios']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, username, password_hash, role FROM usuarios WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$utilizador = $stmt->fetch();

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'desconocido';

if (!$utilizador || !password_verify($password, $utilizador['password_hash'])) {
    try {
        $stmtLog = $pdo->prepare('INSERT INTO admin_logs (tipo, username, ip, detalhes) VALUES (?, ?, ?, ?)');
        $stmtLog->execute(['login_falhou', $username, $ip, 'Credenciais inválidas']);
    } catch (Exception $e) {}

    http_response_code(401);
    echo json_encode(['erro' => 'Credenciais inválidas']);
    exit;
}

$secret = $_ENV['JWT_SECRET'] ?? '';
$expiry = (int)($_ENV['JWT_EXPIRY'] ?? 28800);

if ($secret === '' || $secret === 'CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING_BEFORE_PRODUCTION') {
    http_response_code(500);
    echo json_encode(['erro' => 'Configuração do servidor incompleta']);
    exit;
}

$token = jwt_generate([
    'sub'      => $utilizador['id'],
    'username' => $utilizador['username'],
    'role'     => $utilizador['role'],
], $secret, $expiry);

try {
    $stmtLog = $pdo->prepare('INSERT INTO admin_logs (tipo, username, ip, detalhes) VALUES (?, ?, ?, ?)');
    $stmtLog->execute(['login', $utilizador['username'], $ip, 'Login bem-sucedido']);
} catch (Exception $e) {}

echo json_encode([
    'token'     => $token,
    'expira_em' => $expiry,
]);