// ============================================
// SUPABASE.JS - Configuración y Conexión
// Sistema Grupo JDA
// ============================================

// PASO 1: Incluir el SDK de Supabase en tu HTML
// Agregar antes de cerrar </body>:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

// TODO: Reemplazar con tus credenciales de Supabase
const SUPABASE_URL = 'https://aoogaytjhsgonzctprhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb2dheXRqaHNnb256Y3Rwcmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTA1NjgsImV4cCI6MjA4NDA4NjU2OH0.NYTQJKEkjHVazLOyEVop84jh1pchoq_vwfZkyxbY6Fo';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// CLASE PRINCIPAL DE BASE DE DATOS
// ============================================

class DatabaseService {
  
  // ==========================================
  // SOCIOS
  // ==========================================
  
  /**
   * Obtener todos los socios activos
   */
  async obtenerSocios() {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('activo', true)
        .order('nombre_completo', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener socios:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener un socio por ID
   */
  async obtenerSocioPorId(id) {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener socio:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Crear nuevo socio
   */
  async crearSocio(socioData) {
    try {
      const { data, error } = await supabase
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
      console.error('Error al crear socio:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // PRÉSTAMOS
  // ==========================================
  
  /**
   * Crear simulación de préstamo (estado: Simulado)
   */
  async crearSimulacionPrestamo(prestamoData) {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .insert([{
          socio_id: prestamoData.socioId,
          monto: prestamoData.monto,
          plazo_meses: prestamoData.plazo,
          tasa_anual: 0.11,
          tasa_mensual: 0.11 / 12,
          cuota_mensual: prestamoData.cuotaMensual,
          total_intereses: prestamoData.totalIntereses,
          total_pagar: prestamoData.totalPagar,
          fecha_primera_cuota: prestamoData.tabla[0].fechaPago,
          estado: 'Simulado',
          observaciones: prestamoData.observaciones,
          cuotas_minimas_precancelar: Math.ceil(prestamoData.plazo * 0.25)
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Guardar tabla de amortización
      if (data) {
        await this.guardarTablaAmortizacion(data.id, prestamoData.tabla);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear simulación:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Enviar préstamo a aprobación (cambiar estado de Simulado a Pendiente)
   */
  async enviarPrestamoAprobacion(prestamoId) {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .update({ 
          estado: 'Pendiente',
          fecha_solicitud: new Date().toISOString()
        })
        .eq('id', prestamoId)
        .eq('estado', 'Simulado')
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al enviar a aprobación:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener préstamos pendientes de aprobación
   */
  async obtenerPrestamosPendientes() {
    try {
      const { data, error } = await supabase
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
      console.error('Error al obtener préstamos pendientes:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Aprobar préstamo (ADMIN)
   */
  async aprobarPrestamo(prestamoId, aprobadoPor) {
    try {
      const { data, error } = await supabase
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
      console.error('Error al aprobar préstamo:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Rechazar préstamo (ADMIN)
   */
  async rechazarPrestamo(prestamoId, motivo) {
    try {
      const { data, error } = await supabase
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
      console.error('Error al rechazar préstamo:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener préstamos activos de un socio
   */
  async obtenerPrestamosActivosSocio(socioId) {
    try {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('socio_id', socioId)
        .in('estado', ['Aprobado', 'Activo'])
        .order('fecha_solicitud', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener préstamos activos:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // TABLA DE AMORTIZACIÓN
  // ==========================================
  
  /**
   * Guardar tabla de amortización completa
   */
  async guardarTablaAmortizacion(prestamoId, tabla) {
    try {
      const filas = tabla.map(fila => ({
        prestamo_id: prestamoId,
        numero_cuota: fila.numero,
        fecha_pago: fila.fechaPago.toISOString().split('T')[0],
        saldo_inicial: fila.saldoInicial,
        cuota: fila.cuota,
        interes: fila.interes,
        capital: fila.capital,
        saldo_final: fila.saldoFinal,
        pagada: false
      }));
      
      const { data, error } = await supabase
        .from('amortizacion')
        .insert(filas)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al guardar tabla de amortización:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener tabla de amortización de un préstamo
   */
  async obtenerTablaAmortizacion(prestamoId) {
    try {
      const { data, error } = await supabase
        .from('amortizacion')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .order('numero_cuota', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener tabla de amortización:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // DESEMBOLSOS
  // ==========================================
  
  /**
   * Registrar desembolso y activar préstamo
   */
  async registrarDesembolso(desembolsoData) {
    try {
      // 1. Registrar desembolso
      const { data: desembolso, error: errorDesembolso } = await supabase
        .from('desembolsos')
        .insert([{
          prestamo_id: desembolsoData.prestamoId,
          socio_id: desembolsoData.socioId,
          fecha: desembolsoData.fecha || new Date().toISOString().split('T')[0],
          monto: desembolsoData.monto,
          metodo: desembolsoData.metodo,
          observaciones: desembolsoData.observaciones,
          registrado_por: desembolsoData.registradoPor
        }])
        .select();
      
      if (errorDesembolso) throw errorDesembolso;
      
      // 2. Actualizar estado del préstamo a 'Activo'
      const { data: prestamo, error: errorPrestamo } = await supabase
        .from('prestamos')
        .update({ 
          estado: 'Activo',
          fecha_desembolso: desembolsoData.fecha || new Date().toISOString()
        })
        .eq('id', desembolsoData.prestamoId)
        .select();
      
      if (errorPrestamo) throw errorPrestamo;
      
      return { success: true, data: { desembolso, prestamo } };
    } catch (error) {
      console.error('Error al registrar desembolso:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // PAGOS DE CUOTAS
  // ==========================================
  
  /**
   * Registrar pago de una cuota
   */
  async registrarPagoCuota(pagoData) {
    try {
      // 1. Obtener datos de la cuota
      const { data: cuota, error: errorCuota } = await supabase
        .from('amortizacion')
        .select('*')
        .eq('prestamo_id', pagoData.prestamoId)
        .eq('numero_cuota', pagoData.numeroCuota)
        .single();
      
      if (errorCuota) throw errorCuota;
      
      // 2. Calcular mora si existe
      const fechaPago = new Date(pagoData.fechaPago);
      const fechaProgramada = new Date(cuota.fecha_pago);
      const diasMora = Math.max(0, Math.floor((fechaPago - fechaProgramada) / (1000 * 60 * 60 * 24)));
      const montoMora = diasMora > 0 ? diasMora * 0.5 : 0; // $0.50 por día de mora (ejemplo)
      
      // 3. Registrar pago
      const { data: pago, error: errorPago } = await supabase
        .from('pagos_cuotas')
        .insert([{
          prestamo_id: pagoData.prestamoId,
          amortizacion_id: cuota.id,
          socio_id: pagoData.socioId,
          fecha_pago: pagoData.fechaPago,
          numero_cuota: pagoData.numeroCuota,
          monto_pagado: pagoData.montoPagado,
          interes_pagado: cuota.interes,
          capital_pagado: cuota.capital,
          mora_dias: diasMora,
          mora_monto: montoMora,
          estado: diasMora > 0 ? 'Con mora' : 'A tiempo',
          observaciones: pagoData.observaciones,
          registrado_por: pagoData.registradoPor
        }])
        .select();
      
      if (errorPago) throw errorPago;
      
      // 4. Marcar cuota como pagada
      const { error: errorUpdate } = await supabase
        .from('amortizacion')
        .update({ 
          pagada: true,
          fecha_pago_real: pagoData.fechaPago,
          monto_pagado: pagoData.montoPagado,
          dias_mora: diasMora
        })
        .eq('id', cuota.id);
      
      if (errorUpdate) throw errorUpdate;
      
      // 5. Verificar si el préstamo se completó
      await this.verificarPrestamoCompletado(pagoData.prestamoId);
      
      return { success: true, data: pago };
    } catch (error) {
      console.error('Error al registrar pago:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Verificar si todas las cuotas están pagadas y finalizar préstamo
   */
  async verificarPrestamoCompletado(prestamoId) {
    try {
      // Contar cuotas pendientes
      const { count, error } = await supabase
        .from('amortizacion')
        .select('*', { count: 'exact', head: true })
        .eq('prestamo_id', prestamoId)
        .eq('pagada', false);
      
      if (error) throw error;
      
      // Si no hay cuotas pendientes, finalizar préstamo
      if (count === 0) {
        await supabase
          .from('prestamos')
          .update({ estado: 'Finalizado' })
          .eq('id', prestamoId);
      }
      
      return { success: true, completado: count === 0 };
    } catch (error) {
      console.error('Error al verificar préstamo:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener cuotas pendientes de un préstamo
   */
  async obtenerCuotasPendientes(prestamoId) {
    try {
      const { data, error } = await supabase
        .from('amortizacion')
        .select('*')
        .eq('prestamo_id', prestamoId)
        .eq('pagada', false)
        .order('numero_cuota', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener cuotas pendientes:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // PRECANCELACIÓN
  // ==========================================
  
  /**
   * Verificar si un préstamo puede ser precancelado
   */
  async verificarPrecancelacion(prestamoId) {
    try {
      // Obtener datos del préstamo
      const { data: prestamo, error: errorPrestamo } = await supabase
        .from('prestamos')
        .select('*, permite_precancelacion, cuotas_minimas_precancelar')
        .eq('id', prestamoId)
        .single();
      
      if (errorPrestamo) throw errorPrestamo;
      
      // Contar cuotas pagadas
      const { count, error: errorCount } = await supabase
        .from('amortizacion')
        .select('*', { count: 'exact', head: true })
        .eq('prestamo_id', prestamoId)
        .eq('pagada', true);
      
      if (errorCount) throw errorCount;
      
      const puedePreCancelar = count >= prestamo.cuotas_minimas_precancelar;
      
      return { 
        success: true, 
        puedePreCancelar,
        cuotasPagadas: count,
        cuotasMinimas: prestamo.cuotas_minimas_precancelar
      };
    } catch (error) {
      console.error('Error al verificar precancelación:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Procesar precancelación
   */
  async procesarPrecancelacion(precancelacionData) {
    try {
      // 1. Verificar que puede precancelar
      const verificacion = await this.verificarPrecancelacion(precancelacionData.prestamoId);
      if (!verificacion.puedePreCancelar) {
        throw new Error('El préstamo aún no cumple el mínimo de cuotas para precancelar');
      }
      
      // 2. Calcular saldo pendiente (solo capital, sin intereses futuros)
      const { data: cuotasPendientes } = await this.obtenerCuotasPendientes(precancelacionData.prestamoId);
      const saldoPendiente = cuotasPendientes.reduce((sum, c) => sum + c.capital, 0);
      const descuento = cuotasPendientes.reduce((sum, c) => sum + c.interes, 0);
      
      // 3. Registrar precancelación
      const { data: precancelacion, error: errorPre } = await supabase
        .from('precancelaciones')
        .insert([{
          prestamo_id: precancelacionData.prestamoId,
          socio_id: precancelacionData.socioId,
          fecha_precancelacion: precancelacionData.fecha || new Date().toISOString().split('T')[0],
          cuotas_pagadas: verificacion.cuotasPagadas,
          saldo_pendiente: saldoPendiente,
          descuento_aplicado: descuento,
          total_pagado: saldoPendiente,
          observaciones: precancelacionData.observaciones,
          aprobado_por: precancelacionData.aprobadoPor
        }])
        .select();
      
      if (errorPre) throw errorPre;
      
      // 4. Marcar todas las cuotas pendientes como pagadas
      const { error: errorUpdate } = await supabase
        .from('amortizacion')
        .update({ 
          pagada: true,
          fecha_pago_real: precancelacionData.fecha || new Date().toISOString().split('T')[0],
          monto_pagado: 0 // Se paga el saldo completo
        })
        .eq('prestamo_id', precancelacionData.prestamoId)
        .eq('pagada', false);
      
      if (errorUpdate) throw errorUpdate;
      
      // 5. Actualizar estado del préstamo
      const { error: errorPrestamo } = await supabase
        .from('prestamos')
        .update({ estado: 'Precancelado' })
        .eq('id', precancelacionData.prestamoId);
      
      if (errorPrestamo) throw errorPrestamo;
      
      return { 
        success: true, 
        data: precancelacion,
        saldoPagado: saldoPendiente,
        descuentoAplicado: descuento
      };
    } catch (error) {
      console.error('Error al procesar precancelación:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // APORTES SEMANALES
  // ==========================================
  
  /**
   * Registrar aportes semanales de todos los socios
   */
  async registrarAporteSemanal(semanaNumero, registradoPor) {
    try {
      // Obtener todos los socios activos
      const { data: socios } = await this.obtenerSocios();
      
      const aportes = socios.map(socio => ({
        socio_id: socio.id,
        fecha: new Date().toISOString().split('T')[0],
        semana_numero: semanaNumero,
        aporte_capital: 3.00,
        aporte_ahorro: 2.00,
        registrado_por: registradoPor
      }));
      
      const { data, error } = await supabase
        .from('aportes_semanales')
        .insert(aportes)
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar aportes:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Registrar aporte individual
   */
  async registrarAporteIndividual(aporteData) {
    try {
      const { data, error } = await supabase
        .from('aportes_semanales')
        .insert([{
          socio_id: aporteData.socioId,
          fecha: aporteData.fecha || new Date().toISOString().split('T')[0],
          semana_numero: aporteData.semanaNumero,
          aporte_capital: aporteData.aporteCapital || 3.00,
          aporte_ahorro: aporteData.aporteAhorro || 2.00,
          observaciones: aporteData.observaciones,
          registrado_por: aporteData.registradoPor
        }])
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar aporte:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // MULTAS Y RIFAS
  // ==========================================
  
  /**
   * Registrar multa
   */
  async registrarMulta(multaData) {
    try {
      const { data, error } = await supabase
        .from('multas_rifas')
        .insert([{
          socio_id: multaData.socioId,
          fecha: multaData.fecha || new Date().toISOString().split('T')[0],
          tipo: 'Multa',
          concepto: multaData.concepto,
          monto: multaData.monto,
          pagado: false
        }])
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar multa:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Registrar rifa
   */
  async registrarRifa(rifaData) {
    try {
      const { data, error } = await supabase
        .from('multas_rifas')
        .insert([{
          socio_id: rifaData.socioId,
          fecha: rifaData.fecha || new Date().toISOString().split('T')[0],
          tipo: 'Rifa',
          concepto: rifaData.concepto,
          monto: rifaData.monto,
          pagado: true // Las rifas se consideran pagadas al registrarse
        }])
        .select();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar rifa:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==========================================
  // REPORTES Y BALANCES
  // ==========================================
  
  /**
   * Obtener balance general
   */
  async obtenerBalanceGeneral() {
    try {
      const { data, error } = await supabase
        .from('vista_balance_general')
        .select('*')
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener balance:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtener resumen de todos los socios
   */
  async obtenerResumenSocios() {
    try {
      const { data, error } = await supabase
        .from('vista_resumen_socios')
        .select('*')
        .order('nombre_completo', { ascending: true });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Calcular balance trimestral
   */
  async obtenerBalanceTrimestral(trimestre, anio) {
    const mesesInicio = [1, 4, 7, 10];
    const mesInicio = mesesInicio[trimestre - 1];
    const mesFin = mesInicio + 3;
    
    const fechaInicio = `${anio}-${mesInicio.toString().padStart(2, '0')}-01`;
    const fechaFin = `${anio}-${mesFin.toString().padStart(2, '0')}-01`;
    
    try {
      // Total aportes capital
      const { data: aportesCapital } = await supabase
        .from('aportes_semanales')
        .select('aporte_capital')
        .gte('fecha', fechaInicio)
        .lt('fecha', fechaFin);
      
      const totalCapital = aportesCapital?.reduce((sum, a) => sum + parseFloat(a.aporte_capital), 0) || 0;
      
      // Total aportes ahorro
      const { data: aportesAhorro } = await supabase
        .from('aportes_semanales')
        .select('aporte_ahorro')
        .gte('fecha', fechaInicio)
        .lt('fecha', fechaFin);
      
      const totalAhorro = aportesAhorro?.reduce((sum, a) => sum + parseFloat(a.aporte_ahorro), 0) || 0;
      
      // Total intereses
      const { data: intereses } = await supabase
        .from('pagos_cuotas')
        .select('interes_pagado')
        .gte('fecha_pago', fechaInicio)
        .lt('fecha_pago', fechaFin);
      
      const totalIntereses = intereses?.reduce((sum, i) => sum + parseFloat(i.interes_pagado), 0) || 0;
      
      // Multas y rifas
      const { data: multas } = await supabase
        .from('multas_rifas')
        .select('monto')
        .eq('tipo', 'Multa')
        .gte('fecha', fechaInicio)
        .lt('fecha', fechaFin);
      
      const totalMultas = multas?.reduce((sum, m) => sum + parseFloat(m.monto), 0) || 0;
      
      const { data: rifas } = await supabase
        .from('multas_rifas')
        .select('monto')
        .eq('tipo', 'Rifa')
        .gte('fecha', fechaInicio)
        .lt('fecha', fechaFin);
      
      const totalRifas = rifas?.reduce((sum, r) => sum + parseFloat(r.monto), 0) || 0;
      
      const gananciasTotal = totalAhorro + totalIntereses + totalMultas + totalRifas;
      
      return {
        success: true,
        data: {
          trimestre,
          anio,
          totalCapital,
          totalAhorro,
          totalIntereses,
          totalMultas,
          totalRifas,
          gananciasTotal,
          gananciaPorSocio: gananciasTotal / 13
        }
      };
    } catch (error) {
      console.error('Error al calcular balance trimestral:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia única
const db = new DatabaseService();

// Para usar en otros archivos:
// const resultado = await db.obtenerSocios();
// if (resultado.success) {
//   console.log(resultado.data);
// }
