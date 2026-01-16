// ============================================
// SIMULADOR.JS - CON MODAL DE IDENTIFICACIÓN
// ============================================

const CONFIG = {
    TASA_ANUAL: 0.10,
    TASA_MENSUAL: 0.10 / 12,
    MONTO_MAXIMO: 4000,
    PLAZO_MAXIMO: 36,
    DIAS_PRIMERA_CUOTA: 45,
    PORCENTAJE_PRECANCELACION: 0.25
};

let simulacionActual = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('simuladorForm').addEventListener('submit', simularPrestamo);
    document.getElementById('btnEnviar').addEventListener('click', abrirModalSocio);
    document.getElementById('btnConfirmarSocio').addEventListener('click', enviarAprobacion);
    document.getElementById('btnCancelarModal').addEventListener('click', cerrarModalSocio);
    
    // Validaciones en tiempo real
    document.getElementById('monto').addEventListener('input', validarMonto);
    document.getElementById('plazo').addEventListener('input', validarPlazo);
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('modalSocio').addEventListener('click', (e) => {
        if (e.target.id === 'modalSocio') {
            cerrarModalSocio();
        }
    });
}

// ============================================
// VALIDACIONES
// ============================================

function validarMonto(e) {
    let valor = parseFloat(e.target.value);
    
    if (valor > CONFIG.MONTO_MAXIMO) {
        e.target.value = CONFIG.MONTO_MAXIMO;
        mostrarAlerta(`⚠️ El monto máximo es $${CONFIG.MONTO_MAXIMO}`, 'warning');
    } else if (valor < 0) {
        e.target.value = 100;
    } else {
        ocultarAlerta();
    }
}

function validarPlazo(e) {
    let valor = parseInt(e.target.value);
    
    if (valor > CONFIG.PLAZO_MAXIMO) {
        e.target.value = CONFIG.PLAZO_MAXIMO;
        mostrarAlerta(`⚠️ El plazo máximo es ${CONFIG.PLAZO_MAXIMO} meses`, 'warning');
    } else if (valor < 0) {
        e.target.value = 1;
    } else {
        ocultarAlerta();
    }
}

function validarCedula(cedula) {
    // Validación básica de cédula ecuatoriana
    if (!/^\d{10}$/.test(cedula)) {
        return false;
    }
    
    const digitos = cedula.split('').map(Number);
    const provincia = parseInt(cedula.substring(0, 2));
    
    if (provincia < 1 || provincia > 24) {
        return false;
    }
    
    // Algoritmo de validación de cédula
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
        let valor = digitos[i] * coeficientes[i];
        if (valor >= 10) valor -= 9;
        suma += valor;
    }
    
    const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    
    return digitoVerificador === digitos[9];
}

// ============================================
// SIMULACIÓN
// ============================================

function simularPrestamo(e) {
    e.preventDefault();
    
    const monto = parseFloat(document.getElementById('monto').value);
    const plazo = parseInt(document.getElementById('plazo').value);
    
    // Validaciones
    if (monto < 100 || monto > CONFIG.MONTO_MAXIMO) {
        mostrarAlerta(`❌ El monto debe estar entre $100 y $${CONFIG.MONTO_MAXIMO}`, 'error');
        return;
    }
    
    if (plazo < 1 || plazo > CONFIG.PLAZO_MAXIMO) {
        mostrarAlerta(`❌ El plazo debe estar entre 1 y ${CONFIG.PLAZO_MAXIMO} meses`, 'error');
        return;
    }
    
    // Generar tabla
    const tabla = generarTablaAmortizacion(monto, plazo);
    
    simulacionActual = {
        monto,
        plazo,
        tabla,
        cuotaMensual: tabla[0].cuota,
        totalPagar: tabla[0].cuota * plazo,
        totalIntereses: (tabla[0].cuota * plazo) - monto,
        fechaSolicitud: new Date()
    };
    
    mostrarResultados();
    ocultarAlerta();
}

