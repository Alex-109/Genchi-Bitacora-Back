// importarDesdeExcelCompletoMejorado.js
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Equipo = require('../models/equipo');
const Reparaciones = require('../models/reparaciones');

// 🔧 FUNCIÓN PARA ESTANDARIZAR UNIDADES
function estandarizarUnidad(unidad) {
  if (!unidad) return 'SIN UNIDAD';
  
  const unidadUpper = unidad.toString().toUpperCase().trim();
  
  const correcciones = {
    'DIRECCION REGIONA': 'DIRECCION REGIONAL',
    'DIRECCION REGIONA L': 'DIRECCION REGIONAL', 
    'DR-TELEVIGILANCIA': 'DR-TELEVIGILANCIA',
    'DIRECCIÓN REGIONAL': 'DIRECCION REGIONAL',
    'DIRECCION REGIONAL ': 'DIRECCION REGIONAL',
    'CDPQUILLOTA': 'CDP QUILLOTA',
    'CDP PETORCA': 'CDP PETORCA',
    'CDP CASABLANCA': 'CDP CASABLANCA', 
    'CDP LIMACHE': 'CDP LIMACHE',
    'CDP LIMACHE ': 'CDP LIMACHE',
    'CDP QUILLOTA ': 'CDP QUILLOTA',
    'CCP SAN ANTONIO': 'CCP SAN ANTONIO',
    'CCP SAN ANTONIO ': 'CCP SAN ANTONIO',
    'CCP LOS ANDES': 'CCP LOS ANDES',
    'CCP SAN FELIPE': 'CCP SAN FELIPE',
    'CRS VALPARAISO': 'CRS VALPARAISO',
    'CRS LOS ANDES': 'CRS LOS ANDES', 
    'CRS S.ANTONIO': 'CRS SAN ANTONIO',
    'CRS SAN ANTONIO': 'CRS SAN ANTONIO',
    'CRS QUILPUE': 'CRS QUILPUE',
    'CRS QUILPUE ': 'CRS QUILPUE',
    'CRS QUILLOTA': 'CRS QUILLOTA',
    'CRS QUILLOTA ': 'CRS QUILLOTA',
    'CRS ANTONIO': 'CRS SAN ANTONIO',
    'CRS SANTONIO': 'CRS SAN ANTONIO',
    'CRS LIMACHE ': 'CRS LIMACHE',
    'CET VALPARAISO': 'CET VALPARAISO',
    'CET VALPO': 'CET VALPARAISO',
    'CET VON MOLTKE': 'CET VON MOLTKE',
    'C.P. VALPARAISO': 'CP VALPARAISO',
    'CP VALPARAISO': 'CP VALPARAISO',
    'CP VALPO': 'CP VALPARAISO',
    'CP ISLA DE PASCUA': 'CP ISLA DE PASCUA',
    'CAIS': 'CAIS VALPARAISO',
    'CAISVALPO': 'CAIS VALPARAISO', 
    'CAIS VALPARAISO': 'CAIS VALPARAISO',
    'CAIS LOS ANDES': 'CAIS LOS ANDES',
    'CIPCRC LIMACHE': 'CIP-CRC LIMACHE',
    'CIP-CRC LIMACHE': 'CIP-CRC LIMACHE',
    'CIPCRCLIMACHE': 'CIP-CRC LIMACHE',
    ' CIP CRC LIMACHE': 'CIP-CRC LIMACHE',
    'USEP QUILLOTA': 'USEP QUILLOTA',
    'USEP LOS ANDES': 'USEP LOS ANDES',
    'USEP VALPO': 'USEP VALPARAISO',
    'ANEXO LA LIGUA': 'ANEXO LA LIGUA',
    'LA LIGUA': 'ANEXO LA LIGUA',
    'ISLA PASCUA': 'CP ISLA DE PASCUA',
    'CARCEL ISLADEPASCUA': 'CP ISLA DE PASCUA'
  };

  return correcciones[unidadUpper] || unidadUpper;
}

function parsearFechaExcel(fechaStr) {
  if (!fechaStr) return new Date();
  if (typeof fechaStr === 'number') {
    return new Date((fechaStr - 25569) * 86400 * 1000);
  }
  if (fechaStr.includes('-')) {
    const [year, month, day] = fechaStr.split('-');
    return new Date(year, month - 1, day);
  }
  return new Date(fechaStr);
}

