// ============================================
// AUTH.JS - Sistema de Autenticación
// ============================================

let authInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    inicializarAuth();
    setupAuthListeners();
});

// ============================================
// INICIALIZACIÓN
// ============================================

async function inicializarAuth() {
    try {
        // Verificar si ya hay sesión activa
        if (db && db.supabase) {
            const { data: { session } } = await db.supabase.auth.getSession();
            
            if (session) {
                // Ya hay sesión, redirigir según rol
                const usuario = await obtenerDatosUsuario(session.user.id);
                if (usuario) {
                    redirigirSegunRol(usuario.rol);
                }
            }
            
            authInitialized = true;
        }
    } catch (error) {
        console.error('Error al inicializar auth:', error);
    }
}

function setupAuthListeners() {
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registroForm')?.addEventListener('submit', handleRegistro);
}

// ============================================
// CAMBIAR TABS
// ============================================

function cambiarTab(tab) {
    // Cambiar tabs activos
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('registroTab').classList.add('active');
    }
    
    ocultarAlerta();
}

// ============================================
// LOGIN
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        mostrarAlerta('❌ Completa todos los campos', 'error');
        return;
    }
    
    mostrarCargando(true);
    ocultarAlerta();
    
    try {
        const { data, error } = await db.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Obtener rol del usuario
        const usuario = await obtenerDatosUsuario(data.user.id);
        
        if (!usuario) {
            throw new Error('No se encontraron datos del usuario');
        }
        
        mostrarAlerta('✅ Inicio de sesión exitoso', 'success');
        
        // Redirigir según rol
        setTimeout(() => {
            redirigirSegunRol(usuario.rol);
        }, 1000);
        
    } catch (error) {
        console.error('Error de login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
            mostrarAlerta('❌ Email o contraseña incorrectos', 'error');
        } else if (error.message.includes('Email not confirmed')) {
            mostrarAlerta('⚠️ Debes confirmar tu email antes de iniciar sesión', 'warning');
        } else {
            mostrarAlerta('❌ Error: ' + error.message, 'error');
        }
    } finally {
        mostrarCargando(false);
    }
}

// ============================================
// REGISTRO
// ============================================

async function handleRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Validaciones
    if (!nombre || !email || !password || !passwordConfirm) {
        mostrarAlerta('❌ Completa todos los campos', 'error');
        return;
    }
    
    if (nombre.length < 3) {
        mostrarAlerta('❌ El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (password.length < 6) {
        mostrarAlerta('❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        mostrarAlerta('❌ Las contraseñas no coinciden', 'error');
        return;
    }
    
    mostrarCargando(true);
    ocultarAlerta();
    
    try {
        // Registrar usuario en Supabase Auth
        const { data, error } = await db.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre
                }
            }
        });
        
        if (error) throw error;
        
        // Crear registro en tabla usuarios
        const { error: errorUsuario } = await db.supabase
            .from('usuarios')
            .insert([{
                email: email,
                nombre: nombre,
                rol: 'socio', // Por defecto es socio
                activo: true
            }]);
        
        if (errorUsuario) {
            console.error('Error al crear usuario:', errorUsuario);
        }
        
        // Mostrar mensaje de éxito
        document.getElementById('successMessage').textContent = 
            '✅ Registro exitoso! Revisa tu email para confirmar tu cuenta.';
        document.getElementById('successMessage').style.display = 'block';
        
        // Limpiar formulario
        document.getElementById('registroForm').reset();
        
        // Cambiar a tab de login después de 3 segundos
        setTimeout(() => {
            cambiarTab('login');
            document.getElementById('successMessage').style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error de registro:', error);
        
        if (error.message.includes('already registered')) {
            mostrarAlerta('❌ Este email ya está registrado', 'error');
        } else {
            mostrarAlerta('❌ Error: ' + error.message, 'error');
        }
    } finally {
        mostrarCargando(false);
    }
}

// ============================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================

function mostrarRecuperacion() {
    const email = prompt('Ingresa tu email para recuperar tu contraseña:');
    
    if (!email) return;
    
    if (!email.includes('@')) {
        alert('❌ Email inválido');
        return;
    }
    
    enviarRecuperacion(email);
}

async function enviarRecuperacion(email) {
    mostrarCargando(true);
    
    try {
        const { error } = await db.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        alert('✅ Se ha enviado un email de recuperación a ' + email);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al enviar email de recuperación');
    } finally {
        mostrarCargando(false);
    }
}

// ============================================
// OBTENER DATOS DE USUARIO
// ============================================

async function obtenerDatosUsuario(userId) {
    try {
        const { data: session } = await db.supabase.auth.getSession();
        
        if (!session || !session.session) return null;
        
        const email = session.session.user.email;
        
        const { data, error } = await db.supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) throw error;
        
        return data;
        
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
}

// ============================================
// REDIRIGIR SEGÚN ROL
// ============================================

function redirigirSegunRol(rol) {
    if (rol === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'index.html';
    }
}

// ============================================
// CERRAR SESIÓN (para usar en otras páginas)
// ============================================

async function cerrarSesion() {
    try {
        const { error } = await db.supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

// ============================================
// VERIFICAR SESIÓN ACTIVA (para usar en otras páginas)
// ============================================

async function verificarSesion() {
    try {
        const { data: { session } } = await db.supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return null;
        }
        
        return await obtenerDatosUsuario(session.user.id);
        
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'login.html';
        return null;
    }
}

// ============================================
// UTILIDADES
// ============================================

function mostrarAlerta(mensaje, tipo = 'error') {
    const alert = document.getElementById('alert');
    alert.textContent = mensaje;
    alert.className = `alert ${tipo} show`;
    
    setTimeout(() => {
        ocultarAlerta();
    }, 5000);
}

function ocultarAlerta() {
    const alert = document.getElementById('alert');
    alert.classList.remove('show');
}

function mostrarCargando(mostrar) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = mostrar ? 'block' : 'none';
    }
}

// Hacer funciones globales
window.cerrarSesion = cerrarSesion;
window.verificarSesion = verificarSesion;
