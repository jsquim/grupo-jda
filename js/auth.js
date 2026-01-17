// ============================================
// AUTH.JS - Lógica de Autenticación
// ============================================

const Auth = {
  
  /**
   * Inicializar módulo de autenticación
   */
  init() {
    this.setupEventListeners();
    this.verificarSesionActiva();
  },
  
  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registroForm) {
      registroForm.addEventListener('submit', (e) => this.handleRegistro(e));
    }
  },
  
  /**
   * Verificar si hay sesión activa
   */
  async verificarSesionActiva() {
    const resultado = await Database.obtenerSesion();
    
    if (resultado.success && resultado.session) {
      // Hay sesión, obtener usuario
      const usuarioResult = await Database.obtenerUsuarioPorEmail(resultado.session.user.email);
      
      if (usuarioResult.success) {
        this.redirigirSegunRol(usuarioResult.usuario.rol);
      }
    }
  },
  
  /**
   * Manejar login
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validar
    const validacion = Validations.validarFormularioLogin(email, password);
    if (!validacion.valido) {
      Utils.mostrarAlerta(validacion.mensaje, 'error');
      return;
    }
    
    Utils.mostrarCargando(true);
    
    const resultado = await Database.login(email, password);
    
    if (resultado.success) {
      // Obtener rol
      const usuarioResult = await Database.obtenerUsuarioPorEmail(email);
      
      if (usuarioResult.success) {
        Utils.mostrarAlerta(APP_CONFIG.mensajes.exitoLogin, 'success');
        setTimeout(() => {
          this.redirigirSegunRol(usuarioResult.usuario.rol);
        }, 1000);
      }
    } else {
      let mensaje = 'Error al iniciar sesión';
      
      if (resultado.error.includes('Invalid login credentials')) {
        mensaje = 'Email o contraseña incorrectos';
      } else if (resultado.error.includes('Email not confirmed')) {
        mensaje = 'Debes confirmar tu email primero';
      }
      
      Utils.mostrarAlerta(mensaje, 'error');
    }
    
    Utils.mostrarCargando(false);
  },
  
  /**
   * Manejar registro
   */
  async handleRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Validar
    const validacion = Validations.validarFormularioRegistro(nombre, email, password, passwordConfirm);
    if (!validacion.valido) {
      Utils.mostrarAlerta(validacion.mensaje, 'error');
      return;
    }
    
    Utils.mostrarCargando(true);
    
    const resultado = await Database.registro(nombre, email, password);
    
    if (resultado.success) {
      const mensaje = document.getElementById('successMessage');
      if (mensaje) {
        mensaje.textContent = '✅ ' + APP_CONFIG.mensajes.exitoRegistro + '. Revisa tu email.';
        mensaje.style.display = 'block';
      }
      
      Utils.limpiarFormulario('registroForm');
      
      setTimeout(() => {
        this.cambiarTab('login');
        if (mensaje) mensaje.style.display = 'none';
      }, 3000);
    } else {
      let mensaje = 'Error al registrarse';
      
      if (resultado.error.includes('already registered')) {
        mensaje = 'Este email ya está registrado';
      }
      
      Utils.mostrarAlerta(mensaje, 'error');
    }
    
    Utils.mostrarCargando(false);
  },
  
  /**
   * Cambiar tab
   */
  cambiarTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'login') {
      document.querySelectorAll('.tab')[0].classList.add('active');
      document.getElementById('loginTab').classList.add('active');
    } else {
      document.querySelectorAll('.tab')[1].classList.add('active');
      document.getElementById('registroTab').classList.add('active');
    }
    
    Utils.ocultarAlerta();
  },
  
  /**
   * Redirigir según rol
   */
  redirigirSegunRol(rol) {
    if (rol === 'admin') {
      Utils.redirigir(APP_CONFIG.rutas.admin);
    } else {
      Utils.redirigir(APP_CONFIG.rutas.simulador);
    }
  },
  
  /**
   * Cerrar sesión
   */
  async cerrarSesion() {
    const resultado = await Database.logout();
    
    if (resultado.success) {
      Utils.redirigir(APP_CONFIG.rutas.login);
    }
  }
};

// Hacer función global para cerrar sesión
window.cerrarSesion = () => Auth.cerrarSesion();
window.cambiarTab = (tab) => Auth.cambiarTab(tab);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
  Auth.init();
}