function determinarTipoEquipo(modelo) {
  if (!modelo) return 'pc';
  const modeloLower = modelo.toLowerCase();
  if (modeloLower.includes('notebook') || modeloLower.includes('laptop') || modeloLower.includes('probook') || modeloLower.includes('elitebook')) {
    return 'notebook';
  } else if (modeloLower.includes('impresora') || modeloLower.includes('scanner') || modeloLower.includes('hp1536')) {
    return 'impresora';
  } else if (modeloLower.includes('monitor')) {
    return 'monitor';
  } else if (modeloLower.includes('reloj biométrico')) {
    return 'reloj_biometrico';
  } else if (modeloLower.includes('switch')) {
    return 'switch';
  } else {
    return 'pc';
  }
}

function extraerMarca(modelo) {
  if (!modelo) return 'GENERICO';
  const modeloUpper = modelo.toUpperCase();
  if (modeloUpper.includes('HP')) return 'HP';
  if (modeloUpper.includes('LENOVO')) return 'LENOVO';
  if (modeloUpper.includes('DELL')) return 'DELL';
  if (modeloUpper.includes('ACER')) return 'ACER';
  if (modeloUpper.includes('GENERICO')) return 'GENERICO';
  if (modeloUpper.includes('LANIX')) return 'LANIX';
  if (modeloUpper.includes('SAMSUNG')) return 'SAMSUNG';
  if (modeloUpper.includes('LG')) return 'LG';
  return 'GENERICO';
}

// 🆕 FUNCIÓN MEJORADA PARA LIMPIAR RAM - EVITA "6 GB GB"
function limpiarRAM(ram) {
  if (!ram) return '';
  
  const ramStr = ram.toString().toUpperCase();
  
  // Extraer solo números, evitar duplicados como "6 GB GB"
  const numeros = ramStr.match(/\d+/g);
  if (!numeros || numeros.length === 0) return '';
  
  // Tomar el primer número encontrado (evita problemas con "6 GB DDR3" etc)
  const numero = numeros[0];
  
  // Verificar si ya incluye "GB" para no duplicar
  if (ramStr.includes('GB')) {
    return numero + 'GB';
  }
  
  // Para valores sin GB, asumir que son GB
  return numero + 'GB';
}

// 🆕 FUNCIÓN MEJORADA PARA EXTRAER ALMACENAMIENTO - MÁS AGRESIVA
function extraerAlmacenamientoCompleto(row) {
  // Buscar en TODAS las fuentes posibles
  const disco = (row['DISCO DURO'] || '').toString();
  const observaciones = (row.OBSERVACIONES || '').toString();
  const tipoPC = (row['TIPO PC'] || '').toString();
  
  // Combinar todo el texto para buscar
  const textoCompleto = `${disco} ${observaciones} ${tipoPC}`.toUpperCase();
  
  // Patrones más flexibles para encontrar capacidad
  const patrones = [
    /(\d+)\s*GB\s*SSD/, /(\d+)\s*GB\s*HDD/, /SSD\s*(\d+)\s*GB/, /HDD\s*(\d+)\s*GB/,
    /(\d+)\s*SSD/, /(\d+)\s*HDD/, /DISCO\s*(\d+)\s*GB/, /(\d+)GB/,
    /(\d+)\s*TB/, /(\d+)TB/, /SSD\s*(\d+)/, /HDD\s*(\d+)/
  ];
  
  for (const patron of patrones) {
    const match = textoCompleto.match(patron);
    if (match && match[1]) {
      const capacidad = match[1];
      return capacidad + 'GB';
    }
  }
  
  // Buscar números que parezcan capacidades de disco (120GB+)
  const todosNumeros = textoCompleto.match(/\d+/g) || [];
  for (const numStr of todosNumeros) {
    const numero = parseInt(numStr);
    if (numero >= 120 && numero <= 2000) { // Rango razonable para discos
      return numero + 'GB';
    }
  }
  
  // Si hay mención de SSD/HDD pero sin capacidad, usar valor por defecto
  if (textoCompleto.includes('SSD')) {
    return '500GB';
  }
  if (textoCompleto.includes('HDD')) {
    return '500GB';
  }
  
  return '';
}

