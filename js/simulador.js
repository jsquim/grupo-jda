// ============================================
// SIMULADOR.JS - Lógica del Simulador de Préstamos
// ============================================

const Simulador = {
  
  simulacionActual: null,
  
  /**
   * Inicializar simulador
   */
  init() {
    this.setupEventListeners();
    this.configurarValidacionesEnVivo();
  },
  
  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    const form = document.getElementById('simuladorForm');
    const btnEnviar = document.getElementById('btnEnviar');
    const btnConfirmar = document.getElementById('btnConfirmarSocio');
    const btnCancelar = document.getElementById('btnCancelarModal');
    
    if (form) {
      form.addEventListener('submit', (e) => this.handleSimular(e));
    }
    
    if (btnEnviar) {
      btnEnviar.addEventListener('click', () => this.abrirModalSocio());
    }
    
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', () => this.handleEnviarAprobacion());
    }
    
    if (btnCancelar) {
      btnCancelar.addEventListener('click', () => Utils.ocultarModal('modalSocio'));
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('modalSocio');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'modalSocio') {
          Utils.ocultarModal('modalSocio');
        }
      });
    }
  },
  
  /**
   * Configurar validaciones en tiempo real
   */
  configurarValidacionesEnVivo() {
    const montoInput = document.getElementById('monto');
    const plazoInput = document.getElementById('plazo');
    
    if (montoInput) {
      montoInput.addEventListener('input', (e) => this.validarMontoEnVivo(e));
    }
    
    if (plazoInput) {
      plazoInput.addEventListener('input', (e) => this.validarPlazoEnVivo(e));
    }
  },
  
  /**
   * Validar monto en tiempo real
   */
  validarMontoEnVivo(e) {
    let valor = parseFloat(e.target.value);
    const { montoMaximo, montoMinimo } = APP_CONFIG.prestamos;
    
    if (valor > montoMaximo) {
      e.target.value = montoMaximo;
      Utils.mostrarAlerta(`⚠️ El monto máximo es $${montoMaximo}`, 'warning');
    } else if (valor < 0) {
      e.target.value = montoMinimo;
    } else {
      Utils.ocultarAlerta();
    }
  },
  
  /**
   * Validar plazo en tiempo real
   */
  validarPlazoEnVivo(e) {
    let valor = parseInt(e.target.value);
    const { plazoMaximo, plazoMinimo } = APP_CONFIG.prestamos;
    
    if (valor > plazoMaximo) {
      e.target.value = plazoMaximo;
      Utils.mostrarAlerta(`⚠️ El plazo máximo es ${plazoMaximo} meses`, 'warning');
    } else if (valor < 0) {
      e.target.value = plazoMinimo;
    } else {
      Utils.ocultarAlerta();
    }
  },
  
  /**
   * Manejar simulación
   */
  handleSimular(e) {
    e.preventDefault();
    
    const monto = parseFloat(document.getElementById('monto').value);
    const plazo = parseInt(document.getElementById('plazo').value);
    
    // Validar datos
    const validacion = Validations.validarFormularioPrestamo(monto, plazo);
    if (!validacion.valido) {
      Utils.mostrarAlerta('❌ ' + validacion.mensaje, 'error');
      return;
    }
    
    // Generar tabla de amortización
    const tabla = this.generarTablaAmortizacion(monto, plazo);
    
    // Guardar simulación
    this.simulacionActual = {
      monto,
      plazo,
      tabla,
      cuotaMensual: tabla[0].cuota,
      totalPagar: tabla[0].cuota * plazo,
      totalIntereses: (tabla[0].cuota * plazo) - monto,
      fechaSolicitud: new Date()
    };
    
    // Mostrar resultados
    this.mostrarResultados();
    Utils.ocultarAlerta();
  },
  
  /**
   * Generar tabla de amortización francesa
   */
  generarTablaAmortizacion(monto, plazo) {
    const { tasaMensual, diasPrimeraCuota } = APP_CONFIG.prestamos;
    const cuotaMensual = Utils.calcularCuotaMensual(monto, tasaMensual, plazo);
    
    const tabla = [];
    let saldoInicial = monto;
    const fechaHoy = new Date();
    
    for (let i = 1; i <= plazo; i++) {
      const interes = saldoInicial * tasaMensual;
      const capital = cuotaMensual - interes;
      const saldoFinal = Math.max(0, saldoInicial - capital);
      
      // Calcular fecha de pago
      let fechaPago;
      if (i === 1) {
        // Primera cuota: 45 días después
        fechaPago = Utils.agregarDias(fechaHoy, diasPrimeraCuota);
      } else {
        // Siguientes cuotas: mensualmente desde la primera
        const fechaBase = Utils.agregarDias(fechaHoy, diasPrimeraCuota);
        fechaPago = Utils.agregarMeses(fechaBase, i - 1);
      }
      
      tabla.push({
        numero: i,
        fechaPago,
        saldoInicial,
        cuota: cuotaMensual,
        interes,
        capital,
        saldoFinal
      });
      
      saldoInicial = saldoFinal;
    }
    
    return tabla;
  },
  
  /**
   * Mostrar resultados de la simulación
   */
  mostrarResultados() {
    const { monto, plazo, cuotaMensual, totalPagar, totalIntereses, tabla } = this.simulacionActual;
    
    // Actualizar resumen
    const elementoMonto = document.getElementById('resumenMonto');
    const elementoPlazo = document.getElementById('resumenPlazo');
    const elementoCuota = document.getElementById('resumenCuota');
    const elementoTotal = document.getElementById('resumenTotal');
    const elementoIntereses = document.getElementById('resumenIntereses');
    const elementoPrimeraCuota = document.getElementById('resumenPrimeraCuota');
    
    if (!elementoMonto || !elementoPlazo || !elementoCuota || !elementoTotal || !elementoIntereses || !elementoPrimeraCuota) {
      console.error('❌ No se encontraron elementos del DOM para mostrar resultados');
      Utils.mostrarAlerta('Error al mostrar resultados. Recarga la página.', 'error');
      return;
    }
    
    elementoMonto.textContent = `${Utils.formatearNumero(monto)}`;
    elementoPlazo.textContent = `${plazo} ${plazo === 1 ? 'mes' : 'meses'}`;
    elementoCuota.textContent = Utils.formatearMoneda(cuotaMensual);
    elementoTotal.textContent = Utils.formatearMoneda(totalPagar);
    elementoIntereses.textContent = Utils.formatearMoneda(totalIntereses);
    elementoPrimeraCuota.textContent = Utils.formatearFecha(tabla[0].fechaPago);
    
    // Info de precancelación
    const cuotasMinimas = Math.ceil(plazo * APP_CONFIG.prestamos.porcentajePrecancelacion);
    const elementoCuotasMinimas = document.getElementById('cuotasMinimas');
    const elementoPrecancelacion = document.getElementById('precancelacionInfo');
    
    if (elementoCuotasMinimas) {
      elementoCuotasMinimas.textContent = cuotasMinimas;
    }
    
    if (elementoPrecancelacion) {
      elementoPrecancelacion.classList.add('show');
    }
    
    // Generar tabla
    this.generarTablaHTML(tabla, cuotasMinimas);
    
    // Mostrar sección de resultados
    const resultados = document.getElementById('resultados');
    if (resultados) {
      resultados.style.display = 'block';
      
      // Scroll suave hacia resultados
      setTimeout(() => {
        resultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      Utils.log('Resultados mostrados correctamente', 'success');
    } else {
      console.error('❌ No se encontró el elemento #resultados');
    }
  },
  
  /**
   * Generar tabla HTML de amortización
   */
  generarTablaHTML(tabla, cuotasMinimas) {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    tabla.forEach((fila, index) => {
      const tr = document.createElement('tr');
      
      // Resaltar cuota de precancelación
      if (index === cuotasMinimas - 1) {
        tr.classList.add('highlight');
        tr.title = '⭐ Después de esta cuota podrás precancelar';
      }
      
      tr.innerHTML = `
        <td>${fila.numero}</td>
        <td>${Utils.formatearFecha(fila.fechaPago)}</td>
        <td>${Utils.formatearMoneda(fila.saldoInicial)}</td>
        <td>${Utils.formatearMoneda(fila.cuota)}</td>
        <td>${Utils.formatearMoneda(fila.interes)}</td>
        <td>${Utils.formatearMoneda(fila.capital)}</td>
        <td>${Utils.formatearMoneda(fila.saldoFinal)}</td>
      `;
      
      tbody.appendChild(tr);
    });
  },
  
  /**
   * Abrir modal para identificación del socio
   */
  abrirModalSocio() {
    if (!this.simulacionActual) {
      Utils.mostrarAlerta('No hay simulación activa', 'error');
      return;
    }
    
    // Limpiar campos
    document.getElementById('nombreSocio').value = '';
    document.getElementById('cedulaSocio').value = '';
    
    // Mostrar modal
    Utils.mostrarModal('modalSocio');
  },
  
  /**
   * Manejar envío a aprobación
   */
  async handleEnviarAprobacion() {
    const nombre = document.getElementById('nombreSocio').value.trim();
    const cedula = document.getElementById('cedulaSocio').value.trim();
    
    // Validar
    const validacion = Validations.validarFormularioSocio(nombre, cedula);
    if (!validacion.valido) {
      alert('❌ ' + validacion.mensaje);
      return;
    }
    
    // Confirmar
    const confirmacion = confirm(
      `¿Confirmar envío de solicitud?\n\n` +
      `👤 Nombre: ${nombre}\n` +
      `🆔 Cédula: ${cedula}\n` +
      `💵 Monto: $${Utils.formatearNumero(this.simulacionActual.monto)}\n` +
      `📅 Plazo: ${this.simulacionActual.plazo} meses\n` +
      `💰 Cuota: ${Utils.formatearMoneda(this.simulacionActual.cuotaMensual)}\n` +
      `📈 Tasa: 10% anual`
    );
    
    if (!confirmacion) return;
    
    // Cerrar modal y mostrar carga
    Utils.ocultarModal('modalSocio');
    Utils.mostrarCargando(true);
    
    try {
      // Buscar o crear socio
      const resultadoSocio = await Database.buscarOCrearSocio(nombre, cedula);
      
      if (!resultadoSocio.success) {
        throw new Error(resultadoSocio.error);
      }
      
      // Agregar datos del socio a la simulación
      this.simulacionActual.socioId = resultadoSocio.socio.id;
      this.simulacionActual.socioNombre = nombre;
      
      // Crear simulación en BD
      const resultadoSimulacion = await Database.crearSimulacionPrestamo(this.simulacionActual);
      
      if (!resultadoSimulacion.success) {
        throw new Error(resultadoSimulacion.error);
      }
      
      const prestamoId = resultadoSimulacion.prestamo.id;
      
      // Enviar a aprobación
      const resultadoAprobacion = await Database.enviarPrestamoAprobacion(prestamoId);
      
      if (!resultadoAprobacion.success) {
        throw new Error(resultadoAprobacion.error);
      }
      
      // Éxito
      alert(
        '✅ ' + APP_CONFIG.mensajes.exitoEnvio + '\n\n' +
        `📋 Número de solicitud: #${prestamoId}\n` +
        `👤 Solicitante: ${nombre}\n` +
        `🆔 Cédula: ${cedula}\n\n` +
        'El administrador revisará tu solicitud.'
      );
      
      // Recargar página
      Utils.recargar();
      
    } catch (error) {
      Utils.log(`Error al enviar solicitud: ${error.message}`, 'error');
      alert('❌ Error al enviar la solicitud:\n' + error.message);
    } finally {
      Utils.mostrarCargando(false);
    }
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Simulador.init());
} else {
  Simulador.init();
}