// ============================================
// GENERAR TABLA DE AMORTIZACIÓN
// ============================================

function generarTablaAmortizacion(monto, plazo) {
    const tasaMensual = CONFIG.TASA_MENSUAL;
    const cuotaMensual = calcularCuotaMensual(monto, tasaMensual, plazo);
    
    const tabla = [];
    let saldoInicial = monto;
    const fechaHoy = new Date();
    
    for (let i = 1; i <= plazo; i++) {
        const interes = saldoInicial * tasaMensual;
        const capital = cuotaMensual - interes;
        const saldoFinal = Math.max(0, saldoInicial - capital);
        
        let fechaPago;
        if (i === 1) {
            fechaPago = new Date(fechaHoy);
            fechaPago.setDate(fechaPago.getDate() + CONFIG.DIAS_PRIMERA_CUOTA);
        } else {
            fechaPago = new Date(fechaHoy);
            fechaPago.setDate(fechaPago.getDate() + CONFIG.DIAS_PRIMERA_CUOTA);
            fechaPago.setMonth(fechaPago.getMonth() + (i - 1));
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
}

function calcularCuotaMensual(monto, tasa, plazo) {
    return monto * (tasa * Math.pow(1 + tasa, plazo)) / (Math.pow(1 + tasa, plazo) - 1);
}

// ============================================
// MOSTRAR RESULTADOS
// ============================================

function mostrarResultados() {
    const { monto, plazo, cuotaMensual, totalPagar, totalIntereses, tabla } = simulacionActual;
    
    // Actualizar resumen
    document.getElementById('resumenMonto').textContent = `$${monto.toLocaleString('es-EC', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resumenPlazo').textContent = `${plazo} ${plazo === 1 ? 'mes' : 'meses'}`;
    document.getElementById('resumenCuota').textContent = `$${cuotaMensual.toFixed(2)}`;
    document.getElementById('resumenTotal').textContent = `$${totalPagar.toFixed(2)}`;
    document.getElementById('resumenIntereses').textContent = `$${totalIntereses.toFixed(2)}`;
    document.getElementById('resumenPrimeraCuota').textContent = formatearFecha(tabla[0].fechaPago);
    
    // Info precancelación
    const cuotasMinimas = Math.ceil(plazo * CONFIG.PORCENTAJE_PRECANCELACION);
    document.getElementById('cuotasMinimas').textContent = cuotasMinimas;
    document.getElementById('precancelacionInfo').classList.add('show');
    
    // Generar tabla
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    tabla.forEach((fila, index) => {
        const tr = document.createElement('tr');
        if (index === cuotasMinimas - 1) {
            tr.classList.add('highlight');
            tr.title = '⭐ Después de esta cuota podrás precancelar';
        }
        
        tr.innerHTML = `
            <td>${fila.numero}</td>
            <td>${formatearFecha(fila.fechaPago)}</td>
            <td>$${fila.saldoInicial.toFixed(2)}</td>
            <td>$${fila.cuota.toFixed(2)}</td>
            <td>$${fila.interes.toFixed(2)}</td>
            <td>$${fila.capital.toFixed(2)}</td>
            <td>$${fila.saldoFinal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('resultados').style.display = 'block';
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// MODAL DE SOCIO
// ============================================

function abrirModalSocio() {
    if (!simulacionActual) {
        mostrarAlerta('No hay simulación activa', 'error');
        return;
    }
    
    // Limpiar campos
    document.getElementById('nombreSocio').value = '';
    document.getElementById('cedulaSocio').value = '';
    
    // Mostrar modal
    document.getElementById('modalSocio').classList.add('show');
}

function cerrarModalSocio() {
    document.getElementById('modalSocio').classList.remove('show');
}

// ============================================
// ENVIAR A APROBACIÓN
// ============================================

async function enviarAprobacion() {
    const nombreSocio = document.getElementById('nombreSocio').value.trim();
    const cedulaSocio = document.getElementById('cedulaSocio').value.trim();
    
    // Validaciones
    if (!nombreSocio) {
        alert('❌ Debes ingresar tu nombre completo');
        return;
    }
    
    if (nombreSocio.length < 5) {
        alert('❌ El nombre debe tener al menos 5 caracteres');
        return;
    }
    
    if (!cedulaSocio) {
        alert('❌ Debes ingresar tu cédula');
        return;
    }
    
    if (!validarCedula(cedulaSocio)) {
        alert('❌ La cédula ingresada no es válida');
        return;
    }
    
    const confirmacion = confirm(
        `¿Confirmar envío de solicitud?\n\n` +
        `👤 Nombre: ${nombreSocio}\n` +
        `🆔 Cédula: ${cedulaSocio}\n` +
        `💵 Monto: $${simulacionActual.monto.toLocaleString()}\n` +
        `📅 Plazo: ${simulacionActual.plazo} meses\n` +
        `💰 Cuota: $${simulacionActual.cuotaMensual.toFixed(2)}\n` +
        `📈 Tasa: 10% anual`
    );
    
    if (!confirmacion) return;
    
    cerrarModalSocio();
    mostrarCargando(true);
    
    try {
        // Buscar o crear socio
        const socioResult = await buscarOCrearSocio(nombreSocio, cedulaSocio);
        
        if (!socioResult.success) {
            throw new Error(socioResult.error);
        }
        
        const socioId = socioResult.socioId;
        
        // Agregar datos del socio a la simulación
        simulacionActual.socioId = socioId;
        simulacionActual.socioNombre = nombreSocio;
        
        // Crear simulación
        const resultadoSimulacion = await db.crearSimulacionPrestamo(simulacionActual);
        
        if (!resultadoSimulacion.success) {
            throw new Error(resultadoSimulacion.error);
        }
        
        const prestamoId = resultadoSimulacion.data.id;
        
        // Enviar a aprobación
        const resultadoAprobacion = await db.enviarPrestamoAprobacion(prestamoId);
        
        if (!resultadoAprobacion.success) {
            throw new Error(resultadoAprobacion.error);
        }
        
        alert(
            '✅ Solicitud enviada correctamente\n\n' +
            `📋 Número de solicitud: #${prestamoId}\n` +
            `👤 Solicitante: ${nombreSocio}\n` +
            `🆔 Cédula: ${cedulaSocio}\n\n` +
            'El administrador revisará tu solicitud.'
        );
        
        location.reload();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al enviar la solicitud:\n' + error.message);
    } finally {
        mostrarCargando(false);
    }
}

async function buscarOCrearSocio(nombre, cedula) {
    try {
        // Buscar si existe el socio por cédula
        const { data: socios, error: errorBuscar } = await db.supabase
            .from('socios')
            .select('id')
            .eq('cedula', cedula)
            .limit(1);
        
        if (errorBuscar) throw errorBuscar;
        
        if (socios && socios.length > 0) {
            // Socio existe
            return { success: true, socioId: socios[0].id };
        } else {
            // Crear nuevo socio
            const resultado = await db.crearSocio({
                nombre: nombre,
                cedula: cedula,
                telefono: null,
                email: null
            });
            
            if (resultado.success) {
                return { success: true, socioId: resultado.data[0].id };
            } else {
                throw new Error(resultado.error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// UTILIDADES
// ============================================

function formatearFecha(fecha) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();
    return `${dia} ${mes} ${anio}`;
}

function mostrarAlerta(mensaje, tipo = 'error') {
    const alert = document.getElementById('alert');
    alert.textContent = mensaje;
    alert.className = `alert ${tipo} show`;
    
    setTimeout(() => {
        ocultarAlerta();
    }, 5000);
}

function ocultarAlerta() {
    const alert = document.getElementById('alert');
    alert.classList.remove('show');
}

function mostrarCargando(mostrar) {
    const spinner = document.getElementById('loadingSpinner');
    if (mostrar) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}