// 🆕 FUNCIÓN MEJORADA PARA DETERMINAR TIPO ALMACENAMIENTO
function determinarTipoAlmacenamiento(row) {
  const textoCompleto = `${row['DISCO DURO'] || ''} ${row.OBSERVACIONES || ''} ${row['TIPO PC'] || ''}`.toUpperCase();
  
  if (textoCompleto.includes('SSD') || textoCompleto.includes('SOLID')) {
    return 'SSD';
  }
  if (textoCompleto.includes('HDD') || textoCompleto.includes('DISCO DURO')) {
    return 'HDD';
  }
  
  // Por defecto basado en capacidades comunes
  const almacenamiento = extraerAlmacenamientoCompleto(row);
  return almacenamiento.includes('SSD') ? 'SSD' : 'HDD';
}

// 🆕 FUNCIÓN PARA EXTRAER CPU/PROCESADOR
function extraerCPU(modelo, observaciones) {
  if (!modelo) return '';
  
  const textoBusqueda = (modelo + ' ' + (observaciones || '')).toUpperCase();
  
  if (textoBusqueda.includes('I7')) return 'Intel Core i7';
  if (textoBusqueda.includes('I5')) return 'Intel Core i5';
  if (textoBusqueda.includes('I3')) return 'Intel Core i3';
  if (textoBusqueda.includes('CORE 2 DUO') || textoBusqueda.includes('CORE2DUO')) return 'Intel Core 2 Duo';
  if (textoBusqueda.includes('CORE 2')) return 'Intel Core 2';
  if (textoBusqueda.includes('DUAL CORE')) return 'Intel Dual Core';
  if (textoBusqueda.includes('QUAD CORE') || textoBusqueda.includes('QUADCORE')) return 'Intel Quad Core';
  if (textoBusqueda.includes('CELERON')) return 'Intel Celeron';
  if (textoBusqueda.includes('PENTIUM')) return 'Intel Pentium';
  if (textoBusqueda.includes('AMD')) return 'AMD';
  
  return '';
}

