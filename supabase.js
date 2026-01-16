// ============================================
// SUPABASE.JS - VERSIÓN CORREGIDA
// Sistema Grupo JDA
// ============================================

console.log('🔵 Iniciando carga de supabase.js...');

// ============================================
// CONFIGURACIÓN
// ============================================

// TODO: REEMPLAZA ESTOS VALORES CON LOS TUYOS DE SUPABASE
const SUPABASE_CONFIG = {
  url: 'https://aoogaytjhsgonzctprhx.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2dheXRqaHNnb256Y3Rwcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA1NjgsImV4cCI6MjA4NDA4NjU2OH0.NYTQJKEkjHVazLOyEVop84jh1pchoq_vwfZkyxbY6Fo'
};

console.log('📋 Configuración cargada:', {
  url: SUPABASE_CONFIG.url,
  keyLength: SUPABASE_CONFIG.key.length
});

// ============================================
// VERIFICAR SDK DE SUPABASE
// ============================================

function verificarSDK() {
  if (typeof window.supabase === 'undefined') {
    console.error('❌ ERROR: El SDK de Supabase no está disponible');
    console.error('Asegúrate de incluir el CDN ANTES de supabase.js:');
    console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    return false;
  }
  console.log('✅ SDK de Supabase detectado');
  return true;
}

// ============================================
// CLASE DE SERVICIO DE BASE DE DATOS
// ============================================

class DatabaseService {
  
  constructor() {
    console.log('🔧 Inicializando DatabaseService...');
    
    if (!verificarSDK()) {
      throw new Error('SDK de Supabase no disponible');
    }
    
    // Verificar configuración
    if (SUPABASE_CONFIG.url.includes('tu-proyecto')) {
      console.warn('⚠️ ADVERTENCIA: Debes configurar tu URL de Supabase');
    }
    if (SUPABASE_CONFIG.key.includes('tu-clave')) {
      console.warn('⚠️ ADVERTENCIA: Debes configurar tu clave de Supabase');
    }
    
    try {
      // Crear cliente de Supabase
      this.supabase = window.supabase.createClient(
        SUPABASE_CONFIG.url, 
        SUPABASE_CONFIG.key
      );
      
      console.log('✅ Cliente de Supabase creado exitosamente');
      this.inicializado = true;
    } catch (error) {
      console.error('❌ Error al crear cliente de Supabase:', error);
      this.inicializado = false;
      throw error;
    }
  }
  
  // Verificar inicialización
  _verificar() {
    if (!this.inicializado || !this.supabase) {
      throw new Error('DatabaseService no está inicializado correctamente');
    }
  }
  
  // ==========================================
  // PRUEBA DE CONEXIÓN
  // ==========================================
  
