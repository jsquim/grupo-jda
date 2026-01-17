// ============================================
// UTILS.JS - Funciones Utilitarias
// ============================================

const Utils = {
  
  // ==========================================
  // FORMATEO
  // ==========================================
  
  /**
   * Formatear fecha a texto legible
   */
  formatearFecha(fecha) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${dia} ${mes} ${anio}`;
  },
  
  /**
   * Formatear número como moneda
   */
  formatearMoneda(valor, decimales = 2) {
    return `$${parseFloat(valor).toFixed(decimales)}`;
  },
  
  /**
   * Formatear número con separadores de miles
   */
  formatearNumero(valor) {
    return parseFloat(valor).toLocaleString('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  
  // ==========================================
  // UI - ALERTAS Y MENSAJES
  // ==========================================
  
  /**
   * Mostrar alerta
   */
  mostrarAlerta(mensaje, tipo = 'error', elementoId = 'alert') {
    const alert = document.getElementById(elementoId);
    if (!alert) return;
    
    alert.textContent = mensaje;
    alert.className = `alert ${tipo} show`;
    
    // Auto ocultar después de 5 segundos
    setTimeout(() => {
      this.ocultarAlerta(elementoId);
    }, 5000);
  },
  
  /**
   * Ocultar alerta
   */
  ocultarAlerta(elementoId = 'alert') {
    const alert = document.getElementById(elementoId);
    if (alert) {
      alert.classList.remove('show');
    }
  },
  
  /**
   * Mostrar/ocultar spinner de carga
   */
  mostrarCargando(mostrar, elementoId = 'loadingSpinner') {
    const spinner = document.getElementById(elementoId);
    if (spinner) {
      if (mostrar) {
        spinner.classList.add('show');
      } else {
        spinner.classList.remove('show');
      }
    }
  },
  
  // ==========================================
  // MODAL
  // ==========================================
  
  /**
   * Mostrar modal
   */
  mostrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
    }
  },
  
  /**
   * Ocultar modal
   */
  ocultarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  // ==========================================
  // NAVEGACIÓN
  // ==========================================
  
  /**
   * Redirigir a otra página
   */
  redirigir(ruta, delay = 0) {
    setTimeout(() => {
      window.location.href = ruta;
    }, delay);
  },
  
  /**
   * Recargar página
   */
  recargar() {
    location.reload();
  },
  
  // ==========================================
  // FORMULARIOS
  // ==========================================
  
  /**
   * Limpiar formulario
   */
  limpiarFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  },
  
  /**
   * Obtener datos de formulario como objeto
   */
  obtenerDatosFormulario(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const datos = {};
    
    for (let [key, value] of formData.entries()) {
      datos[key] = value;
    }
    
    return datos;
  },
  
  // ==========================================
  // VALIDACIONES BÁSICAS
  // ==========================================
  
  /**
   * Validar email
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  
  /**
   * Sanitizar texto
   */
  sanitizar(texto) {
    return texto.trim().replace(/[<>]/g, '');
  },
  
  // ==========================================
  // CÁLCULOS
  // ==========================================
  
  /**
   * Calcular cuota mensual (amortización francesa)
   */
  calcularCuotaMensual(monto, tasaMensual, plazo) {
    return monto * (tasaMensual * Math.pow(1 + tasaMensual, plazo)) / 
                   (Math.pow(1 + tasaMensual, plazo) - 1);
  },
  
  /**
   * Agregar días a una fecha
   */
  agregarDias(fecha, dias) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha;
  },
  
  /**
   * Agregar meses a una fecha
   */
  agregarMeses(fecha, meses) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
    return nuevaFecha;
  },
  
  // ==========================================
  // LOCAL STORAGE
  // ==========================================
  
  /**
   * Guardar en localStorage
   */
  guardarLocal(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      return false;
    }
  },
  
  /**
   * Obtener de localStorage
   */
  obtenerLocal(clave) {
    try {
      const valor = localStorage.getItem(clave);
      return valor ? JSON.parse(valor) : null;
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      return null;
    }
  },
  
  /**
   * Eliminar de localStorage
   */
  eliminarLocal(clave) {
    try {
      localStorage.removeItem(clave);
      return true;
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      return false;
    }
  },
  
  // ==========================================
  // DEBUG
  // ==========================================
  
  /**
   * Log con formato
   */
  log(mensaje, tipo = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    console.log(`${emoji[tipo] || 'ℹ️'} ${mensaje}`);
  }
};

// Exportar globalmente
window.Utils = Utils;