// 🆕 FUNCIÓN PARA LIMPIAR IP
function limpiarIP(ip) {
  if (!ip) return '';
  return ip.toString()
    .replace(/[^\d.]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .trim();
}

// 🆕 FUNCIÓN HASH SIMPLE PARA COMPONENTES
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// 🆕 SISTEMA DE IDENTIFICACIÓN EN CASCADA MEJORADO
function generarClaveUnica(row) {
  const serie = (row.SERIE || '').toString().trim();
  const inventario = (row['n° INVENTARIO'] || '').toString().trim();
  const nombreEquipo = (row['NOMBRE PC'] || '').toString().trim();
  const ip = limpiarIP(row['IP EQUIPO'] || '');
  const motherboard = (row['PLACA MADRE'] || '').toString().trim();
  const unidad = estandarizarUnidad(row.UNIDAD);

  // 🎯 NIVEL 1: Identificadores absolutos
  if (serie && serie !== '' && serie !== 'NO TIENE' && serie !== 'SIN NUMERO' && !serie.includes('???')) {
    return `SERIE_${serie}`;
  }
  
  if (inventario && inventario !== '' && !inventario.includes('biblioredes') && inventario !== 'NO' && inventario !== 'NO INVENTARIADO') {
    return `INV_${inventario}`;
  }
  
  // 🎯 NIVEL 2: Nombre + IP (con verificación de relación)
  if (nombreEquipo && ip) {
    // Verificar si hay relación entre nombre e IP (ej: QUILLOTA56166 ↔ 192.168.56.166)
    const digitosNombre = nombreEquipo.replace(/\D/g, '').slice(-3);
    const digitosIP = ip.split('.').pop();
    
    if (digitosNombre && digitosIP && digitosIP.endsWith(digitosNombre)) {
      return `NOMBRE_IP_REL_${nombreEquipo}_${ip}`;
    }
    return `NOMBRE_IP_${nombreEquipo}_${ip}`;
  }
  
  // 🎯 NIVEL 3: Componentes clave + Unidad
  if (motherboard && motherboard !== '' && motherboard !== 'NO' && unidad) {
    return `MB_${motherboard}_${unidad}`;
  }
  
  // 🎯 NIVEL 4: Combinación final
  if (nombreEquipo && unidad) {
    return `NOMBRE_UNIDAD_${nombreEquipo}_${unidad}`;
  }
  
  // Último recurso: generar hash de componentes
  const componentesHash = [
    row['TIPO PC'] || '',
    row['PLACA MADRE'] || '',
    row['DISCO DURO'] || '',
    row.MEMORIA || '',
    row.UNIDAD || ''
  ].join('|').hashCode();
  
  return `HASH_${componentesHash}`;
}

async function importarVersionMejorada() {
  try {
    console.log('📖 Abriendo BITACORA.xlsx...');
    
    const workbook = XLSX.readFile('BITACORA.xlsx');
    const sheetName = workbook.SheetNames.find(name => 
      name.toLowerCase().includes('bitacora') || name.toLowerCase().includes('general')
    ) || workbook.SheetNames[0];
    
    console.log(`📄 Usando hoja: "${sheetName}"`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // DETECTAR ENCABEZADOS
    const todasLasFilas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });
    
    let filaEncabezados = 0;
    for (let i = 0; i < Math.min(10, todasLasFilas.length); i++) {
      const fila = todasLasFilas[i];
      if (fila && fila[0] && fila[0].toString().toUpperCase().includes('UNIDAD')) {
        filaEncabezados = i;
        break;
      }
    }

    const datosReales = XLSX.utils.sheet_to_json(worksheet, { range: filaEncabezados });
    console.log(`📊 Registros encontrados: ${datosReales.length}`);

    // CONEXIÓN MONGODB
    const MONGODB_URI = 'mongodb+srv://nexmart11:cCFPWEdXtJgvwx62@cluster0.eukmbtr.mongodb.net/GenchiReg?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 🗑️ LIMPIAR BD COMPLETAMENTE
    console.log('🗑️ Limpiando base de datos...');
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    console.log('✅ Base de datos limpiada');

    // ✅ ALGORITMO MEJORADO DE IDENTIFICACIÓN
    const equiposAgrupados = new Map();
    const clavesUsadas = new Set();
    const seriesUsadas = new Set();
    const inventariosUsados = new Set();

    console.log('\n🔍 Procesando registros con identificación en cascada...');
    
    for (const row of datosReales) {
      const claveUnica = generarClaveUnica(row);
      
      if (!claveUnica || clavesUsadas.has(claveUnica)) {
        continue;
      }

      // Registrar identificadores únicos
      const serie = (row.SERIE || '').toString().trim();
      const inventario = (row['n° INVENTARIO'] || '').toString().trim();
      
      if (serie && serie !== '' && serie !== 'NO TIENE' && serie !== 'SIN NUMERO') {
        if (seriesUsadas.has(serie)) {
          console.log(`⚠️  Serie duplicada omitida: ${serie}`);
          continue;
        }
        seriesUsadas.add(serie);
      }
      
      if (inventario && inventario !== '' && !inventario.includes('biblioredes')) {
        if (inventariosUsados.has(inventario)) {
          console.log(`⚠️  Inventario duplicado omitido: ${inventario}`);
          continue;
        }
        inventariosUsados.add(inventario);
      }

      clavesUsadas.add(claveUnica);
      
      // AGREGAR O CREAR EQUIPO
      if (!equiposAgrupados.has(claveUnica)) {
        equiposAgrupados.set(claveUnica, {
          equipo: row,
          reparaciones: []
        });
      }
      
      // AGREGAR OBSERVACIÓN COMO REPARACIÓN
      if (row.OBSERVACIONES && row.OBSERVACIONES.toString().trim() !== '') {
        equiposAgrupados.get(claveUnica).reparaciones.push({
          fecha: row['FECHA DE CAMBIO'],
          observacion: row.OBSERVACIONES
        });
      }
    }

    console.log(`🎯 Equipos únicos detectados: ${equiposAgrupados.size}`);
    console.log(`📈 Por serie: ${seriesUsadas.size}, Por inventario: ${inventariosUsados.size}`);

    // CREAR EQUIPOS Y REPARACIONES
    let totalEquipos = 0;
    let totalReparaciones = 0;
    const unidadesCorregidas = new Map();

    for (const [clave, datos] of equiposAgrupados) {
      try {
        const row = datos.equipo;
        
        // ESTANDARIZAR UNIDAD
        const unidadOriginal = row.UNIDAD;
        const unidadCorregida = estandarizarUnidad(unidadOriginal);
        if (unidadOriginal !== unidadCorregida) {
          unidadesCorregidas.set(unidadOriginal, unidadCorregida);
        }

        // FECHA MÁS ANTIGUA
        let fechaPrimera = parsearFechaExcel(row['FECHA DE CAMBIO']);
        for (const rep of datos.reparaciones) {
          const fechaRep = parsearFechaExcel(rep.fecha);
          if (fechaRep < fechaPrimera) fechaPrimera = fechaRep;
        }

        // 🆕 EXTRAER CPU Y ALMACENAMIENTO MEJORADO
        const cpu = extraerCPU(row['TIPO PC'], row.OBSERVACIONES);
        const almacenamiento = extraerAlmacenamientoCompleto(row);
        const tipoAlmacenamiento = determinarTipoAlmacenamiento(row);
        const ram = limpiarRAM(row.MEMORIA);

        // 🆕 LOG DETALLADO CON TODOS LOS COMPONENTES
        const identificador = row.SERIE ? `SERIE:${row.SERIE}` : 
                             row['n° INVENTARIO'] ? `INV:${row['n° INVENTARIO']}` : 
                             `NOMBRE:${row['NOMBRE PC']}`;
        
        console.log(`✅ [${totalEquipos + 1}] ${identificador}`);
        console.log(`   🖥️  CPU: ${cpu || 'N/D'}`);
        console.log(`   💾 RAM: ${ram || 'N/D'}`);
        console.log(`   💿 Almacenamiento: ${almacenamiento || 'N/D'} (${tipoAlmacenamiento})`);
        console.log(`   🏷️  Tipo: ${determinarTipoEquipo(row['TIPO PC'])}`);

        // CREAR EQUIPO CON TODOS LOS CAMPOS
        const equipo = await Equipo.create({
          modelo: row['TIPO PC'] || 'GENERICO',
          marca: extraerMarca(row['TIPO PC']),
          num_inv: row['n° INVENTARIO'] || '',
          serie: row.SERIE || '',
          ip: row['IP EQUIPO'] || '',
          nombre_unidad: unidadCorregida,
          tipo_equipo: determinarTipoEquipo(row['TIPO PC']),
          nombre_equipo: row['NOMBRE PC'],
          nombre_usuario: row.USUARIO || '',
          windows: row.WINDOWS || '',
          antivirus: row.ANTIVIRUS || '',
          ram: ram,
          almacenamiento: almacenamiento,
          tipo_almacenamiento: tipoAlmacenamiento,
          cpu: cpu,
          estado: 'entregado',
          comentarios: '',
          historial_ingresos: [],
          createdAt: fechaPrimera,
          updatedAt: fechaPrimera
        });

        totalEquipos++;

        // CREAR REPARACIONES
        for (const reparacion of datos.reparaciones) {
          const fechaRep = parsearFechaExcel(reparacion.fecha);
          await Reparaciones.create({
            id_equipo: equipo.id,
            obs: reparacion.observacion,
            cambios: {},
            rut: '',
            contador_num_acta: 0,
            createdAt: fechaRep,
            updatedAt: fechaRep
          });
          totalReparaciones++;
        }

        if (datos.reparaciones.length > 0) {
          console.log(`   🔧 ${datos.reparaciones.length} reparaciones`);
        }

        console.log(`   ---`); // Separador para mejor legibilidad

      } catch (error) {
        console.error(`❌ Error creando equipo:`, error.message);
      }
    }

    // REPORTE FINAL
    console.log('\n🔧 CORRECCIONES APLICADAS:', unidadesCorregidas.size);
    unidadesCorregidas.forEach((corregida, original) => {
      console.log(`   "${original}" → "${corregida}"`);
    });

    console.log('\n🎉 IMPORTACIÓN MEJORADA COMPLETADA:');
    console.log(`🏷️  Equipos únicos: ${totalEquipos}`);
    console.log(`🔧 Reparaciones: ${totalReparaciones}`);
    console.log(`📊 Eficiencia: ${((totalEquipos / datosReales.length) * 100).toFixed(1)}%`);
    console.log(`🔍 Identificación: ${seriesUsadas.size} por serie, ${inventariosUsados.size} por inventario, ${equiposAgrupados.size - seriesUsadas.size - inventariosUsados.size} por otros métodos`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// EJECUTAR
importarVersionMejorada();