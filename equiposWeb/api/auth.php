<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

$stmt = $pdo->prepare('SELECT id, username, password_hash FROM usuarios WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$utilizador = $stmt->fetch();

if (!$utilizador || !password_verify($password, $utilizador['password_hash'])) {
    http_response_code(401);
    echo json_encode(['erro' => 'Credenciais inválidas']);
    exit;
}

$env_path = __DIR__ . '/../.env';
if (file_exists($env_path)) {
    $linhas = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        if (str_starts_with(trim($linha), '#')) continue;
        if (!str_contains($linha, '=')) continue;
        [$chave, $valor] = explode('=', $linha, 2);
        $_ENV[trim($chave)] = trim($valor);
    }
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
], $secret, $expiry);

echo json_encode([
    'token'     => $token,
    'expira_em' => $expiry,
]);