  async probarConexion() {
    try {
      this._verificar();
      
      console.log('🔍 Probando conexión con Supabase...');
      
      const { data, error, count } = await this.supabase
        .from('socios')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ Error en la consulta:', error);
        throw error;
      }
      
      console.log('✅ Conexión exitosa!');
      console.log(`📊 Total de socios: ${count}`);
      
      return { success: true, count };
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      
      let mensaje = 'Error desconocido';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        mensaje = 'No se puede conectar al servidor. Verifica:\n1. Tu URL de Supabase\n2. Tu conexión a internet\n3. Que el proyecto esté activo';
      } else if (error.message.includes('JWT') || error.message.includes('Invalid API key')) {
        mensaje = 'Clave de API inválida. Verifica tu ANON KEY en Settings > API';
      } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
        mensaje = 'La tabla "socios" no existe. Ejecuta el script SQL en Supabase > SQL Editor';
      } else {
        mensaje = error.message;
      }
      
      return { success: false, error: mensaje };
    }
  }
  
  // ==========================================
  // SOCIOS
  // ==========================================
  
  async obtenerSocios() {
    try {
      this._verificar();
      
      console.log('📥 Obteniendo lista de socios...');
      
      const { data, error } = await this.supabase
        .from('socios')
        .select('*')
        .eq('activo', true)
        .order('nombre_completo', { ascending: true });
      
      if (error) {
        console.error('❌ Error al obtener socios:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} socios obtenidos`);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async obtenerSocioPorId(id) {
    try {
      this._verificar();
      
      const { data, error } = await this.supabase
        .from('socios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // PRÉSTAMOS
  // ==========================================
  
  async crearSimulacionPrestamo(prestamoData) {
    try {
      this._verificar();
      
      console.log('💾 Creando simulación de préstamo...');
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .insert([{
          socio_id: parseInt(prestamoData.socioId),
          monto: parseFloat(prestamoData.monto),
          plazo_meses: parseInt(prestamoData.plazo),
          tasa_anual: 0.10,
          tasa_mensual: 0.10 / 12,
          cuota_mensual: parseFloat(prestamoData.cuotaMensual),
          total_intereses: parseFloat(prestamoData.totalIntereses),
          total_pagar: parseFloat(prestamoData.totalPagar),
          fecha_primera_cuota: prestamoData.tabla[0].fechaPago.toISOString().split('T')[0],
          estado: 'Simulado',
          observaciones: prestamoData.observaciones || null,
          cuotas_minimas_precancelar: Math.ceil(prestamoData.plazo * 0.25)
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error al crear préstamo:', error);
        throw error;
      }
      
      console.log('✅ Préstamo creado con ID:', data.id);
      
      // Guardar tabla de amortización
      await this.guardarTablaAmortizacion(data.id, prestamoData.tabla);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async guardarTablaAmortizacion(prestamoId, tabla) {
    try {
      this._verificar();
      
      console.log('💾 Guardando tabla de amortización...');
      
      const filas = tabla.map(fila => ({
        prestamo_id: prestamoId,
        numero_cuota: fila.numero,
        fecha_pago: fila.fechaPago.toISOString().split('T')[0],
        saldo_inicial: parseFloat(fila.saldoInicial),
        cuota: parseFloat(fila.cuota),
        interes: parseFloat(fila.interes),
        capital: parseFloat(fila.capital),
        saldo_final: parseFloat(fila.saldoFinal),
        pagada: false
      }));
      
      const { data, error } = await this.supabase
        .from('amortizacion')
        .insert(filas)
        .select();
      
      if (error) {
        console.error('❌ Error al guardar amortización:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} cuotas guardadas`);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async enviarPrestamoAprobacion(prestamoId) {
    try {
      this._verificar();
      
      console.log('📤 Enviando préstamo a aprobación...');
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .update({ 
          estado: 'Pendiente',
          fecha_solicitud: new Date().toISOString()
        })
        .eq('id', prestamoId)
        .select();
      
      if (error) throw error;
      
      console.log('✅ Préstamo enviado');
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async obtenerPrestamosPendientes() {
    try {
      this._verificar();
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .select(`
          *,
          socios (
            id,
            nombre_completo,
            cedula
          )
        `)
        .eq('estado', 'Pendiente')
        .order('fecha_solicitud', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let db = null;

function inicializarDB() {
  try {
    console.log('🚀 Intentando inicializar DatabaseService...');
    
    if (!verificarSDK()) {
      throw new Error('SDK de Supabase no disponible');
    }
    
    db = new DatabaseService();
    window.db = db; // Hacer disponible globalmente
    
    console.log('✅ DatabaseService inicializado correctamente');
    console.log('💡 Puedes usar "db" en la consola para probar');
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar DatabaseService:', error);
    return false;
  }
}

// Intentar inicializar inmediatamente
if (document.readyState === 'loading') {
  console.log('⏳ Esperando a que el DOM esté listo...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM listo');
    inicializarDB();
  });
} else {
  console.log('✅ DOM ya está listo');
  inicializarDB();
}

// ============================================
// FUNCIÓN DE PRUEBA GLOBAL
// ============================================

async function probarConexion() {
  if (!db) {
    console.error('❌ db no está inicializado');
    return { success: false, error: 'DatabaseService no inicializado' };
  }
  return await db.probarConexion();
}

window.probarConexion = probarConexion;

console.log('✅ supabase.js cargado completamente');
