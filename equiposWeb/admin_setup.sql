-- =====================================================
-- ADMIN SETUP - Crear tablas y usuario administrador
-- Executar en MySQL Workbench o cliente MySQL
-- =====================================================

-- Adicionar coluna role a usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role ENUM('admin','user') NOT NULL DEFAULT 'user';

-- Adicionar coluna created_at a usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Crear tabla de logs (si no existe)
CREATE TABLE IF NOT EXISTS admin_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    tipo        VARCHAR(50)  NOT NULL,
    username    VARCHAR(100),
    ip          VARCHAR(45),
    detalhes    TEXT,
    criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_username (username),
    INDEX idx_criado (criado_em)
);

-- Crear usuario admin (password: admin123)
-- Hash bcrypt de "admin123" con cost=12
INSERT INTO usuarios (username, password_hash, role)
VALUES ('admin', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC7enSMEP3bIWbUI3Pom', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- =====================================================
-- Para cambiar la contraseña del admin:
-- 1. Generar nuevo hash en PHP: password_hash('tu_password', PASSWORD_BCRYPT, ['cost' => 12])
-- 2. Ejecutar: UPDATE usuarios SET password_hash = 'hash_aqui' WHERE username = 'admin';
-- =====================================================
