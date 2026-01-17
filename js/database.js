// ============================================
// DATABASE.JS - Operaciones de Base de Datos
// ============================================

const Database = {
  
  /**
   * Obtener cliente de Supabase
   */
  getClient() {
    return supabaseClient.obtenerCliente();
  },
  
  // ==========================================
  // SOCIOS
  // ==========================================
  
  /**
   * Buscar socio por cédula
   */
  async buscarSocioPorCedula(cedula) {
    try {
      const { data, error } = await this.getClient()
        .from('socios')
        .select('*')
        .eq('cedula', cedula)
        .limit(1);
      
      if (error) throw error;
      
      return {
        success: true,
        existe: data && data.length > 0,
        socio: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      Utils.log(`Error al buscar socio: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Crear nuevo socio
   */
  async crearSocio(nombre, cedula) {
    try {
      const { data, error } = await this.getClient()
        .from('socios')
        .insert([{
          nombre_completo: nombre,
          cedula: cedula,
          capital_acumulado: 0,
          activo: true
        }])
        .select();
      
      if (error) throw error;
      
      Utils.log('Socio creado exitosamente', 'success');
      return { success: true, socio: data[0] };
    } catch (error) {
      Utils.log(`Error al crear socio: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Buscar o crear socio
   */
  async buscarOCrearSocio(nombre, cedula) {
    try {
      // Buscar si existe
      const resultadoBusqueda = await this.buscarSocioPorCedula(cedula);
      
      if (!resultadoBusqueda.success) {
        throw new Error(resultadoBusqueda.error);
      }
      
      if (resultadoBusqueda.existe) {
        return { success: true, socio: resultadoBusqueda.socio };
      }
      
      // Si no existe, crear
      return await this.crearSocio(nombre, cedula);
      
    } catch (error) {
      Utils.log(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // PRÉSTAMOS
  // ==========================================
  
  /**
   * Crear simulación de préstamo
   */
  async crearSimulacionPrestamo(datos) {
    try {
      const { data, error } = await this.getClient()
        .from('prestamos')
        .insert([{
          socio_id: datos.socioId,
          monto: parseFloat(datos.monto),
          plazo_meses: parseInt(datos.plazo),
          tasa_anual: APP_CONFIG.prestamos.tasaAnual,
          tasa_mensual: APP_CONFIG.prestamos.tasaMensual,
          cuota_mensual: parseFloat(datos.cuotaMensual),
          total_intereses: parseFloat(datos.totalIntereses),
          total_pagar: parseFloat(datos.totalPagar),
          fecha_primera_cuota: datos.tabla[0].fechaPago.toISOString().split('T')[0],
          estado: 'Simulado',
          cuotas_minimas_precancelar: Math.ceil(datos.plazo * APP_CONFIG.prestamos.porcentajePrecancelacion)
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Guardar tabla de amortización
      await this.guardarTablaAmortizacion(data.id, datos.tabla);
      
      Utils.log('Simulación de préstamo creada', 'success');
      return { success: true, prestamo: data };
      
    } catch (error) {
      Utils.log(`Error al crear simulación: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Guardar tabla de amortización
   */
  async guardarTablaAmortizacion(prestamoId, tabla) {
    try {
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
      
      const { data, error } = await this.getClient()
        .from('amortizacion')
        .insert(filas)
        .select();
      
      if (error) throw error;
      
      Utils.log(`${data.length} cuotas guardadas`, 'success');
      return { success: true, cuotas: data };
      
    } catch (error) {
      Utils.log(`Error al guardar amortización: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Enviar préstamo a aprobación
   */
  async enviarPrestamoAprobacion(prestamoId) {
    try {
      const { data, error } = await this.getClient()
        .from('prestamos')
        .update({
          estado: 'Pendiente',
          fecha_solicitud: new Date().toISOString()
        })
        .eq('id', prestamoId)
        .select();
      
      if (error) throw error;
      
      Utils.log('Préstamo enviado a aprobación', 'success');
      return { success: true, prestamo: data[0] };
      
    } catch (error) {
      Utils.log(`Error al enviar a aprobación: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Obtener préstamos pendientes
   */
  async obtenerPrestamosPendientes() {
    try {
      const { data, error } = await this.getClient()
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
      
      return { success: true, prestamos: data };
      
    } catch (error) {
      Utils.log(`Error al obtener préstamos: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  
  /**
   * Login
   */
  async login(email, password) {
    try {
      const { data, error } = await this.getClient().auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      Utils.log('Login exitoso', 'success');
      return { success: true, usuario: data.user };
      
    } catch (error) {
      Utils.log(`Error de login: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Registro
   */
  async registro(nombre, email, password) {
    try {
      // Registrar en Auth
      const { data: authData, error: authError } = await this.getClient().auth.signUp({
        email: email,
        password: password,
        options: {
          data: { nombre: nombre }
        }
      });
      
      if (authError) throw authError;
      
      // Crear en tabla usuarios
      const { error: userError } = await this.getClient()
        .from('usuarios')
        .insert([{
          email: email,
          nombre: nombre,
          rol: 'socio',
          activo: true
        }]);
      
      if (userError) console.warn('Error al crear usuario en tabla:', userError);
      
      Utils.log('Registro exitoso', 'success');
      return { success: true, usuario: authData.user };
      
    } catch (error) {
      Utils.log(`Error de registro: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      const { error } = await this.getClient().auth.signOut();
      if (error) throw error;
      
      Utils.log('Sesión cerrada', 'success');
      return { success: true };
      
    } catch (error) {
      Utils.log(`Error al cerrar sesión: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Obtener sesión actual
   */
  async obtenerSesion() {
    try {
      const { data: { session } } = await this.getClient().auth.getSession();
      return { success: true, session };
    } catch (error) {
      Utils.log(`Error al obtener sesión: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Obtener datos de usuario por email
   */
  async obtenerUsuarioPorEmail(email) {
    try {
      const { data, error } = await this.getClient()
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      
      return { success: true, usuario: data };
      
    } catch (error) {
      Utils.log(`Error al obtener usuario: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
};

// Exportar globalmente
window.Database = Database;
