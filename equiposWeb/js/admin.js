/**
 * Sistema de Administración - MATCHORA
 * Gestión de usuarios, logs y estadísticas
 */

// ── Verificación de Admin ────────────────────────────

function verificarAdmin() {
    const token = getToken();
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Verificar expiración
        if (Date.now() / 1000 > payload.exp) {
            eliminarToken();
            window.location.href = 'login.html';
            return;
        }
        
        // Verificar role de admin
        if (payload.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        // Token válido y es admin
        return payload;
    } catch (e) {
        eliminarToken();
        window.location.href = 'login.html';
    }
}

// Verificar admin al cargar la página
const payloadAdmin = verificarAdmin();

// ── Navegación entre Secciones ─────────────────────

function navegarSeccion(seccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(el => {
        el.classList.remove('activa');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.nav-boton').forEach(el => {
        el.classList.remove('activo');
    });
    
    // Mostrar sección elegida
    document.getElementById(seccion).classList.add('activa');
    
    // Activar botón correspondiente
    event.target.classList.add('activo');
    
    // Cargar datos según la sección
    switch(seccion) {
        case 'dashboard':
            cargarDashboard();
            break;
        case 'usuarios':
            cargarUsuarios();
            break;
        case 'logs':
            cargarLogs();
            break;
        case 'estadisticas':
            cargarEstadisticas();
            break;
    }
}

// ── DASHBOARD ──────────────────────────────────────

