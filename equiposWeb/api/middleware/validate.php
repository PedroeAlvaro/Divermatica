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

function validar_jogador(array $dados): array {
    $posicoes_validas = ['Portero', 'Defensa', 'Lateral', 'Mediocampista', 'Delantero', ''];
    $niveis_validos   = ['Medio', 'Bueno', 'Muy Bueno'];

    $nome  = sanitizar_string($dados['nombre'] ?? '');
    $nivel = sanitizar_string($dados['nivel']  ?? '');

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

    $posicion = sanitizar_string($dados['posicion'] ?? '');
    if (!in_array($posicion, $posicoes_validas, true)) {
        $erros[] = 'Posición inválida';
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
        'nombre'   => $nome,
        'telefono' => sanitizar_string($dados['telefono'] ?? ''),
        'mail'     => $mail,
        'posicion' => $posicion,
        'nivel'    => $nivel,
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