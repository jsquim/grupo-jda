// ============================================
// CONFIG.JS - Configuración Central del Sistema
// Grupo JDA - Sistema de Préstamos
// ============================================

const APP_CONFIG = {
  // Información del sistema
  nombre: 'Grupo JDA',
  version: '1.0.0',
  
  // Parámetros de préstamos
  prestamos: {
    tasaAnual: 0.10,                    // 10% anual
    tasaMensual: 0.10 / 12,             // ~0.833% mensual
    montoMinimo: 100,
    montoMaximo: 4000,
    plazoMinimo: 1,
    plazoMaximo: 36,
    diasPrimeraCuota: 45,               // 30 días + 15 gracia
    diasGracia: 15,
    porcentajePrecancelacion: 0.25      // 25% de cuotas pagadas
  },
  
  // Parámetros del grupo
  grupo: {
    numeroSocios: 13,
    aporteCapitalSemanal: 3,            // $3 semanales
    aporteAhorroSemanal: 2              // $2 semanales a repartir
  },
  
  // Supabase - ACTUALIZAR CON TUS CREDENCIALES
  supabase: {
    url: 'https://tu-proyecto.supabase.co',
    anonKey: 'tu-clave-anonima-aqui'
  },
  
  // Rutas de navegación
  rutas: {
    login: 'login.html',
    simulador: 'index.html',
    admin: 'admin.html'
  },
  
  // Mensajes del sistema
  mensajes: {
    errorConexion: 'Error de conexión con la base de datos',
    errorGenerico: 'Ha ocurrido un error. Intenta nuevamente.',
    exitoEnvio: 'Solicitud enviada correctamente',
    exitoLogin: 'Inicio de sesión exitoso',
    exitoRegistro: 'Registro exitoso'
  },
  
  // Validaciones
  validaciones: {
    cedulaLongitud: 10,
    nombreMinimo: 5,
    passwordMinimo: 6
  }
};

// Hacer disponible globalmente
window.APP_CONFIG = APP_CONFIG;

// Función para actualizar configuración de Supabase
function configurarSupabase(url, key) {
  APP_CONFIG.supabase.url = https://aoogaytjhsgonzctprhx.supabase.co;
  APP_CONFIG.supabase.anonKey = keyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2dheXRqaHNnb256Y3Rwcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA1NjgsImV4cCI6MjA4NDA4NjU2OH0.NYTQJKEkjHVazLOyEVop84jh1pchoq_vwfZkyxbY6Foey;
  console.log('✅ Configuración de Supabase actualizada');
}

window.configurarSupabase = configurarSupabase;
