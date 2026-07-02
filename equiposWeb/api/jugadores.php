<?php

require_once __DIR__ . '/init.php';

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
        $buscar     = sanitizar_string($_GET['buscar'] ?? '');
        $deporte_id = filter_var($_GET['deporte_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        $query  = 'SELECT j.*, d.nombre AS deporte_nombre
                    FROM jugadores j
                    LEFT JOIN deportes d ON d.id = j.deporte_id
                    WHERE 1=1';
        $params = [];

        if ($buscar !== '') {
            $query   .= ' AND j.nombre LIKE ?';
            $params[] = '%' . $buscar . '%';
        }
        if ($deporte_id) {
            $query   .= ' AND j.deporte_id = ?';
            $params[] = $deporte_id;
        }

        $query .= ' ORDER BY j.nombre';

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_jogador($raw, $pdo);
        $stmt  = $pdo->prepare(
            'INSERT INTO jugadores (nombre, telefono, mail, posicion, nivel, deporte_id)
             VALUES (:nombre, :telefono, :mail, :posicion, :nivel, :deporte_id)'
        );
        $stmt->execute([
            ':nombre'     => $dados['nombre'],
            ':telefono'   => $dados['telefono'],
            ':mail'       => $dados['mail'],
            ':posicion'   => $dados['posicion'],
            ':nivel'      => $dados['nivel'],
            ':deporte_id' => $dados['deporte_id'],
        ]);
        http_response_code(201);
        echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $raw   = json_decode(file_get_contents('php://input'), true) ?? [];
        $dados = validar_jogador($raw, $pdo);
        $id    = filter_var($raw['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }
        $stmt = $pdo->prepare(
            'UPDATE jugadores
             SET nombre=:nombre, telefono=:telefono, mail=:mail,
                 posicion=:posicion, nivel=:nivel, deporte_id=:deporte_id
             WHERE id=:id'
        );
        $stmt->execute([
            ':nombre'     => $dados['nombre'],
            ':telefono'   => $dados['telefono'],
            ':mail'       => $dados['mail'],
            ':posicion'   => $dados['posicion'],
            ':nivel'      => $dados['nivel'],
            ':deporte_id' => $dados['deporte_id'],
            ':id'         => $id,
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