<?php

require_once __DIR__ . '/init.php';

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

$secret = $_ENV['JWT_SECRET'] ?? '';
jwt_verificar($secret);

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    case 'GET':
        $deporte_id = filter_var($_GET['deporte_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($deporte_id) {
            $stmt = $pdo->prepare('SELECT * FROM posiciones WHERE deporte_id = ? ORDER BY orden, nombre');
            $stmt->execute([$deporte_id]);
        } else {
            $stmt = $pdo->query('SELECT * FROM posiciones ORDER BY deporte_id, orden, nombre');
        }
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $raw        = json_decode(file_get_contents('php://input'), true) ?? [];
        $nombre     = sanitizar_string($raw['nombre'] ?? '');
        $deporte_id = filter_var($raw['deporte_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $orden      = filter_var($raw['orden'] ?? 0, FILTER_VALIDATE_INT) ?: 0;

        if ($nombre === '' || mb_strlen($nombre) > 50 || !$deporte_id) {
            http_response_code(422);
            echo json_encode(['erro' => 'Nombre y deporte_id son obligatorios']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO posiciones (deporte_id, nombre, orden) VALUES (?, ?, ?)');
        $stmt->execute([$deporte_id, $nombre, $orden]);
        http_response_code(201);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $raw    = json_decode(file_get_contents('php://input'), true) ?? [];
        $id     = filter_var($raw['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $nombre = sanitizar_string($raw['nombre'] ?? '');
        $orden  = filter_var($raw['orden'] ?? 0, FILTER_VALIDATE_INT) ?: 0;

        if (!$id || $nombre === '') {
            http_response_code(400);
            echo json_encode(['erro' => 'ID y nombre son obligatorios']);
            exit;
        }

        $stmt = $pdo->prepare('UPDATE posiciones SET nombre = ?, orden = ? WHERE id = ?');
        $stmt->execute([$nombre, $orden, $id]);
        echo json_encode(['ok' => true]);
        break;

    case 'DELETE':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM posiciones WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método no permitido']);
}