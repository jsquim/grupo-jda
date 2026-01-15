// ============================================
// SUPABASE.JS - CONFIGURACIÓN CORREGIDA
// ============================================

// IMPORTANTE: Verifica que hayas incluido el CDN de Supabase en tu HTML
// Debe estar ANTES de este archivo:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="supabase.js"></script>

// ============================================
// PASO 1: CONFIGURACIÓN
// ============================================

// TODO: REEMPLAZA ESTOS VALORES CON LOS TUYOS
const SUPABASE_CONFIG = {
  url: 'https://aoogaytjhsgonzctprhx.supabase.co',  // SIN barra al final
  key: 'sb_publishable_T1hhSHAVSMN_Lt9sZ6jCAg_3SXjOPA0'
};

// Validar que se hayan configurado las credenciales
if (SUPABASE_CONFIG.url.includes('tu-proyecto') || SUPABASE_CONFIG.key.includes('tu-clave')) {
  console.error('❌ ERROR: Debes configurar tus credenciales de Supabase en supabase.js');
  alert('⚠️ Configuración pendiente\n\nDebes editar supabase.js y colocar tus credenciales de Supabase.\n\nVe a: Settings > API en tu proyecto de Supabase');
}

// ============================================
// PASO 2: INICIALIZAR CLIENTE
// ============================================

let supabase = null;

// Función para inicializar Supabase de forma segura
function inicializarSupabase() {
  try {
    // Verificar que el SDK de Supabase esté cargado
    if (typeof window.supabase === 'undefined') {
      throw new Error('El SDK de Supabase no está cargado. Verifica que hayas incluido el script del CDN.');
    }
    
    // Crear cliente
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    
    console.log('✅ Supabase inicializado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
    return false;
  }
}

// Inicializar automáticamente cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
  inicializarSupabase();
}

// ============================================
// PASO 3: FUNCIÓN DE PRUEBA DE CONEXIÓN
// ============================================

async function probarConexion() {
  try {
    console.log('🔍 Probando conexión con Supabase...');
    
    if (!supabase) {
      throw new Error('Supabase no está inicializado');
    }
    
    // Intentar obtener datos de la tabla socios
    const { data, error, count } = await supabase
      .from('socios')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error en la consulta:', error);
      throw error;
    }
    
    console.log('✅ Conexión exitosa!');
    console.log(`📊 Número de socios en la base de datos: ${count}`);
    
    return { success: true, message: 'Conexión exitosa' };
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    
    let mensajeError = 'Error de conexión: ';
    
    if (error.message.includes('Failed to fetch')) {
      mensajeError += 'No se puede conectar al servidor. Verifica tu URL de Supabase.';
    } else if (error.message.includes('JWT')) {
      mensajeError += 'Clave de API inválida. Verifica tu ANON KEY.';
    } else if (error.message.includes('relation') || error.message.includes('does not exist')) {
      mensajeError += 'La tabla "socios" no existe. ¿Ejecutaste el script SQL?';
    } else {
      mensajeError += error.message;
    }
    
    return { success: false, error: mensajeError };
  }
}

// ============================================
// CLASE DE SERVICIO DE BASE DE DATOS
// ============================================

class DatabaseService {
  
  constructor() {
    this.supabase = supabase;
  }
  
  // Verificar que Supabase esté inicializado antes de cada operación
  _verificarInicializacion() {
    if (!this.supabase) {
      throw new Error('Supabase no está inicializado. Recarga la página.');
    }
  }
  
  // ==========================================
  // SOCIOS
  // ==========================================
  
  async obtenerSocios() {
    try {
      this._verificarInicializacion();
      
      console.log('📥 Obteniendo socios...');
      
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
      this._verificarInicializacion();
      
      const { data, error } = await this.supabase
        .from('socios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error al obtener socio:', error);
      return { success: false, error: error.message };
    }
  }
  
  async crearSocio(socioData) {
    try {
      this._verificarInicializacion();
      
      const { data, error } = await this.supabase
        .from('socios')
        .insert([{
          nombre_completo: socioData.nombre,
          cedula: socioData.cedula,
          telefono: socioData.telefono,
          email: socioData.email,
          capital_acumulado: 0
        }])
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error al crear socio:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // PRÉSTAMOS
  // ==========================================
  
  async crearSimulacionPrestamo(prestamoData) {
    try {
      this._verificarInicializacion();
      
      console.log('💾 Guardando simulación de préstamo...');
      console.log('Datos:', prestamoData);
      
      // Convertir fecha a formato ISO
      const fechaPrimeraCuota = prestamoData.tabla[0].fechaPago instanceof Date 
        ? prestamoData.tabla[0].fechaPago.toISOString().split('T')[0]
        : prestamoData.tabla[0].fechaPago;
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .insert([{
          socio_id: prestamoData.socioId,
          monto: parseFloat(prestamoData.monto),
          plazo_meses: parseInt(prestamoData.plazo),
          tasa_anual: 0.11,
          tasa_mensual: 0.11 / 12,
          cuota_mensual: parseFloat(prestamoData.cuotaMensual),
          total_intereses: parseFloat(prestamoData.totalIntereses),
          total_pagar: parseFloat(prestamoData.totalPagar),
          fecha_primera_cuota: fechaPrimeraCuota,
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
      if (data && prestamoData.tabla) {
        await this.guardarTablaAmortizacion(data.id, prestamoData.tabla);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error completo:', error);
      return { success: false, error: error.message };
    }
  }
  
  async guardarTablaAmortizacion(prestamoId, tabla) {
    try {
      this._verificarInicializacion();
      
      console.log('💾 Guardando tabla de amortización...');
      
      const filas = tabla.map(fila => ({
        prestamo_id: prestamoId,
        numero_cuota: fila.numero,
        fecha_pago: fila.fechaPago instanceof Date 
          ? fila.fechaPago.toISOString().split('T')[0]
          : fila.fechaPago,
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
      this._verificarInicializacion();
      
      console.log('📤 Enviando préstamo a aprobación...');
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .update({ 
          estado: 'Pendiente',
          fecha_solicitud: new Date().toISOString()
        })
        .eq('id', prestamoId)
        .eq('estado', 'Simulado')
        .select();
      
      if (error) throw error;
      
      console.log('✅ Préstamo enviado a aprobación');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async obtenerPrestamosPendientes() {
    try {
      this._verificarInicializacion();
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .select(`
          *,
          socios (
            id,
            nombre_completo,
            cedula,
            capital_acumulado
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
  
  async aprobarPrestamo(prestamoId, aprobadoPor) {
    try {
      this._verificarInicializacion();
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .update({ 
          estado: 'Aprobado',
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: aprobadoPor
        })
        .eq('id', prestamoId)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async rechazarPrestamo(prestamoId, motivo) {
    try {
      this._verificarInicializacion();
      
      const { data, error } = await this.supabase
        .from('prestamos')
        .update({ 
          estado: 'Rechazado',
          observaciones: motivo
        })
        .eq('id', prestamoId)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // MÉTODOS DE UTILIDAD
  // ==========================================
  
  async verificarConexion() {
    return await probarConexion();
  }
}

// ============================================
// EXPORTAR INSTANCIA ÚNICA
// ============================================

// Crear instancia global
let db = null;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    db = new DatabaseService();
    console.log('✅ DatabaseService inicializado');
  });
} else {
  db = new DatabaseService();
  console.log('✅ DatabaseService inicializado');
}

// Hacer disponible globalmente para debug
window.db = db;
window.probarConexion = probarConexion;

console.log('📦 supabase.js cargado');
console.log('💡 Para probar la conexión, ejecuta en la consola: probarConexion()');
