<?php
/**
 * API para obtener logs administrativos
 * GET - listar logs
 * GET ?tipo=X - filtrar por tipo
 * GET ?username=X - filtrar por username
 */

require_once __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

require_once __DIR__ . '/admin_verificar.php';
require_once __DIR__ . '/conexion.php';

// GET - listar logs con filtros opcionales
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = 'SELECT id, tipo, username, ip, detalhes, criado_em FROM admin_logs WHERE 1=1';
    $params = [];
    
    // Filtrar por tipo si se proporciona
    if (isset($_GET['tipo']) && !empty($_GET['tipo'])) {
        $query .= ' AND tipo = ?';
        $params[] = $_GET['tipo'];
    }
    
    // Filtrar por username si se proporciona
    if (isset($_GET['username']) && !empty($_GET['username'])) {
        $query .= ' AND username = ?';
        $params[] = $_GET['username'];
    }
    
    $query .= ' ORDER BY criado_em DESC LIMIT 200';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $logs = $stmt->fetchAll();
    
    echo json_encode(['logs' => $logs]);
    exit;
}

// Método no permitido
http_response_code(405);
echo json_encode(['erro' => 'Método no permitido']);
?>
