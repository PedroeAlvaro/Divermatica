<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'php_ok' => true,
    'php_version' => phpversion(),
]);

// Testar conexão BD
try {
    require_once __DIR__ . '/../.env';
    require_once __DIR__ . '/conexion.php';
    
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM usuarios');
    $stmt->execute();
    $resultado = $stmt->fetch();
    
    echo json_encode([
        'php_ok' => true,
        'bd_ok' => true,
        'usuarios_na_bd' => $resultado['total']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'php_ok' => true,
        'bd_ok' => false,
        'erro' => $e->getMessage()
    ]);
}
?>
