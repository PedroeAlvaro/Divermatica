<?php
/**
 * API para gestión de usuarios administrativos
 * GET - listar usuarios
 * GET ?id=N - obtener usuario específico
 * DELETE ?id=N - eliminar usuario
 * PUT - actualizar role
 */

require_once __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(200); 
    exit; 
}

require_once __DIR__ . '/admin_verificar.php';
require_once __DIR__ . '/conexion.php';
require_once __DIR__ . '/middleware/rate_limit.php';

rate_limit_verificar();

// GET - listar o un usuario específico
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Obtener usuario específico
        $id = (int)$_GET['id'];
        $stmt = $pdo->prepare('SELECT id, username, created_at, role FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();
        
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['erro' => 'Usuario no encontrado']);
            exit;
        }
        
        echo json_encode($usuario);
    } else {
        // Listar todos los usuarios
        $stmt = $pdo->prepare('SELECT id, username, created_at, role FROM usuarios ORDER BY created_at DESC');
        $stmt->execute();
        $usuarios = $stmt->fetchAll();
        echo json_encode(['usuarios' => $usuarios]);
    }
    exit;
}

// DELETE - eliminar usuario
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'ID requerido']);
        exit;
    }
    
    $id = (int)$_GET['id'];
    
    // No permitir eliminar al propio usuario logado
    if ($payload['sub'] == $id) {
        http_response_code(400);
        echo json_encode(['erro' => 'No puedes eliminar tu propia cuenta']);
        exit;
    }
    
    // Verificar si es el último admin
    $stmtCheck = $pdo->prepare('SELECT COUNT(*) as admin_count FROM usuarios WHERE role = "admin"');
    $stmtCheck->execute();
    $result = $stmtCheck->fetch();
    
    if ($result['admin_count'] <= 1) {
        http_response_code(400);
        echo json_encode(['erro' => 'No se puede eliminar el último administrador']);
        exit;
    }
    
    // Verificar que el usuario a eliminar es realmente un admin
    $stmtVerify = $pdo->prepare('SELECT role FROM usuarios WHERE id = ?');
    $stmtVerify->execute([$id]);
    $user = $stmtVerify->fetch();
    
    if ($user && $user['role'] === 'admin' && $result['admin_count'] === 1) {
        http_response_code(400);
        echo json_encode(['erro' => 'No se puede eliminar el último administrador']);
        exit;
    }
    
    // Eliminar usuario
    $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    
    echo json_encode(['ok' => true]);
    exit;
}

// PUT - actualizar role
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($datos['id']) || !isset($datos['role'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'ID y role son requeridos']);
        exit;
    }
    
    $id = (int)$datos['id'];
    $role = $datos['role'];
    
    // Validar role
    if (!in_array($role, ['admin', 'user'])) {
        http_response_code(400);
        echo json_encode(['erro' => 'Role inválido. Debe ser "admin" o "user"']);
        exit;
    }
    
    // No permitir cambiar el role del propio usuario
    if ($payload['sub'] == $id && $role === 'user') {
        http_response_code(400);
        echo json_encode(['erro' => 'No puedes remover tu propio rol de administrador']);
        exit;
    }
    
    // Actualizar role
    $stmt = $pdo->prepare('UPDATE usuarios SET role = ? WHERE id = ?');
    $stmt->execute([$role, $id]);
    
    echo json_encode(['ok' => true]);
    exit;
}

// Método no permitido
http_response_code(405);
echo json_encode(['erro' => 'Método no permitido']);
?>
