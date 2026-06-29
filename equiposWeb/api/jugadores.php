<?php

require_once __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

$secret  = $_ENV['JWT_SECRET'] ?? '';
jwt_verificar($secret);
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    case 'GET':
        $buscar = sanitizar_string($_GET['buscar'] ?? '');
        if ($buscar !== '') {
            $stmt = $pdo->prepare(
                'SELECT * FROM jugadores WHERE nombre LIKE ? ORDER BY nombre'
            );
            $stmt->execute(['%' . $buscar . '%']);
        } else {
            $stmt = $pdo->query('SELECT * FROM jugadores ORDER BY nombre');
        }
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_jogador($raw);
        $stmt  = $pdo->prepare(
            'INSERT INTO jugadores (nombre, telefono, mail, posicion, nivel)
             VALUES (:nombre, :telefono, :mail, :posicion, :nivel)'
        );
        $stmt->execute([
            ':nombre'   => $dados['nombre'],
            ':telefono' => $dados['telefono'],
            ':mail'     => $dados['mail'],
            ':posicion' => $dados['posicion'],
            ':nivel'    => $dados['nivel'],
        ]);
        http_response_code(201);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_jogador($raw);
        $id    = filter_var($raw['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }
        $stmt = $pdo->prepare(
            'UPDATE jugadores
             SET nombre=:nombre, telefono=:telefono, mail=:mail,
                 posicion=:posicion, nivel=:nivel
             WHERE id=:id'
        );
        $stmt->execute([
            ':nombre'   => $dados['nombre'],
            ':telefono' => $dados['telefono'],
            ':mail'     => $dados['mail'],
            ':posicion' => $dados['posicion'],
            ':nivel'    => $dados['nivel'],
            ':id'       => $id,
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
        $stmt = $pdo->prepare('DELETE FROM jugadores WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método não permitido']);
}