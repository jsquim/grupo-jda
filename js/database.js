// ============================================
// DATABASE.JS - Operaciones Simplificadas
// ============================================

let supabase = null;

// Inicializar Supabase
function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('❌ SDK de Supabase no cargado');
    return false;
  }
  
  if (CONFIG.supabaseUrl.includes('tu-proyecto')) {
    console.warn('⚠️ Configura tus credenciales en config.js');
    return false;
  }
  
  supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
  console.log('✅ Supabase inicializado');
  return true;
}

// Buscar o crear socio
async function buscarOCrearSocio(nombre, cedula) {
  try {
    // Buscar
    const { data: socios } = await supabase
      .from('socios')
      .select('id')
      .eq('cedula', cedula)
      .limit(1);
    
    if (socios && socios.length > 0) {
      return { success: true, id: socios[0].id };
    }
    
    // Crear
    const { data, error } = await supabase
      .from('socios')
      .insert([{ nombre_completo: nombre, cedula: cedula, activo: true }])
      .select();
    
    if (error) throw error;
    return { success: true, id: data[0].id };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Crear préstamo
async function crearPrestamo(datos) {
  try {
    const { data, error } = await supabase
      .from('prestamos')
      .insert([{
        socio_id: datos.socioId,
        monto: datos.monto,
        plazo_meses: datos.plazo,
        tasa_anual: CONFIG.tasaAnual,
        tasa_mensual: CONFIG.tasaMensual,
        cuota_mensual: datos.cuotaMensual,
        total_intereses: datos.totalIntereses,
        total_pagar: datos.totalPagar,
        fecha_primera_cuota: datos.primeraCuota,
        estado: 'Pendiente',
        cuotas_minimas_precancelar: Math.ceil(datos.plazo * 0.25)
      }])
      .select();
    
    if (error) throw error;
    
    // Guardar amortización
    await guardarAmortizacion(data[0].id, datos.tabla);
    
    return { success: true, id: data[0].id };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Guardar tabla de amortización
async function guardarAmortizacion(prestamoId, tabla) {
  try {
    const filas = tabla.map(f => ({
      prestamo_id: prestamoId,
      numero_cuota: f.numero,
      fecha_pago: f.fechaPago.toISOString().split('T')[0],
      saldo_inicial: f.saldoInicial,
      cuota: f.cuota,
      interes: f.interes,
      capital: f.capital,
      saldo_final: f.saldoFinal,
      pagada: false
    }));
    
    const { error } = await supabase.from('amortizacion').insert(filas);
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Login
async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    // Obtener rol
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('email', email)
      .single();
    
    return { success: true, rol: usuario?.rol || 'socio' };
    
  } catch (error) {
    console.error('Error login:', error);
    return { success: false, error: error.message };
  }
}

// Cerrar sesión
async function logout() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Obtener préstamos pendientes
async function obtenerPrestamosPendientes() {
  try {
    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        *,
        socios (nombre_completo, cedula)
      `)
      .eq('estado', 'Pendiente')
      .order('fecha_solicitud', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Aprobar préstamo
async function aprobarPrestamo(id) {
  try {
    const { error } = await supabase
      .from('prestamos')
      .update({ 
        estado: 'Aprobado',
        fecha_aprobacion: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Rechazar préstamo
async function rechazarPrestamo(id, motivo) {
  try {
    const { error } = await supabase
      .from('prestamos')
      .update({ 
        estado: 'Rechazado',
        observaciones: motivo
      })
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}

// Inicializar cuando cargue el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabase);
} else {
  initSupabase();
}
