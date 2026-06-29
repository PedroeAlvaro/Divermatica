<?php
/**
 * API para obtener estadísticas administrativas
 * GET - retorna datos de estadísticas
 */

require_once __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

require_once __DIR__ . '/admin_verificar.php';
require_once __DIR__ . '/conexion.php';

// GET - obtener estadísticas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Total de usuarios
    $stmtUsuarios = $pdo->prepare('SELECT COUNT(*) as total FROM usuarios');
    $stmtUsuarios->execute();
    $totalUsuarios = $stmtUsuarios->fetch()['total'];
    
    // Total de jugadores
    $stmtJugadores = $pdo->prepare('SELECT COUNT(*) as total FROM jugadores');
    $stmtJugadores->execute();
    $totalJugadores = $stmtJugadores->fetch()['total'];
    
    // Total de deportes
    $stmtDeportes = $pdo->prepare('SELECT COUNT(*) as total FROM deportes');
    $stmtDeportes->execute();
    $totalDeportes = $stmtDeportes->fetch()['total'];
    
    // Últimos 5 usuarios registados
    $stmtRecientes = $pdo->prepare('SELECT id, username, created_at FROM usuarios ORDER BY created_at DESC LIMIT 5');
    $stmtRecientes->execute();
    $usuariosRecientes = $stmtRecientes->fetchAll();
    
    // Jugadores por nivel
    $stmtNiveles = $pdo->prepare('SELECT nivel, COUNT(*) as cantidad FROM jugadores GROUP BY nivel ORDER BY 
        CASE nivel 
            WHEN "Medio" THEN 1
            WHEN "Bueno" THEN 2
            WHEN "Muy Bueno" THEN 3
            ELSE 4
        END');
    $stmtNiveles->execute();
    $jugadoresPorNivel = $stmtNiveles->fetchAll();
    
    echo json_encode([
        'total_usuarios' => (int)$totalUsuarios,
        'total_jugadores' => (int)$totalJugadores,
        'total_deportes' => (int)$totalDeportes,
        'usuarios_recientes' => $usuariosRecientes,
        'jugadores_por_nivel' => $jugadoresPorNivel
    ]);
    exit;
}

// Método no permitido
http_response_code(405);
echo json_encode(['erro' => 'Método no permitido']);
?>
