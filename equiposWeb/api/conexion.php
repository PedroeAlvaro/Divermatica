<?php

$env_path = __DIR__ . '/../.env';
if (!isset($_ENV['DB_HOST']) && file_exists($env_path)) {
    $linhas = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        $linha = trim($linha);
        if ($linha === '' || str_starts_with($linha, '#')) continue;
        if (!str_contains($linha, '=')) continue;
        [$chave, $valor] = explode('=', $linha, 2);
        $_ENV[trim($chave)] = trim($valor);
    }
}

$host     = $_ENV['DB_HOST']    ?? 'localhost';
$db       = $_ENV['DB_NAME']    ?? '';
$usuario  = $_ENV['DB_USER']    ?? '';
$password = $_ENV['DB_PASS']    ?? '';
$charset  = $_ENV['DB_CHARSET'] ?? 'utf8mb4';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=$charset",
        $usuario,
        $password,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['erro' => 'Erro de conexão com a base de dados']);
    exit;
}