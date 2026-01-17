// ============================================
// VALIDATIONS.JS - Validaciones del Sistema
// ============================================

const Validations = {
  
  // ==========================================
  // VALIDACIONES DE PRÉSTAMOS
  // ==========================================
  
  /**
   * Validar monto de préstamo
   */
  validarMonto(monto) {
    const { montoMinimo, montoMaximo } = APP_CONFIG.prestamos;
    
    if (isNaN(monto)) {
      return { valido: false, mensaje: 'El monto debe ser un número' };
    }
    
    if (monto < montoMinimo) {
      return { valido: false, mensaje: `El monto mínimo es $${montoMinimo}` };
    }
    
    if (monto > montoMaximo) {
      return { valido: false, mensaje: `El monto máximo es $${montoMaximo}` };
    }
    
    return { valido: true };
  },
  
  /**
   * Validar plazo de préstamo
   */
  validarPlazo(plazo) {
    const { plazoMinimo, plazoMaximo } = APP_CONFIG.prestamos;
    
    if (isNaN(plazo)) {
      return { valido: false, mensaje: 'El plazo debe ser un número' };
    }
    
    if (plazo < plazoMinimo) {
      return { valido: false, mensaje: `El plazo mínimo es ${plazoMinimo} mes` };
    }
    
    if (plazo > plazoMaximo) {
      return { valido: false, mensaje: `El plazo máximo es ${plazoMaximo} meses` };
    }
    
    return { valido: true };
  },
  
  // ==========================================
  // VALIDACIONES DE SOCIO
  // ==========================================
  
  /**
   * Validar nombre completo
   */
  validarNombre(nombre) {
    const minimo = APP_CONFIG.validaciones.nombreMinimo;
    
    if (!nombre || nombre.trim() === '') {
      return { valido: false, mensaje: 'El nombre es requerido' };
    }
    
    if (nombre.length < minimo) {
      return { valido: false, mensaje: `El nombre debe tener al menos ${minimo} caracteres` };
    }
    
    // Validar que tenga al menos dos palabras
    const palabras = nombre.trim().split(' ').filter(p => p.length > 0);
    if (palabras.length < 2) {
      return { valido: false, mensaje: 'Ingresa tu nombre completo (nombre y apellido)' };
    }
    
    return { valido: true };
  },
  
  /**
   * Validar cédula ecuatoriana
   */
  validarCedula(cedula) {
    const longitud = APP_CONFIG.validaciones.cedulaLongitud;
    
    // Verificar que solo contenga números
    if (!/^\d+$/.test(cedula)) {
      return { valido: false, mensaje: 'La cédula debe contener solo números' };
    }
    
    // Verificar longitud
    if (cedula.length !== longitud) {
      return { valido: false, mensaje: `La cédula debe tener ${longitud} dígitos` };
    }
    
    // Validar provincia (primeros 2 dígitos)
    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) {
      return { valido: false, mensaje: 'Código de provincia inválido' };
    }
    
    // Algoritmo de validación de cédula ecuatoriana
    const digitos = cedula.split('').map(Number);
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let valor = digitos[i] * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }
    
    const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    
    if (digitoVerificador !== digitos[9]) {
      return { valido: false, mensaje: 'Cédula inválida (dígito verificador incorrecto)' };
    }
    
    return { valido: true };
  },
  
  // ==========================================
  // VALIDACIONES DE AUTENTICACIÓN
  // ==========================================
  
  /**
   * Validar email
   */
  validarEmail(email) {
    if (!email || email.trim() === '') {
      return { valido: false, mensaje: 'El email es requerido' };
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return { valido: false, mensaje: 'Email inválido' };
    }
    
    return { valido: true };
  },
  
  /**
   * Validar contraseña
   */
  validarPassword(password) {
    const minimo = APP_CONFIG.validaciones.passwordMinimo;
    
    if (!password || password.trim() === '') {
      return { valido: false, mensaje: 'La contraseña es requerida' };
    }
    
    if (password.length < minimo) {
      return { valido: false, mensaje: `La contraseña debe tener al menos ${minimo} caracteres` };
    }
    
    return { valido: true };
  },
  
  /**
   * Validar que las contraseñas coincidan
   */
  validarPasswordsCoinciden(password, passwordConfirm) {
    if (password !== passwordConfirm) {
      return { valido: false, mensaje: 'Las contraseñas no coinciden' };
    }
    
    return { valido: true };
  },
  
  // ==========================================
  // VALIDACIÓN DE FORMULARIO COMPLETO
  // ==========================================
  
  /**
   * Validar formulario de préstamo
   */
  validarFormularioPrestamo(monto, plazo) {
    const validacionMonto = this.validarMonto(monto);
    if (!validacionMonto.valido) return validacionMonto;
    
    const validacionPlazo = this.validarPlazo(plazo);
    if (!validacionPlazo.valido) return validacionPlazo;
    
    return { valido: true };
  },
  
  /**
   * Validar formulario de socio
   */
  validarFormularioSocio(nombre, cedula) {
    const validacionNombre = this.validarNombre(nombre);
    if (!validacionNombre.valido) return validacionNombre;
    
    const validacionCedula = this.validarCedula(cedula);
    if (!validacionCedula.valido) return validacionCedula;
    
    return { valido: true };
  },
  
  /**
   * Validar formulario de registro
   */
  validarFormularioRegistro(nombre, email, password, passwordConfirm) {
    const validacionNombre = this.validarNombre(nombre);
    if (!validacionNombre.valido) return validacionNombre;
    
    const validacionEmail = this.validarEmail(email);
    if (!validacionEmail.valido) return validacionEmail;
    
    const validacionPassword = this.validarPassword(password);
    if (!validacionPassword.valido) return validacionPassword;
    
    const validacionCoinciden = this.validarPasswordsCoinciden(password, passwordConfirm);
    if (!validacionCoinciden.valido) return validacionCoinciden;
    
    return { valido: true };
  },
  
  /**
   * Validar formulario de login
   */
  validarFormularioLogin(email, password) {
    const validacionEmail = this.validarEmail(email);
    if (!validacionEmail.valido) return validacionEmail;
    
    const validacionPassword = this.validarPassword(password);
    if (!validacionPassword.valido) return validacionPassword;
    
    return { valido: true };
  }
};

// Exportar globalmente
window.Validations = Validations;
