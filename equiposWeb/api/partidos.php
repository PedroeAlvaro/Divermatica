<?php

require_once __DIR__ . '/init.php';

require_once __DIR__ . '/middleware/rate_limit.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/conexion.php';

rate_limit_verificar();

$secret     = $_ENV['JWT_SECRET'] ?? '';
$payload    = jwt_verificar($secret);
$usuario_id = (int) $payload['sub'];

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    case 'GET':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if ($id) {
            $stmt = $pdo->prepare(
                'SELECT p.*, d.nombre AS deporte_nombre
                 FROM partidos p
                 JOIN deportes d ON d.id = p.deporte_id
                 WHERE p.id = ? AND p.usuario_id = ?'
            );
            $stmt->execute([$id, $usuario_id]);
            $partido = $stmt->fetch();

            if (!$partido) {
                http_response_code(404);
                echo json_encode(['erro' => 'Partido no encontrado']);
                exit;
            }

            $stmtEq = $pdo->prepare('SELECT * FROM partido_equipos WHERE partido_id = ? ORDER BY numero_equipo');
            $stmtEq->execute([$id]);
            $equipos = $stmtEq->fetchAll();

            foreach ($equipos as &$eq) {
                $stmtJug = $pdo->prepare('SELECT * FROM partido_jugadores WHERE partido_equipo_id = ?');
                $stmtJug->execute([$eq['id']]);
                $eq['jugadores'] = $stmtJug->fetchAll();
            }
            unset($eq);

            $partido['equipos'] = $equipos;
            echo json_encode($partido);
            break;
        }

        $deporte_id = filter_var($_GET['deporte_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        $query  = 'SELECT p.id, p.deporte_id, d.nombre AS deporte_nombre, p.fecha, p.numero_equipos, p.resultado_texto
                    FROM partidos p
                    JOIN deportes d ON d.id = p.deporte_id
                    WHERE p.usuario_id = ?';
        $params = [$usuario_id];

        if ($deporte_id) {
            $query   .= ' AND p.deporte_id = ?';
            $params[] = $deporte_id;
        }

        $query .= ' ORDER BY p.fecha DESC LIMIT 100';

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $raw = json_decode(file_get_contents('php://input'), true) ?? [];

        $deporte_id     = filter_var($raw['deporte_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $numero_equipos = filter_var($raw['numero_equipos'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 2]]);
        $equipos        = $raw['equipos'] ?? [];
        $resultado      = sanitizar_string($raw['resultado_texto'] ?? '');

        if (!$deporte_id || !$numero_equipos || !is_array($equipos) || count($equipos) < 2) {
            http_response_code(422);
            echo json_encode(['erro' => 'Datos del partido incompletos']);
            exit;
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO partidos (usuario_id, deporte_id, numero_equipos, resultado_texto)
                 VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$usuario_id, $deporte_id, $numero_equipos, $resultado]);
            $partido_id = $pdo->lastInsertId();

            foreach ($equipos as $i => $eq) {
                $nombre_equipo = sanitizar_string($eq['nombre_equipo'] ?? ('Equipo ' . ($i + 1)));
                $puntuacion    = filter_var($eq['puntuacion'] ?? null, FILTER_VALIDATE_INT);
                $puntuacion    = $puntuacion === false ? null : $puntuacion;

                $stmtEq = $pdo->prepare(
                    'INSERT INTO partido_equipos (partido_id, numero_equipo, nombre_equipo, puntuacion)
                     VALUES (?, ?, ?, ?)'
                );
                $stmtEq->execute([$partido_id, $i + 1, $nombre_equipo, $puntuacion]);
                $partido_equipo_id = $pdo->lastInsertId();

                foreach (($eq['jugadores'] ?? []) as $j) {
                    $jugador_id = filter_var($j['id'] ?? null, FILTER_VALIDATE_INT);
                    $stmtJug = $pdo->prepare(
                        'INSERT INTO partido_jugadores (partido_equipo_id, jugador_id, nombre_jugador, posicion_jugador)
                         VALUES (?, ?, ?, ?)'
                    );
                    $stmtJug->execute([
                        $partido_equipo_id,
                        $jugador_id ?: null,
                        sanitizar_string($j['nombre'] ?? ''),
                        sanitizar_string($j['posicion'] ?? ''),
                    ]);
                }
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['erro' => 'Error al guardar el partido']);
            exit;
        }

        http_response_code(201);
        echo json_encode(['ok' => true, 'id' => $partido_id]);
        break;

    case 'PUT':
        $raw = json_decode(file_get_contents('php://input'), true) ?? [];
        $id  = filter_var($raw['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }

        $stmtCheck = $pdo->prepare('SELECT id FROM partidos WHERE id = ? AND usuario_id = ?');
        $stmtCheck->execute([$id, $usuario_id]);
        if (!$stmtCheck->fetch()) {
            http_response_code(404);
            echo json_encode(['erro' => 'Partido no encontrado']);
            exit;
        }

        if (isset($raw['resultado_texto'])) {
            $stmt = $pdo->prepare('UPDATE partidos SET resultado_texto = ? WHERE id = ?');
            $stmt->execute([sanitizar_string($raw['resultado_texto']), $id]);
        }

        foreach ($raw['equipos'] ?? [] as $eq) {
            $eq_id      = filter_var($eq['id'] ?? null, FILTER_VALIDATE_INT);
            $puntuacion = filter_var($eq['puntuacion'] ?? null, FILTER_VALIDATE_INT);
            if ($eq_id) {
                $stmt = $pdo->prepare('UPDATE partido_equipos SET puntuacion = ? WHERE id = ? AND partido_id = ?');
                $stmt->execute([$puntuacion === false ? null : $puntuacion, $eq_id, $id]);
            }
        }

        echo json_encode(['ok' => true]);
        break;

    case 'DELETE':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['erro' => 'ID inválido']);
            exit;
        }

        $stmt = $pdo->prepare('DELETE FROM partidos WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$id, $usuario_id]);
        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['erro' => 'Método no permitido']);
}