async function cargarDashboard() {
    try {
        const response = await apiFetch(`${API_URL}admin_stats.php`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error cargando dashboard:', data);
            return;
        }
        
        // Rellenar cards
        document.getElementById('card-usuarios').textContent = escapeHtml(String(data.total_usuarios));
        document.getElementById('card-jugadores').textContent = escapeHtml(String(data.total_jugadores));
        document.getElementById('card-deportes').textContent = escapeHtml(String(data.total_deportes));
        
        // Rellenar tabla de últimos registos
        let html = '';
        data.usuarios_recientes.forEach(user => {
            const fecha = new Date(user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            html += `<tr>
                <td>${escapeHtml(String(user.id))}</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(fecha)}</td>
            </tr>`;
        });
        document.getElementById('tabla-registos').innerHTML = html || '<tr><td colspan="3" class="sin-datos">No hay registos</td></tr>';
        
        // Gráfico de jugadores por nivel
        renderizarGrafico('chart-niveles', data.jugadores_por_nivel);
        
    } catch (error) {
        console.error('Error en cargarDashboard:', error);
    }
}

// ── USUARIOS ───────────────────────────────────────

async function cargarUsuarios() {
    try {
        const response = await apiFetch(`${API_URL}admin_usuarios.php`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error cargando usuarios:', data);
            return;
        }
        
        let html = '';
        data.usuarios.forEach(user => {
            const fecha = new Date(user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            const roleActual = user.role;
            const roleNuevo = roleActual === 'admin' ? 'user' : 'admin';
            const textoBoton = roleActual === 'admin' ? 'Tornar User' : 'Tornar Admin';
            
            // No mostrar botón eliminar si es el propio usuario o último admin
            let botonesAccion = `
                <button class="btn-pequeño btn-role" 
                    onclick="alterarRole(${user.id}, '${roleActual}')">
                    ${textoBoton}
                </button>
            `;
            
            // Agregar botón eliminar solo si no es el usuario logado
            if (payloadAdmin.sub != user.id) {
                botonesAccion += `
                    <button class="btn-pequeño btn-eliminar" 
                        onclick="eliminarUsuario(${user.id}, '${escapeHtml(user.username)}')">
                        Eliminar
                    </button>
                `;
            }
            
            html += `<tr>
                <td>${escapeHtml(String(user.id))}</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${badgeRole(user.role)}</td>
                <td>${escapeHtml(fecha)}</td>
                <td>
                    <div class="tabla-acciones">
                        ${botonesAccion}
                    </div>
                </td>
            </tr>`;
        });
        
        document.getElementById('tabla-usuarios').innerHTML = html || '<tr><td colspan="5" class="sin-datos">No hay usuarios</td></tr>';
        
    } catch (error) {
        console.error('Error en cargarUsuarios:', error);
    }
}

async function alterarRole(id, roleActual) {
    const roleNuevo = roleActual === 'admin' ? 'user' : 'admin';
    const textoConfirmar = `¿Cambiar rol de este usuario a "${roleNuevo}"?`;
    
    if (!confirm(textoConfirmar)) return;
    
    try {
        const response = await apiFetch(`${API_URL}admin_usuarios.php`, {
            method: 'PUT',
            body: JSON.stringify({ id, role: roleNuevo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            cargarUsuarios();
        } else {
            alert('Error: ' + (data.erro || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error alterando role:', error);
        alert('Error al cambiar rol');
    }
}

async function eliminarUsuario(id, username) {
    const textoConfirmar = `¿Eliminar usuario "${username}"? Esta acción no se puede deshacer.`;
    
    if (!confirm(textoConfirmar)) return;
    
    try {
        const response = await apiFetch(`${API_URL}admin_usuarios.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            cargarUsuarios();
        } else {
            alert('Error: ' + (data.erro || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('Error al eliminar usuario');
    }
}

// ── LOGS ───────────────────────────────────────────

async function cargarLogs() {
    try {
        const tipo = document.getElementById('filtro-tipo').value;
        const username = document.getElementById('filtro-username').value;
        
        let url = `${API_URL}admin_logs.php`;
        const params = [];
        if (tipo) params.push(`tipo=${encodeURIComponent(tipo)}`);
        if (username) params.push(`username=${encodeURIComponent(username)}`);
        if (params.length) url += '?' + params.join('&');
        
        const response = await apiFetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error cargando logs:', data);
            return;
        }
        
        let html = '';
        data.logs.forEach(log => {
            const fecha = new Date(log.criado_em).toLocaleString('es-ES');
            const badge = badgeTipo(log.tipo);
            
            html += `<tr>
                <td>${escapeHtml(String(log.id))}</td>
                <td>${badge}</td>
                <td>${escapeHtml(log.username || '-')}</td>
                <td>${escapeHtml(log.ip || '-')}</td>
                <td>${escapeHtml(log.detalhes || '-')}</td>
                <td>${escapeHtml(fecha)}</td>
            </tr>`;
        });
        
        document.getElementById('tabla-logs').innerHTML = html || '<tr><td colspan="6" class="sin-dados">No hay logs</td></tr>';
        
    } catch (error) {
        console.error('Error en cargarLogs:', error);
    }
}

// ── ESTADÍSTICAS ───────────────────────────────────

async function cargarEstadisticas() {
    try {
        const response = await apiFetch(`${API_URL}admin_stats.php`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Error cargando estadísticas:', data);
            return;
        }
        
        // Rellenar cards
        document.getElementById('stat-usuarios').textContent = escapeHtml(String(data.total_usuarios));
        document.getElementById('stat-jugadores').textContent = escapeHtml(String(data.total_jugadores));
        document.getElementById('stat-deportes').textContent = escapeHtml(String(data.total_deportes));
        
        // Gráfico
        renderizarGrafico('chart-estadisticas', data.jugadores_por_nivel);
        
    } catch (error) {
        console.error('Error en cargarEstadisticas:', error);
    }
}

// ── UTILIDADES ─────────────────────────────────────

function badgeRole(role) {
    const esAdmin = role === 'admin';
    const clase = esAdmin ? 'nivel-muybueno' : 'nivel-medio';
    const texto = esAdmin ? 'Admin' : 'Usuario';
    return `<span class="${clase}">${texto}</span>`;
}

function badgeTipo(tipo) {
    switch(tipo) {
        case 'login':
            return '<span class="badge-login">Login</span>';
        case 'login_falhou':
            return '<span class="badge-login-falhou">Login Falhou</span>';
        case 'registro':
            return '<span class="badge-registro">Registro</span>';
        default:
            return `<span>${escapeHtml(tipo)}</span>`;
    }
}

function renderizarGrafico(elementId, datos) {
    if (!datos || datos.length === 0) {
        document.getElementById(elementId).innerHTML = '<div class="sin-datos">Sin datos disponibles</div>';
        return;
    }
    
    // Encontrar valor máximo para escala
    const maxValor = Math.max(...datos.map(d => d.cantidad));
    const escala = maxValor > 0 ? 100 / maxValor : 100;
    
    let html = '';
    datos.forEach(item => {
        const porcentaje = (item.cantidad / maxValor) * 100;
        html += `
            <div class="chart-bar">
                <div class="chart-label">${escapeHtml(item.nivel)}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${porcentaje}%">
                        ${item.cantidad}
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById(elementId).innerHTML = html;
}

function cerrarSesionAdmin() {
    if (confirm('¿Cerrar sesión?')) {
        eliminarToken();
        window.location.href = 'login.html';
    }
}

// ── Cargar Dashboard al iniciar ────────────────────
window.addEventListener('load', () => {
    cargarDashboard();
});
