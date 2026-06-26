<?php

define('RATE_LIMIT_MAX',    60);
define('RATE_LIMIT_WINDOW', 60);
define('RATE_LIMIT_DIR',    sys_get_temp_dir() . '/matchora_rl/');

function rate_limit_verificar(): void {
    if (!is_dir(RATE_LIMIT_DIR)) {
        mkdir(RATE_LIMIT_DIR, 0700, true);
    }

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['HTTP_X_REAL_IP']
        ?? $_SERVER['REMOTE_ADDR']
        ?? '0.0.0.0';

    $ip_safe  = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $ip);
    $ficheiro = RATE_LIMIT_DIR . $ip_safe . '.json';

    $agora    = time();
    $contagem = 1;
    $inicio   = $agora;

    if (file_exists($ficheiro)) {
        $dados = json_decode(file_get_contents($ficheiro), true);

        if ($dados && isset($dados['inicio'], $dados['contagem'])) {
            if ($agora - $dados['inicio'] < RATE_LIMIT_WINDOW) {
                $contagem = $dados['contagem'] + 1;
                $inicio   = $dados['inicio'];
            }
        }
    }

    file_put_contents($ficheiro, json_encode([
        'inicio'   => $inicio,
        'contagem' => $contagem,
    ]), LOCK_EX);

    if ($contagem > RATE_LIMIT_MAX) {
        $retry_after = RATE_LIMIT_WINDOW - ($agora - $inicio);
        http_response_code(429);
        header('Retry-After: ' . $retry_after);
        echo json_encode([
            'erro'        => 'Demasiados pedidos. Tente novamente mais tarde.',
            'retry_after' => $retry_after,
        ]);
        exit;
    }
}