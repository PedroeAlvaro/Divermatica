<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

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
$secret  = $_ENV['JWT_SECRET'] ?? '';
$payload = jwt_verificar($secret);

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    case 'GET':
        $stmt = $pdo->query('SELECT * FROM deportes ORDER BY nombre');
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_deporte($raw);
        $stmt  = $pdo->prepare(
            'INSERT INTO deportes (nombre, num_jugadores) VALUES (:nombre, :num)'
        );
        $stmt->execute([
            ':nombre' => $dados['nombre'],
            ':num'    => $dados['num_jugadores'],
        ]);
        http_response_code(201);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_deporte($raw);
        $id    = filter_var($raw['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }
        $stmt = $pdo->prepare(
            'UPDATE deportes SET nombre=:nombre, num_jugadores=:num WHERE id=:id'
        );
        $stmt->execute([
            ':nombre' => $dados['nombre'],
            ':num'    => $dados['num_jugadores'],
            ':id'     => $id,
        ]);
        echo json_encode(['ok' => true]);
        break;

    case 'DELETE':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM deportes WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
}