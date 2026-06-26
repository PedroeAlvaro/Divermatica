<?php

function _jwt_base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function _jwt_base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_generate(array $payload, string $secret, int $expiry = 28800): string {
    $header = _jwt_base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

    $payload['iat'] = time();
    $payload['exp'] = time() + $expiry;
    $payload_encoded = _jwt_base64url_encode(json_encode($payload));

    $signature = _jwt_base64url_encode(
        hash_hmac('sha256', "$header.$payload_encoded", $secret, true)
    );

    return "$header.$payload_encoded.$signature";
}

function jwt_verificar(string $secret): array {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$auth || !str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['erro' => 'Token ausente ou formato inválido']);
        exit;
    }

    $token  = substr($auth, 7);
    $partes = explode('.', $token);

    if (count($partes) !== 3) {
        http_response_code(401);
        echo json_encode(['erro' => 'Token malformado']);
        exit;
    }

    [$header, $payload_encoded, $signature_recebida] = $partes;

    $assinatura_esperada = _jwt_base64url_encode(
        hash_hmac('sha256', "$header.$payload_encoded", $secret, true)
    );

    if (!hash_equals($assinatura_esperada, $signature_recebida)) {
        http_response_code(401);
        echo json_encode(['erro' => 'Assinatura inválida']);
        exit;
    }

    $payload = json_decode(_jwt_base64url_decode($payload_encoded), true);

    if (!$payload || !isset($payload['exp']) || time() > $payload['exp']) {
        http_response_code(401);
        echo json_encode(['erro' => 'Token expirado']);
        exit;
    }

    return $payload;
}