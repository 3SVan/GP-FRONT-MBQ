// src/pages/shared/Graficas.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Eye, Trash2, Plus, Edit, FileSpreadsheet } from "lucide-react";

import { ProvidersAPI } from "../../api/providers.api";
import { AuthAPI } from "../../api/auth.api";

/**
 * Graficas
 * Props:
 * - showAlert: fn(type, title, message, showConfirm?, onConfirm?)
 * - loading: boolean (para stats)
 * - stats: objeto de métricas del backend (opcional)
 * - tableEnabled: boolean (default true)
 * - tableScope: "admin" | "none" (default "admin")
 *
 * Nota: Si entras como PROVIDER, NO debes usar tableScope="admin"
 * porque /providers/admin/table requiere rol ADMIN.
 */
function Graficas({
  showAlert,
  loading = false,
  stats = null,
  tableEnabled = true,
  tableScope = "admin",
}) {
  // ✅ showAlert estable (evita loops infinitos)
  const showAlertRef = useRef(showAlert);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  // Tabla
  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableQuery, setTableQuery] = useState("");

  // Debounce para query (evita pegarle al back en cada tecla)
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(tableQuery), 350);
    return () => clearTimeout(t);
  }, [tableQuery]);

  // Roles (para proteger llamadas admin)
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await AuthAPI.me();
        if (!alive) return;
        setRoles(me?.data?.user?.roles || []);
      } catch {
        // Si no hay sesión/cookie todavía, no matamos la UI
        if (!alive) return;
        setRoles([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = roles.includes("ADMIN");

  // ✅ fetch tabla desde BD (SIN LOOP)
  useEffect(() => {
    let alive = true;

    // Si la tabla está apagada o no aplica, salimos
    if (!tableEnabled || tableScope === "none") return;

    // Si pidieron tabla admin pero NO eres admin → NO llames al endpoint
    if (tableScope === "admin" && !isAdmin) {
      setLoadingTable(false);
      setTableData([]);
      return;
    }

    (async () => {
      try {
        setLoadingTable(true);

        // Solo soportamos tabla admin aquí
        const data = await ProvidersAPI.getAdminTable(debouncedQuery);
        if (!alive) return;

        setTableData(data?.results || []);
      } catch (err) {
        console.error(err);
        showAlertRef.current?.(
          "error",
          "Proveedores",
          "No se pudo cargar la tabla de proveedores."
        );
      } finally {
        if (alive) setLoadingTable(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [debouncedQuery, tableEnabled, tableScope, isAdmin]);

  /**
   * Mapeo de stats reales
   */
  const chartData = useMemo(() => {
    if (!stats) {
      return {
        proveedores: { aprobado: 0, rechazado: 0 },
        facturas: { aprobadas: 0, rechazadas: 0, "pendientes por pagar": 0, pagadas: 0 },
        contratos: { nuevos: 0, "en aviso": 0, vencidos: 0 },
        ordenesCompra: { retrasadas: 0, aprobadas: 0, rechazadas: 0 },
      };
    }

    return {
      proveedores: {
        aprobado: Number(stats?.proveedores?.aprobado ?? 0),
        rechazado: Number(stats?.proveedores?.rechazado ?? 0),
      },
      facturas: {
        aprobadas: Number(stats?.facturas?.aprobadas ?? 0),
        rechazadas: Number(stats?.facturas?.rechazadas ?? 0),
        "pendientes por pagar": Number(stats?.facturas?.["pendientes por pagar"] ?? 0),
        pagadas: Number(stats?.facturas?.pagadas ?? 0),
      },
      contratos: {
        nuevos: Number(stats?.contratos?.nuevos ?? 0),
        "en aviso": Number(stats?.contratos?.["en aviso"] ?? 0),
        vencidos: Number(stats?.contratos?.vencidos ?? 0),
      },
      ordenesCompra: {
        retrasadas: Number(stats?.ordenesCompra?.retrasadas ?? 0),
        aprobadas: Number(stats?.ordenesCompra?.aprobadas ?? 0),
        rechazadas: Number(stats?.ordenesCompra?.rechazadas ?? 0),
      },
    };
  }, [stats]);

  // Helpers UI
  const normalizeDocName = (doc, fallbackPrefix) => {
    if (doc?.nombre) return doc.nombre;
    if (doc?.number) return `${fallbackPrefix}_${doc.number}.pdf`;
    return `${fallbackPrefix}_${doc?.id || "doc"}.pdf`;
  };

  const openUrlIfExists = (doc) => {
    if (doc?.url) {
      window.open(doc.url, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  };

  // Acciones tabla
  const handleDelete = (id) => {
    const proveedor = tableData.find((p) => p.id === id);

    showAlertRef.current?.(
      "warning",
      "Confirmar Eliminación",
      `¿Estás seguro de que quieres eliminar a "${proveedor?.proveedor}"? Esta acción no se puede deshacer.`,
      true,
      () => {
        setTableData((prev) => prev.filter((item) => item.id !== id));
        showAlertRef.current?.("success", "Eliminado", "El proveedor ha sido eliminado (solo UI).");
      }
    );
  };

  const handleView = (id) => {
    const proveedor = tableData.find((p) => p.id === id);
    if (!proveedor) return;

    showAlertRef.current?.(
      "info",
      "Detalles del Proveedor",
      `Nombre: ${proveedor.proveedor}\nCategoría: ${proveedor.categoria}\nEstatus: ${proveedor.estatus}\nComentarios: ${proveedor.comentarios?.length || 0}`
    );
  };

  // Export (igual que lo traías)
  const generarExcelConFormato = (datos, cabeceras, titulo, nombreArchivo) => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            .titulo { background-color: #2F4156; color: white; font-size: 18px; font-weight: bold; padding: 15px; text-align: center; border: 1px solid #2F4156; }
            .cabecera { background-color: #567C8D; color: white; font-weight: bold; padding: 10px; border: 1px solid #567C8D; text-align: center; }
            .fila-datos { background-color: #FFFFFF; }
            .fila-datos:nth-child(even) { background-color: #C8D9E6; }
            .celda { padding: 8px; border: 1px solid #567C8D; text-align: left; }
            .celda-numero { text-align: right; padding: 8px; border: 1px solid #567C8D; }
            .celda-centro { text-align: center; padding: 8px; border: 1px solid #567C8D; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="${cabeceras.length}" class="titulo">${titulo}</td></tr>
            <tr>${cabeceras.map((cabecera) => `<td class="cabecera">${cabecera}</td>`).join("")}</tr>
            ${datos
              .map(
                (fila) => `
              <tr class="fila-datos">
                ${fila
                  .map((celda, celdaIndex) => {
                    const esNumero = !isNaN(parseFloat(celda)) && isFinite(celda);
                    const esCentro = cabeceras[celdaIndex] === "ESTATUS" || cabeceras[celdaIndex] === "Fecha";
                    const clase = esNumero ? "celda-numero" : esCentro ? "celda-centro" : "celda";
                    return `<td class="${clase}">${celda}</td>`;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generarPDF = (documento, tipo, proveedor) => {
    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${documento.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { border-bottom: 3px solid #2F4156; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
          .info { margin: 20px 0; }
          .label { font-weight: bold; color: #2F4156; width: 150px; display: inline-block; }
          .section { margin: 25px 0; padding: 15px; border-left: 4px solid #567C8D; background-color: #f8f9fa; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #567C8D; color: white; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
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
          <p><span class="label">Fecha de generación:</span> ${new Date().toLocaleDateString("es-MX")}</p>
        </div>
        <div class="section">
          <h2>Información del Proveedor</h2>
          <p><span class="label">Proveedor:</span> ${proveedor.proveedor}</p>
          <p><span class="label">Categoría:</span> ${proveedor.categoria}</p>
          <p><span class="label">Estatus:</span> ${proveedor.estatus}</p>
        </div>
        <div class="footer">
          <p>Documento generado automáticamente - Sistema de Gestión de Proveedores</p>
          <p>MBQ - ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([contenido], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${documento.nombre.replace(".pdf", "")}_${tipo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const descargarExcel = (documento, tipo, proveedor) => {
    try {
      if (openUrlIfExists(documento)) {
        showAlertRef.current?.("success", "Descarga", "Se abrió el documento desde la URL (si el navegador lo permite).");
        return;
      }

      const datos = [
        {
          Proveedor: proveedor.proveedor,
          Documento: documento.nombre,
          Tipo: tipo,
          Tamaño: documento.tamaño || "-",
          Categoría: proveedor.categoria,
          Estatus: proveedor.estatus,
          Fecha: new Date().toLocaleDateString("es-MX"),
        },
      ];
      const cabeceras = ["Proveedor", "Documento", "Tipo", "Tamaño", "Categoría", "Estatus", "Fecha"];
      const titulo = `MBQ DOCUMENTO - ${proveedor.proveedor.toUpperCase()}`;
      const nombreArchivo = `documento_${proveedor.proveedor.replace(/\s+/g, "_")}_${documento.id}`;

      const filas = datos.map((doc) => Object.values(doc).map((v) => v.toString()));
      generarExcelConFormato(filas, cabeceras, titulo, nombreArchivo);

      showAlertRef.current?.("success", "Descarga Completada", `${documento.nombre} se ha descargado correctamente en formato Excel`);
    } catch (error) {
      console.error("Error al descargar:", error);
      showAlertRef.current?.("error", "Error en Descarga", "Hubo un problema al descargar el documento");
    }
  };

  const descargarPDF = (documento, tipo, proveedor) => {
    try {
      if (openUrlIfExists(documento)) {
        showAlertRef.current?.("success", "Descarga", "Se abrió el documento desde la URL (si el navegador lo permite).");
        return;
      }

      generarPDF(documento, tipo, proveedor);
      showAlertRef.current?.("success", "Descarga Completada", `${documento.nombre} se ha descargado correctamente en formato PDF`);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      showAlertRef.current?.("error", "Error en Descarga", "Hubo un problema al descargar el documento PDF");
    }
  };

  // Colores
  const getChartColors = (chartType, labels) => {
    const colorMap = {
      verde: "#10b981",
      rojo: "#ef4444",
      amarillo: "#f59e0b",
      azul: "#3b82f6",
      verdeo: "#045338ff",
    };

    const colorRules = {
      proveedores: { aprobado: colorMap.verde, rechazado: colorMap.rojo },
      facturas: {
        aprobadas: colorMap.verde,
        rechazadas: colorMap.rojo,
        "pendientes por pagar": colorMap.amarillo,
        pagadas: colorMap.verdeo,
      },
      contratos: { nuevos: colorMap.azul, "en aviso": colorMap.amarillo, vencidos: colorMap.rojo },
      ordenesCompra: { retrasadas: colorMap.amarillo, aprobadas: colorMap.verde, rechazadas: colorMap.rojo },
    };

    return labels.map((label) => colorRules[chartType]?.[label] || "#6b7280");
  };

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
                const percentage = total > 0 ? (value / total) * 100 : 0;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const previousPercentages = Object.values(data)
                  .slice(0, index)
                  .reduce((sum, val) => sum + (total > 0 ? (val / total) * 100 : 0), 0);
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
              <span className="text-3xl font-bold text-darkBlue">{total}</span>
              <span className="text-sm text-midBlue">Total</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 min-w-0">
            {Object.entries(data).map(([key, value], index) => {
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index] }} />
                    <span className="text-xs text-darkBlue capitalize">{key}:</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-semibold text-midBlue block">{value}</span>
                    <span className="text-xs text-midBlue">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const DocumentList = ({ documentos, tipo, proveedor }) => (
    <div className="space-y-2">
      {documentos.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between group">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-midBlue flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-darkBlue truncate">{normalizeDocName(doc, tipo)}</p>
              <p className="text-xs text-gray-500">{doc.tamaño || "-"}</p>
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
      {documentos.length === 0 && <span className="text-xs text-gray-400 italic">No hay documentos</span>}
    </div>
  );

  // Comentarios (local UI)
  const [editingComment, setEditingComment] = useState(null);
  const [commentText, setCommentText] = useState("");

  const startEditingComment = (proveedorId, commentIndex = null) => {
    setEditingComment({ proveedorId, commentIndex });
    if (commentIndex !== null) {
      setCommentText(tableData.find((p) => p.id === proveedorId)?.comentarios?.[commentIndex] || "");
    } else {
      setCommentText("");
    }
  };

  const saveComment = (proveedorId) => {
    if (commentText.trim()) {
      setTableData((prevData) =>
        prevData.map((proveedor) =>
          proveedor.id === proveedorId
            ? {
                ...proveedor,
                comentarios:
                  editingComment.commentIndex !== null
                    ? (proveedor.comentarios || []).map((comment, idx) =>
                        idx === editingComment.commentIndex ? commentText : comment
                      )
                    : [...(proveedor.comentarios || []), commentText],
              }
            : proveedor
        )
      );
      setEditingComment(null);
      setCommentText("");
      showAlertRef.current?.("success", "Comentario Guardado", "El comentario se ha guardado correctamente (solo UI).");
    }
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setCommentText("");
  };

  const deleteComment = (proveedorId, commentIndex) => {
    showAlertRef.current?.("warning", "Eliminar Comentario", `¿Estás seguro de que quieres eliminar este comentario?`, true, () => {
      setTableData((prevData) =>
        prevData.map((proveedor) =>
          proveedor.id === proveedorId
            ? { ...proveedor, comentarios: (proveedor.comentarios || []).filter((_, idx) => idx !== commentIndex) }
            : proveedor
        )
      );
      showAlertRef.current?.("success", "Comentario Eliminado", "El comentario ha sido eliminado (solo UI).");
    });
  };

  const CommentsSection = ({ proveedor }) => {
    const isEditing = editingComment?.proveedorId === proveedor.id;
    const comentarios = proveedor.comentarios || [];

    return (
      <div className="space-y-2">
        {comentarios.map((comentario, index) => (
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
                  <p className="text-xs text-darkBlue bg-lightBlue p-2 rounded">{comentario}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                  <button
                    onClick={() => startEditingComment(proveedor.id, index)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition"
                    title="Editar comentario"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteComment(proveedor.id, index)}
                    className="p-1 text-red-600 hover:text-red-800 transition"
                    title="Eliminar comentario"
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

  // UI guard para stats
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-lightBlue shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-darkBlue">Cargando métricas…</h2>
          <p className="text-midBlue mt-2">Obteniendo datos desde la base de datos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-darkBlue mb-3">Resumen General del Sistema</h2>
        <p className="text-midBlue text-lg">Estadísticas y métricas clave en tiempo real</p>
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        <PieChart title="Proveedores" data={chartData.proveedores} chartType="proveedores" />
        <PieChart title="Facturas" data={chartData.facturas} chartType="facturas" />
        <PieChart title="Contratos" data={chartData.contratos} chartType="contratos" />
        <PieChart title="Órdenes de Compra" data={chartData.ordenesCompra} chartType="ordenesCompra" />
      </div>

      {/* TABLA (solo si aplica) */}
      {/* {tableEnabled && tableScope !== "none" && (
        <div className="bg-white rounded-xl border border-lightBlue shadow-lg overflow-hidden">
          <div className="p-6 border-b border-lightBlue">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-darkBlue">Gestión de Proveedores</h3>
                <p className="text-sm text-midBlue mt-1">Lista completa de proveedores registrados</p>
              </div>

              <div className="w-full sm:w-72">
                <input
                  value={tableQuery}
                  onChange={(e) => setTableQuery(e.target.value)}
                  placeholder="Buscar por RFC o nombre…"
                  className="w-full px-4 py-2 border border-lightBlue rounded-lg focus:outline-none focus:border-midBlue text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Se actualiza automáticamente</p>
              </div>
            </div>
          </div>

          {!isAdmin && tableScope === "admin" ? (
            <div className="p-6 text-sm text-midBlue">
              No tienes permisos para ver esta tabla (requiere rol ADMIN).
            </div>
          ) : (
            <>
              {loadingTable && <div className="p-6 text-midBlue text-sm">Cargando proveedores desde BD…</div>}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-lightBlue">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Proveedor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Facturas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Órdenes de Compra</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Documentos Respaldo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Acciones</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-darkBlue uppercase tracking-wider">Comentarios</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-lightBlue">
                    {!loadingTable && tableData.length === 0 ? (
                      <tr>
                        <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                          No hay proveedores para mostrar.
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row) => (
                        <tr key={row.id} className="hover:bg-lightBlue hover:bg-opacity-30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-darkBlue">{row.proveedor}</div>
                              <div className="text-xs text-midBlue">{row.categoria}</div>

                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                                  row.estatus === "Activo"
                                    ? "bg-green-100 text-green-800"
                                    : row.estatus === "En revisión"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.estatus}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <DocumentList documentos={row.facturas || []} tipo="facturas" proveedor={row} />
                          </td>

                          <td className="px-6 py-4">
                            <DocumentList documentos={row.ordenesCompra || []} tipo="ordenes-compra" proveedor={row} />
                          </td>

                          <td className="px-6 py-4">
                            <DocumentList documentos={row.documentosRespaldo || []} tipo="documentos-respaldo" proveedor={row} />
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )} */}
    </div>
  );
}

export default Graficas;
