// ============================================
// SIMULADOR.JS - ACTUALIZADO CON SUPABASE
// ============================================

const CONFIG = {
    TASA_ANUAL: 0.11,
    TASA_MENSUAL: 0.11 / 12,
    MONTO_MAXIMO: 4000,
    PLAZO_MAXIMO: 36,
    DIAS_PRIMERA_CUOTA: 45,
    PORCENTAJE_PRECANCELACION: 0.25
};

let simulacionActual = null;
let sociosData = [];

// ============================================
// INICIALIZACIÓN CON SUPABASE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarSocios();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('simuladorForm').addEventListener('submit', simularPrestamo);
    document.getElementById('btnEnviar').addEventListener('click', enviarAprobacion);
    
    document.getElementById('monto').addEventListener('input', validarMonto);
    document.getElementById('plazo').addEventListener('input', validarPlazo);
}

// ============================================
// CARGAR SOCIOS DESDE SUPABASE
// ============================================

async function cargarSocios() {
    try {
        mostrarCargando(true);
        
        const resultado = await db.obtenerSocios();
        
        if (resultado.success) {
            sociosData = resultado.data;
            
            const select = document.getElementById('socioSelect');
            select.innerHTML = '<option value="">Seleccionar socio...</option>';
            
            sociosData.forEach(socio => {
                const option = document.createElement('option');
                option.value = socio.id;
                option.textContent = `${socio.nombre_completo} (${socio.cedula})`;
                select.appendChild(option);
            });
        } else {
            mostrarAlerta('Error al cargar socios: ' + resultado.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión con la base de datos', 'error');
    } finally {
        mostrarCargando(false);
    }
}

// ============================================
// VALIDACIONES (sin cambios)
// ============================================

function validarMonto(e) {
    const monto = parseFloat(e.target.value);
    
    if (monto > CONFIG.MONTO_MAXIMO) {
        mostrarAlerta(`El monto máximo permitido es $${CONFIG.MONTO_MAXIMO}`, 'error');
        e.target.value = CONFIG.MONTO_MAXIMO;
    } else {
        ocultarAlerta();
    }
}

function validarPlazo(e) {
    const plazo = parseInt(e.target.value);
    
    if (plazo > CONFIG.PLAZO_MAXIMO) {
        mostrarAlerta(`El plazo máximo permitido es ${CONFIG.PLAZO_MAXIMO} meses`, 'error');
        e.target.value = CONFIG.PLAZO_MAXIMO;
    } else {
        ocultarAlerta();
    }
}

function mostrarAlerta(mensaje, tipo = 'error') {
    const alert = document.getElementById('alert');
    alert.textContent = mensaje;
    alert.className = `alert ${tipo}`;
    alert.style.display = 'block';
}

function ocultarAlerta() {
    document.getElementById('alert').style.display = 'none';
}

// ============================================
// SIMULAR PRÉSTAMO (sin cambios en cálculo)
// ============================================

function simularPrestamo(e) {
    e.preventDefault();
    
    const socioId = parseInt(document.getElementById('socioSelect').value);
    const monto = parseFloat(document.getElementById('monto').value);
    const plazo = parseInt(document.getElementById('plazo').value);
    const observaciones = document.getElementById('observaciones').value;
    
    if (!socioId) {
        mostrarAlerta('Debes seleccionar un socio', 'error');
        return;
    }
    
    if (monto < 100 || monto > CONFIG.MONTO_MAXIMO) {
        mostrarAlerta(`El monto debe estar entre $100 y $${CONFIG.MONTO_MAXIMO}`, 'error');
        return;
    }
    
    if (plazo < 1 || plazo > CONFIG.PLAZO_MAXIMO) {
        mostrarAlerta(`El plazo debe estar entre 1 y ${CONFIG.PLAZO_MAXIMO} meses`, 'error');
        return;
    }
    
    const tabla = generarTablaAmortizacion(monto, plazo);
    const socio = sociosData.find(s => s.id === socioId);
    
    simulacionActual = {
        socioId,
        socioNombre: socio.nombre_completo,
        monto,
        plazo,
        observaciones,
        tabla,
        cuotaMensual: tabla[0].cuota,
        totalPagar: tabla[0].cuota * plazo,
        totalIntereses: (tabla[0].cuota * plazo) - monto,
        fechaSolicitud: new Date()
    };
    
    mostrarResultados();
}

// ============================================
// GENERAR TABLA DE AMORTIZACIÓN (sin cambios)
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
// MOSTRAR RESULTADOS (sin cambios)
// ============================================

function mostrarResultados() {
    const { monto, plazo, cuotaMensual, totalPagar, totalIntereses, tabla } = simulacionActual;
    
    document.getElementById('resumenMonto').textContent = `$${monto.toFixed(2)}`;
    document.getElementById('resumenPlazo').textContent = `${plazo} ${plazo === 1 ? 'mes' : 'meses'}`;
    document.getElementById('resumenCuota').textContent = `$${cuotaMensual.toFixed(2)}`;
    document.getElementById('resumenTotal').textContent = `$${totalPagar.toFixed(2)}`;
    document.getElementById('resumenIntereses').textContent = `$${totalIntereses.toFixed(2)}`;
    document.getElementById('resumenPrimeraCuota').textContent = formatearFecha(tabla[0].fechaPago);
    
    const cuotasMinimas = Math.ceil(plazo * CONFIG.PORCENTAJE_PRECANCELACION);
    document.getElementById('cuotasMinimas').textContent = cuotasMinimas;
    document.getElementById('precancelacionInfo').classList.add('show');
    
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';
    
    tabla.forEach((fila, index) => {
        const tr = document.createElement('tr');
        if (index === cuotasMinimas - 1) {
            tr.classList.add('highlight');
            tr.title = 'Después de esta cuota, podrás precancelar el préstamo';
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
// ENVIAR A APROBACIÓN - USANDO SUPABASE
// ============================================

async function enviarAprobacion() {
    if (!simulacionActual) {
        mostrarAlerta('No hay simulación activa', 'error');
        return;
    }
    
    const confirmacion = confirm(
        `¿Enviar solicitud de préstamo a aprobación?\n\n` +
        `Socio: ${simulacionActual.socioNombre}\n` +
        `Monto: $${simulacionActual.monto}\n` +
        `Plazo: ${simulacionActual.plazo} meses\n` +
        `Cuota: $${simulacionActual.cuotaMensual.toFixed(2)}`
    );
    
    if (!confirmacion) return;
    
    mostrarCargando(true);
    
    try {
        // 1. Crear simulación en la base de datos
        const resultadoSimulacion = await db.crearSimulacionPrestamo(simulacionActual);
        
        if (!resultadoSimulacion.success) {
            throw new Error(resultadoSimulacion.error);
        }
        
        const prestamoId = resultadoSimulacion.data.id;
        
        // 2. Enviar a aprobación (cambiar estado a Pendiente)
        const resultadoAprobacion = await db.enviarPrestamoAprobacion(prestamoId);
        
        if (!resultadoAprobacion.success) {
            throw new Error(resultadoAprobacion.error);
        }
        
        alert(
            '✅ Solicitud enviada correctamente\n\n' +
            `Número de solicitud: #${prestamoId}\n\n` +
            'El administrador revisará tu solicitud y te notificará.'
        );
        
        location.reload();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al enviar la solicitud: ' + error.message, 'error');
    } finally {
        mostrarCargando(false);
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

function mostrarCargando(mostrar) {
    document.getElementById('loadingSpinner').style.display = mostrar ? 'block' : 'none';
}
