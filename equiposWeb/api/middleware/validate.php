<?php

function sanitizar_string(mixed $valor): string {
    if (!is_string($valor)) return '';
    return trim(strip_tags($valor));
}

function sanitizar_inteiro(mixed $valor, int $min = 1, int $max = PHP_INT_MAX): ?int {
    $int = filter_var($valor, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => $min, 'max_range' => $max]
    ]);
    return ($int === false) ? null : (int)$int;
}

function validar_jogador(array $dados, PDO $pdo): array {
    $niveis_validos = ['Medio', 'Bueno', 'Muy Bueno'];

    $nome       = sanitizar_string($dados['nombre'] ?? '');
    $nivel      = sanitizar_string($dados['nivel']  ?? '');
    $deporte_id = sanitizar_inteiro($dados['deporte_id'] ?? null, 1);
    $posicion   = sanitizar_string($dados['posicion'] ?? '');

    $erros = [];

    if ($nome === '' || mb_strlen($nome) < 2) {
        $erros[] = 'Nombre obrigatório (mínimo 2 caracteres)';
    }
    if (mb_strlen($nome) > 100) {
        $erros[] = 'Nombre demasiado longo (máximo 100 caracteres)';
    }
    if (!in_array($nivel, $niveis_validos, true)) {
        $erros[] = 'Nivel inválido. Valores aceites: ' . implode(', ', $niveis_validos);
    }

    // La posición se valida contra las posiciones reales del deporte elegido
    if ($deporte_id !== null) {
        $stmtPos = $pdo->prepare('SELECT nombre FROM posiciones WHERE deporte_id = ?');
        $stmtPos->execute([$deporte_id]);
        $posicionesValidas   = array_column($stmtPos->fetchAll(), 'nombre');
        $posicionesValidas[] = '';

        if (!in_array($posicion, $posicionesValidas, true)) {
            $erros[] = 'Posición inválida para el deporte seleccionado';
        }
    }

    if (!empty($erros)) {
        http_response_code(422);
        echo json_encode(['erro' => $erros]);
        exit;
    }

    $mail = sanitizar_string($dados['mail'] ?? '');
    if ($mail !== '' && !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['erro' => 'Formato de email inválido']);
        exit;
    }

    return [
        'nombre'     => $nome,
        'telefono'   => sanitizar_string($dados['telefono'] ?? ''),
        'mail'       => $mail,
        'posicion'   => $posicion,
        'nivel'      => $nivel,
        'deporte_id' => $deporte_id,
    ];
}

function validar_deporte(array $dados): array {
    $nome = sanitizar_string($dados['nombre'] ?? '');
    $num  = sanitizar_inteiro($dados['num_jugadores'] ?? null, 2, 20);

    $erros = [];

    if ($nome === '' || mb_strlen($nome) < 2) {
        $erros[] = 'Nombre obrigatório (mínimo 2 caracteres)';
    }
    if (mb_strlen($nome) > 80) {
        $erros[] = 'Nombre demasiado longo (máximo 80 caracteres)';
    }
    if ($num === null) {
        $erros[] = 'num_jugadores deve ser um número inteiro entre 2 e 20';
    }

    if (!empty($erros)) {
        http_response_code(422);
        echo json_encode(['erro' => $erros]);
        exit;
    }

    return [
        'nombre'        => $nome,
        'num_jugadores' => $num,
    ];
}