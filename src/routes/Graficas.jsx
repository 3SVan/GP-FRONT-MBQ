import React, { useState } from "react";
import { FileText, Download, Eye, Trash2, Plus, Edit, AlertCircle, CheckCircle2, Info, X, FileSpreadsheet } from "lucide-react";

// Componente de gráficas y tabla para usar directamente en el dashboard
function Graficas({ showAlert }) {
  const [tableData, setTableData] = useState([
    {
      id: 1,
      proveedor: "Tecnología Avanzada SA",
      facturas: [{ id: 1, nombre: "factura_001.pdf", tamaño: "2.3 MB" }, { id: 2, nombre: "factura_002.pdf", tamaño: "1.8 MB" }],
      ordenesCompra: [{ id: 1, nombre: "oc_001.pdf", tamaño: "3.1 MB" }],
      documentosRespaldo: [{ id: 1, nombre: "contrato.pdf", tamaño: "4.2 MB" }, { id: 2, nombre: "certificado.pdf", tamaño: "1.5 MB" }],
      estatus: "Activo",
      categoria: "Tecnología",
      comentarios: ["Excelente servicio", "Entrega puntual"]
    },
    {
      id: 2,
      proveedor: "Suministros Industriales MX",
      facturas: [{ id: 1, nombre: "factura_003.pdf", tamaño: "2.1 MB" }],
      ordenesCompra: [{ id: 1, nombre: "oc_002.pdf", tamaño: "2.8 MB" }, { id: 2, nombre: "oc_003.pdf", tamaño: "3.0 MB" }],
      documentosRespaldo: [{ id: 1, nombre: "garantia.pdf", tamaño: "2.5 MB" }],
      estatus: "Activo",
      categoria: "Industrial",
      comentarios: ["Buen precio", "Atención rápida"]
    },
    {
      id: 3,
      proveedor: "Servicios Corporativos SC",
      facturas: [{ id: 1, nombre: "factura_004.pdf", tamaño: "2.4 MB" }, { id: 2, nombre: "factura_005.pdf", tamaño: "2.0 MB" }],
      ordenesCompra: [{ id: 1, nombre: "oc_004.pdf", tamaño: "3.2 MB" }],
      documentosRespaldo: [{ id: 1, nombre: "acuerdo.pdf", tamaño: "3.8 MB" }, { id: 2, nombre: "polizas.pdf", tamaño: "2.9 MB" }],
      estatus: "En revisión",
      categoria: "Servicios",
      comentarios: ["En proceso de evaluación"]
    }
  ]);

  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Datos de ejemplo para las gráficas
  const chartData = {
    proveedores: {
      aprobado: 45,
      rechazado: 23,
    },
    facturas: {
      aprobadas: 89,
      rechazadas: 15,
      "pendientes por pagar": 32,
      pagadas: 156,
    },
    contratos: {
      nuevos: 12,
      "en aviso": 8,
      vencidos: 5,
    },
    ordenesCompra: {
      retrasadas: 7,
      aprobadas: 45,
      rechazadas: 10,
    },
  };

  // FUNCIONES CRUD
  const handleDelete = (id) => {
    const proveedor = tableData.find(p => p.id === id);
    showAlert('warning', 
      'Confirmar Eliminación', 
      `¿Estás seguro de que quieres eliminar a "${proveedor?.proveedor}"? Esta acción no se puede deshacer.`,
      true,
      () => {
        setTableData(tableData.filter(item => item.id !== id));
        showAlert('success', 'Eliminado', 'El proveedor ha sido eliminado correctamente');
      }
    );
  };

  const handleView = (id) => {
    const proveedor = tableData.find(p => p.id === id);
    showAlert('info', 'Detalles del Proveedor', 
      `Nombre: ${proveedor.proveedor}\nCategoría: ${proveedor.categoria}\nEstatus: ${proveedor.estatus}\nComentarios: ${proveedor.comentarios.length}`);
  };

  // Función para generar archivo Excel con formato profesional
  const generarExcelConFormato = (datos, cabeceras, titulo, nombreArchivo) => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
              font-family: Arial, sans-serif;
            }
            .titulo {
              background-color: #2F4156;
              color: white;
              font-size: 18px;
              font-weight: bold;
              padding: 15px;
              text-align: center;
              border: 1px solid #2F4156;
            }
            .cabecera {
              background-color: #567C8D;
              color: white;
              font-weight: bold;
              padding: 10px;
              border: 1px solid #567C8D;
              text-align: center;
            }
            .fila-datos {
              background-color: #FFFFFF;
            }
            .fila-datos:nth-child(even) {
              background-color: #C8D9E6;
            }
            .celda {
              padding: 8px;
              border: 1px solid #567C8D;
              text-align: left;
            }
            .celda-numero {
              text-align: right;
              padding: 8px;
              border: 1px solid #567C8D;
            }
            .celda-centro {
              text-align: center;
              padding: 8px;
              border: 1px solid #567C8D;
            }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="${cabeceras.length}" class="titulo">${titulo}</td>
            </tr>
            <tr>
              ${cabeceras.map(cabecera => `<td class="cabecera">${cabecera}</td>`).join('')}
            </tr>
            ${datos.map((fila, index) => `
              <tr class="fila-datos">
                ${fila.map((celda, celdaIndex) => {
                  const esNumero = !isNaN(parseFloat(celda)) && isFinite(celda);
                  const esCentro = cabeceras[celdaIndex] === 'ESTATUS' || cabeceras[celdaIndex] === 'Fecha';
                  const clase = esNumero ? 'celda-numero' : (esCentro ? 'celda-centro' : 'celda');
                  return `<td class="${clase}">${celda}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para generar PDF
  const generarPDF = (documento, tipo, proveedor) => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documento.nombre}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            color: #333;
          }
          .header { 
            border-bottom: 3px solid #2F4156; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
            text-align: center;
          }
          .info { 
            margin: 20px 0; 
          }
          .label { 
            font-weight: bold; 
            color: #2F4156; 
            width: 150px;
            display: inline-block;
          }
          .section {
            margin: 25px 0;
            padding: 15px;
            border-left: 4px solid #567C8D;
            background-color: #f8f9fa;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #567C8D;
            color: white;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DOCUMENTO - ${tipo.toUpperCase()}</h1>
          <p>Sistema de Gestión de Proveedores</p>
        </div>
        
        <div class="info">
          <h2>Información del Documento</h2>
          <p><span class="label">Documento:</span> ${documento.nombre}</p>
          <p><span class="label">Tipo:</span> ${tipo}</p>
          <p><span class="label">Tamaño:</span> ${documento.tamaño}</p>
          <p><span class="label">Fecha de generación:</span> ${new Date().toLocaleDateString('es-MX')}</p>
        </div>

        <div class="section">
          <h2>Información del Proveedor</h2>
          <p><span class="label">Proveedor:</span> ${proveedor.proveedor}</p>
          <p><span class="label">Categoría:</span> ${proveedor.categoria}</p>
          <p><span class="label">Estatus:</span> ${proveedor.estatus}</p>
        </div>

        <div class="section">
          <h2>Detalles del Documento</h2>
          <table>
            <tr>
              <th>Campo</th>
              <th>Valor</th>
            </tr>
            <tr>
              <td>ID del Documento</td>
              <td>${documento.id}</td>
            </tr>
            <tr>
              <td>Fecha de Emisión</td>
              <td>${new Date().toLocaleDateString('es-MX')}</td>
            </tr>
            <tr>
              <td>UUID</td>
              <td>uuid-${documento.id}-${Date.now()}</td>
            </tr>
            ${tipo === 'facturas' ? `
            <tr>
              <td>SUBTOTAL</td>
              <td>$10,000.00</td>
            </tr>
            <tr>
              <td>IVA</td>
              <td>$1,600.00</td>
            </tr>
            <tr>
              <td>TOTAL</td>
              <td>$11,600.00</td>
            </tr>
            ` : ''}
            ${tipo === 'ordenes-compra' ? `
            <tr>
              <td>Orden de Compra</td>
              <td>OC-2024-${documento.id.toString().padStart(3, '0')}</td>
            </tr>
            <tr>
              <td>PROYECTO</td>
              <td>Proyecto Principal</td>
            </tr>
            ` : ''}
            ${tipo === 'documentos-respaldo' ? `
            <tr>
              <td>Válido Hasta</td>
              <td>31/12/2024</td>
            </tr>
            <tr>
              <td>Emitido Por</td>
              <td>Departamento Legal</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div class="footer">
          <p>Documento generado automáticamente - Sistema de Gestión de Proveedores</p>
          <p>MBQ - ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([contenido], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documento.nombre.replace('.pdf', '')}_${tipo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Función para descargar Excel
  const descargarExcel = (documento, tipo, proveedor) => {
    try {
      let datos = [];
      let cabeceras = [];
      let titulo = '';
      let nombreArchivo = '';

      // Configurar según el tipo de documento
      switch(tipo) {
        case "facturas":
          datos = [
            {
              Proveedor: proveedor.proveedor,
              Documento: documento.nombre,
              Tipo: "Factura",
              Tamaño: documento.tamaño,
              Categoría: proveedor.categoria,
              Estatus: proveedor.estatus,
              Fecha: new Date().toLocaleDateString('es-MX'),
              UUID: `uuid-${documento.id}-${Date.now()}`,
              SUBTOTAL: "$10,000.00",
              IVA: "$1,600.00",
              TOTAL: "$11,600.00"
            }
          ];
          cabeceras = ["Proveedor", "Documento", "Tipo", "Tamaño", "Categoría", "Estatus", "Fecha", "UUID", "SUBTOTAL", "IVA", "TOTAL"];
          titulo = `MBQ FACTURA - ${proveedor.proveedor.toUpperCase()}`;
          nombreArchivo = `factura_${proveedor.proveedor.replace(/\s+/g, '_')}_${documento.id}`;
          break;

        case "ordenes-compra":
          datos = [
            {
              Proveedor: proveedor.proveedor,
              Documento: documento.nombre,
              Tipo: "Orden de Compra",
              Tamaño: documento.tamaño,
              Categoría: proveedor.categoria,
              Estatus: proveedor.estatus,
              Fecha: new Date().toLocaleDateString('es-MX'),
              Orden: `OC-2024-${documento.id.toString().padStart(3, '0')}`,
              PROYECTO: "Proyecto Principal",
              SUBTOTAL: "$8,500.00",
              IVA: "$1,360.00",
              TOTAL: "$9,860.00"
            }
          ];
          cabeceras = ["Proveedor", "Documento", "Tipo", "Tamaño", "Categoría", "Estatus", "Fecha", "Orden", "PROYECTO", "SUBTOTAL", "IVA", "TOTAL"];
          titulo = `MBQ ORDEN DE COMPRA - ${proveedor.proveedor.toUpperCase()}`;
          nombreArchivo = `orden_compra_${proveedor.proveedor.replace(/\s+/g, '_')}_${documento.id}`;
          break;

        case "documentos-respaldo":
          datos = [
            {
              Proveedor: proveedor.proveedor,
              Documento: documento.nombre,
              Tipo: "Documento de Respaldo",
              Tamaño: documento.tamaño,
              Categoría: proveedor.categoria,
              Estatus: proveedor.estatus,
              Fecha: new Date().toLocaleDateString('es-MX'),
              Descripción: "Documento de respaldo oficial",
              Válido_Hasta: "31/12/2024",
              Emitido_Por: "Departamento Legal"
            }
          ];
          cabeceras = ["Proveedor", "Documento", "Tipo", "Tamaño", "Categoría", "Estatus", "Fecha", "Descripción", "Válido_Hasta", "Emitido_Por"];
          titulo = `MBQ DOCUMENTO RESPALDO - ${proveedor.proveedor.toUpperCase()}`;
          nombreArchivo = `respaldo_${proveedor.proveedor.replace(/\s+/g, '_')}_${documento.id}`;
          break;

        default:
          datos = [
            {
              Proveedor: proveedor.proveedor,
              Documento: documento.nombre,
              Tipo: tipo,
              Tamaño: documento.tamaño,
              Categoría: proveedor.categoria,
              Estatus: proveedor.estatus,
              Fecha: new Date().toLocaleDateString('es-MX')
            }
          ];
          cabeceras = ["Proveedor", "Documento", "Tipo", "Tamaño", "Categoría", "Estatus", "Fecha"];
          titulo = `MBQ DOCUMENTO - ${proveedor.proveedor.toUpperCase()}`;
          nombreArchivo = `documento_${proveedor.proveedor.replace(/\s+/g, '_')}_${documento.id}`;
      }

      // Convertir datos a filas
      const filas = datos.map(doc => 
        Object.values(doc).map(valor => 
          typeof valor === 'string' && valor.startsWith('$') ? valor : valor.toString()
        )
      );

      generarExcelConFormato(filas, cabeceras, titulo, nombreArchivo);
      showAlert('success', 'Descarga Completada', `${documento.nombre} se ha descargado correctamente en formato Excel`);
      
    } catch (error) {
      console.error('Error al descargar:', error);
      showAlert('error', 'Error en Descarga', 'Hubo un problema al descargar el documento');
    }
  };

  // Función para descargar PDF
  const descargarPDF = (documento, tipo, proveedor) => {
    try {
      generarPDF(documento, tipo, proveedor);
      showAlert('success', 'Descarga Completada', `${documento.nombre} se ha descargado correctamente en formato PDF`);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      showAlert('error', 'Error en Descarga', 'Hubo un problema al descargar el documento PDF');
    }
  };

  // Función para obtener colores según la categoría y estado
  const getChartColors = (chartType, labels) => {
    const colorMap = {
      verde: '#10b981',
      rojo: '#ef4444',
      amarillo: '#f59e0b',
      azul: '#3b82f6', 
      verdeo: '#045338ff'
    };

    const colorRules = {
      proveedores: {
        'aprobado': colorMap.verde,
        'rechazado': colorMap.rojo
      },
      facturas: {
        'aprobadas': colorMap.verde,
        'rechazadas': colorMap.rojo,
        'pendientes por pagar': colorMap.amarillo,
        'pagadas': colorMap.verdeo
      },
      contratos: {
        'nuevos': colorMap.azul,
        'en aviso': colorMap.amarillo,
        'vencidos': colorMap.rojo
      },
      ordenesCompra: {
        'retrasadas': colorMap.amarillo,
        'aprobadas': colorMap.verde,
        'rechazadas': colorMap.rojo
      }
    };

    return labels.map(label => colorRules[chartType]?.[label] || '#6b7280');
  };

  // Componente de gráfica de pastel
  const PieChart = ({ data, title, chartType }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const labels = Object.keys(data);
    const colors = getChartColors(chartType, labels);
    
    return (
      <div className="bg-white p-6 rounded-xl border border-lightBlue shadow-lg">
        <h3 className="text-lg font-semibold text-darkBlue mb-4 text-center">{title}</h3>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-40 h-40 mx-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {Object.values(data).map((value, index) => {
                const percentage = (value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const previousPercentages = Object.values(data)
                  .slice(0, index)
                  .reduce((sum, val) => sum + (val / total) * 100, 0);
                const strokeDashoffset = 100 - previousPercentages;

                return (
                  <circle
                    key={index}
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke={colors[index]}
                    strokeWidth="3"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-3xl font-bold text-darkBlue">
                {total}
              </span>
              <span className="text-sm text-midBlue">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: colors[index] }}
                    ></div>
                    <span className="text-xs text-darkBlue capitalize">
                      {key}:
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-semibold text-midBlue block">
                      {value}
                    </span>
                    <span className="text-xs text-midBlue">
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Componente para mostrar documentos descargables
  const DocumentList = ({ documentos, tipo, proveedor }) => (
    <div className="space-y-2">
      {documentos.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between group">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-midBlue flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-darkBlue truncate">{doc.nombre}</p>
              <p className="text-xs text-gray-500">{doc.tamaño}</p>
            </div>
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => descargarExcel(doc, tipo, proveedor)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={() => descargarPDF(doc, tipo, proveedor)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
              title="Descargar PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {documentos.length === 0 && (
        <span className="text-xs text-gray-400 italic">No hay documentos</span>
      )}
    </div>
  );

  // Funciones para comentarios
  const startEditingComment = (proveedorId, commentIndex = null) => {
    setEditingComment({ proveedorId, commentIndex });
    if (commentIndex !== null) {
      setCommentText(tableData.find(p => p.id === proveedorId)?.comentarios[commentIndex] || "");
    } else {
      setCommentText("");
    }
  };

  const saveComment = (proveedorId) => {
    if (commentText.trim()) {
      setTableData(prevData => 
        prevData.map(proveedor => 
          proveedor.id === proveedorId 
            ? {
                ...proveedor,
                comentarios: editingComment.commentIndex !== null 
                  ? proveedor.comentarios.map((comment, idx) => 
                      idx === editingComment.commentIndex ? commentText : comment
                    )
                  : [...proveedor.comentarios, commentText]
              }
            : proveedor
        )
      );
      setEditingComment(null);
      setCommentText("");
      showAlert('success', 'Comentario Guardado', 'El comentario se ha guardado correctamente');
    }
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setCommentText("");
  };

  const deleteComment = (proveedorId, commentIndex) => {
    const comentario = tableData.find(p => p.id === proveedorId)?.comentarios[commentIndex];
    showAlert('warning',
      'Eliminar Comentario',
      `¿Estás seguro de que quieres eliminar este comentario?`,
      true,
      () => {
        setTableData(prevData =>
          prevData.map(proveedor =>
            proveedor.id === proveedorId
              ? {
                  ...proveedor,
                  comentarios: proveedor.comentarios.filter((_, idx) => idx !== commentIndex)
                }
              : proveedor
          )
        );
        showAlert('success', 'Comentario Eliminado', 'El comentario ha sido eliminado');
      }
    );
  };

  // Componente para comentarios
  const CommentsSection = ({ proveedor }) => {
    const isEditing = editingComment?.proveedorId === proveedor.id;

    return (
      <div className="space-y-2">
        {proveedor.comentarios.map((comentario, index) => (
          <div key={index} className="flex items-start justify-between group">
            {isEditing && editingComment.commentIndex === index ? (
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full text-xs p-2 border border-lightBlue rounded resize-none focus:border-midBlue focus:outline-none"
                  rows="2"
                  placeholder="Escribe tu comentario..."
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => saveComment(proveedor.id)}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                  >
                    ✓ Guardar
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-xs text-darkBlue bg-lightBlue p-2 rounded">
                    {comentario}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                  <button
                    onClick={() => startEditingComment(proveedor.id, index)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteComment(proveedor.id, index)}
                    className="p-1 text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {isEditing && editingComment.commentIndex === null ? (
          <div className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un nuevo comentario..."
              className="w-full text-xs p-2 border border-lightBlue rounded resize-none focus:border-midBlue focus:outline-none"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveComment(proveedor.id)}
                className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
              >
                ✓ Agregar
              </button>
              <button
                onClick={cancelEditing}
                className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        ) : (
          !isEditing && (
            <button
              onClick={() => startEditingComment(proveedor.id, null)}
              className="flex items-center gap-2 text-xs text-midBlue hover:text-darkBlue transition w-full justify-center py-1 border border-dashed border-lightBlue rounded hover:border-midBlue"
            >
              <Plus className="w-3 h-3" />
              Agregar comentario
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-darkBlue mb-3">
          Resumen General del Sistema
        </h2>
        <p className="text-midBlue text-lg">
          Estadísticas y métricas clave en tiempo real
        </p>
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        <PieChart
          title="Proveedores"
          data={chartData.proveedores}
          chartType="proveedores"
        />
        <PieChart
          title="Facturas"
          data={chartData.facturas}
          chartType="facturas"
        />
        <PieChart
          title="Contratos"
          data={chartData.contratos}
          chartType="contratos"
        />
        <PieChart
          title="Órdenes de Compra"
          data={chartData.ordenesCompra}
          chartType="ordenesCompra"
        />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border border-lightBlue shadow-lg overflow-hidden">
        <div className="p-6 border-b border-lightBlue">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-darkBlue">
                Gestión de Proveedores
              </h3>
              <p className="text-sm text-midBlue mt-1">
                Lista completa de proveedores registrados
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-lightBlue">
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Facturas
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Órdenes de Compra
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Documentos Respaldo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Acciones
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">
                  Comentarios
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightBlue">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-lightBlue hover:bg-opacity-30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-darkBlue">
                        {row.proveedor}
                      </div>
                      <div className="text-xs text-midBlue">
                        {row.categoria}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        row.estatus === 'Activo' 
                          ? 'bg-green-100 text-green-800'
                          : row.estatus === 'En revisión'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {row.estatus}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <DocumentList documentos={row.facturas} tipo="facturas" proveedor={row} />
                  </td>
                  
                  <td className="px-6 py-4">
                    <DocumentList documentos={row.ordenesCompra} tipo="ordenes-compra" proveedor={row} />
                  </td>
                  
                  <td className="px-6 py-4">
                    <DocumentList documentos={row.documentosRespaldo} tipo="documentos-respaldo" proveedor={row} />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(row.id)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                        title="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <CommentsSection proveedor={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Graficas;