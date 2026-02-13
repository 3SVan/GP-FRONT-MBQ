import React, { useEffect, useMemo, useState } from "react";
import { Upload, FileText, CheckCircle, X, User, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentsAPI } from "../../api/documents.api";

const DocumentosPro = () => {
  const navigate = useNavigate();

  const [tipoPersona, setTipoPersona] = useState(""); // 'fisica' | 'moral'
  const [archivos, setArchivos] = useState({}); // { [code]: { archivo, nombre, ... } }
  const [errors, setErrors] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  // Tipos de documento desde backend
  const [documentTypes, setDocumentTypes] = useState([]);
  // Documentos existentes desde backend (ProviderDocument[])
  const [existingDocs, setExistingDocs] = useState([]);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingMe, setLoadingMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---- Helpers ----
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
  };

  // Componente de Alertas (idéntico a tu estilo)
  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        button: "bg-green-600 hover:bg-green-700",
        text: "text-green-800",
      },
      error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <CheckCircle className="w-6 h-6 text-red-600" />,
        button: "bg-red-600 hover:bg-red-700",
        text: "text-red-800",
      },
      warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: <CheckCircle className="w-6 h-6 text-yellow-600" />,
        button: "bg-yellow-600 hover:bg-yellow-700",
        text: "text-yellow-800",
      },
    };

    const style = alertStyles[alertConfig.type] || alertStyles.success;

    const close = () => {
      setAlertOpen(false);
      if (alertConfig.type === "success") {
        // Limpia selección local (no borra backend)
        setArchivos({});
        setErrors({});
      }
    };

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-95 hover:scale-100`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">{style.icon}</div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-base sm:text-lg font-semibold ${style.text} mb-2`}>
                    {alertConfig.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base">
                    {alertConfig.message}
                  </p>

                  <button
                    onClick={close}
                    className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 text-white rounded-lg transition ${style.button} font-medium text-sm sm:text-base`}
                  >
                    Aceptar
                  </button>
                </div>

                <button
                  onClick={close}
                  className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 mt-1"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const personTypeApi = useMemo(() => {
    if (tipoPersona === "fisica") return "FISICA";
    if (tipoPersona === "moral") return "MORAL";
    return "";
  }, [tipoPersona]);

  // Mapa de documentos existentes por code
  const existingByCode = useMemo(() => {
    const map = {};
    for (const d of existingDocs || []) {
      const code = d?.documentType?.code;
      if (code) map[code] = d;
    }
    return map;
  }, [existingDocs]);

  const handleTipoPersonaChange = (tipo) => {
    setTipoPersona(tipo);
    setArchivos({});
    setErrors({});
    setDocumentTypes([]);
    setExistingDocs([]);
  };

  const loadTypesAndMe = async (pt) => {
    if (!pt) return;

    setLoadingTypes(true);
    setLoadingMe(true);
    try {
      const [types, meDocs] = await Promise.all([
        DocumentsAPI.types(pt),
        DocumentsAPI.me(),
      ]);

      setDocumentTypes(Array.isArray(types) ? types : []);
      setExistingDocs(Array.isArray(meDocs?.documents) ? meDocs.documents : []);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error cargando tipos/documentos";
      showAlert("error", "Error", msg);
    } finally {
      setLoadingTypes(false);
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    if (!personTypeApi) return;
    loadTypesAndMe(personTypeApi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personTypeApi]);

  const handleFileUpload = (event, documentoCode) => {
    const file = event.target.files?.[0];

    if (file) {
      // Validar PDF
      if (file.type !== "application/pdf") {
        setErrors((prev) => ({
          ...prev,
          [documentoCode]: "Solo se permiten archivos PDF",
        }));
        return;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [documentoCode]: "El archivo no puede ser mayor a 10MB",
        }));
        return;
      }

      // Archivo válido
      setErrors((prev) => ({ ...prev, [documentoCode]: null }));

      const nuevoArchivo = {
        id: Date.now(),
        documentoCode,
        nombre: file.name,
        tipo: file.type,
        tamaño: (file.size / 1024 / 1024).toFixed(2) + " MB",
        fecha: new Date().toLocaleDateString("es-MX"),
        archivo: file,
      };

      setArchivos((prev) => ({
        ...prev,
        [documentoCode]: nuevoArchivo,
      }));
    }
  };

  const handleRemoveFile = (documentoCode) => {
    setArchivos((prev) => {
      const nuevos = { ...prev };
      delete nuevos[documentoCode];
      return nuevos;
    });
  };

  const getDocumentosActuales = () => {
    return Array.isArray(documentTypes) ? documentTypes : [];
  };

  const todosDocumentosCubiertos = () => {
    if (!tipoPersona) return false;
    const docs = getDocumentosActuales();
    return docs.every((doc) => {
      if (!doc?.isRequired) return true;
      const code = doc?.code;
      return Boolean(archivos[code] || existingByCode[code]);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tipoPersona) {
      showAlert(
        "warning",
        "Tipo de Persona Requerido",
        "Por favor selecciona el tipo de persona antes de continuar."
      );
      return;
    }

    const docs = getDocumentosActuales();

    // Validar que requeridos estén cubiertos (local o existente)
    const faltantes = docs.filter((doc) => {
      if (!doc?.isRequired) return false;
      const code = doc?.code;
      return !archivos[code] && !existingByCode[code];
    });

    if (faltantes.length > 0) {
      showAlert(
        "error",
        "Documentos Faltantes",
        `Faltan ${faltantes.length} documento(s) por subir:\n\n${faltantes
          .map((doc) => `• ${doc.name}`)
          .join("\n")}`
      );
      return;
    }

    // Armamos FormData
    const fd = new FormData();

    // ✅ IMPORTANTÍSIMO: el backend requiere personType en body
    fd.append("personType", personTypeApi); // "FISICA" | "MORAL"

    let count = 0;
    for (const doc of docs) {
      const code = doc?.code;
      const localFile = archivos[code]?.archivo;
      if (localFile) {
        fd.append(code, localFile); // fieldname == code
        count++;
      }
    }

    if (count === 0) {
      showAlert(
        "warning",
        "Sin cambios",
        "No seleccionaste archivos nuevos para subir. (Ya tienes documentos cargados.)"
      );
      return;
    }

    setSubmitting(true);
    try {
      await DocumentsAPI.uploadMe(fd);

      showAlert(
        "success",
        "Documentos Enviados",
        "Los documentos se han enviado correctamente.\n\nTu información ha sido procesada y estará sujeta a validación."
      );

      // Recargar docs existentes para reflejar status
      await loadTypesAndMe(personTypeApi);

      // Limpia selección local
      setArchivos({});
      setErrors({});
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al subir documentos";
      showAlert("error", "Error al enviar", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">Carga de Documentos</h2>
              <p className="text-midBlue">
                Sube los documentos requeridos según tu tipo de persona
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-lightBlue p-6">
            {/* Selección de Tipo de Persona */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-darkBlue mb-4">Tipo de Persona *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTipoPersonaChange("fisica")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    tipoPersona === "fisica"
                      ? "border-midBlue bg-lightBlue"
                      : "border-lightBlue hover:border-midBlue"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User
                      className={`w-6 h-6 ${
                        tipoPersona === "fisica" ? "text-midBlue" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <h4 className="font-semibold text-darkBlue">Persona Física</h4>
                      <p className="text-sm text-midBlue">Documentos requeridos</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTipoPersonaChange("moral")}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    tipoPersona === "moral"
                      ? "border-midBlue bg-lightBlue"
                      : "border-lightBlue hover:border-midBlue"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building
                      className={`w-6 h-6 ${
                        tipoPersona === "moral" ? "text-midBlue" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <h4 className="font-semibold text-darkBlue">Persona Moral</h4>
                      <p className="text-sm text-midBlue">Documentos requeridos</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Documentos Requeridos */}
            {tipoPersona && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-4">
                  Documentos para {tipoPersona === "fisica" ? "Persona Física" : "Persona Moral"}
                </h3>

                {(loadingTypes || loadingMe) ? (
                  <div className="text-sm text-midBlue">Cargando documentos...</div>
                ) : (
                  <div className="space-y-4">
                    {getDocumentosActuales().map((documento) => {
                      const code = documento.code;
                      const local = archivos[code];
                      const existing = existingByCode[code];

                      const existingName =
                        existing?.fileName ||
                        existing?.originalName ||
                        existing?.storageKey ||
                        "";

                      return (
                        <div key={code} className="border border-lightBlue rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-5 h-5 text-midBlue" />
                                <div>
                                  <span className="font-medium text-darkBlue">{documento.name}</span>
                                  {documento.isRequired && (
                                    <span className="ml-2 text-xs text-red-500">*Requerido</span>
                                  )}
                                </div>
                              </div>

                              {documento.description ? (
                                <p className="text-sm text-midBlue mb-3">{documento.description}</p>
                              ) : null}

                              {local || existing ? (
                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <div>
                                      <span className="font-medium text-darkBlue">
                                        {local ? local.nombre : (existingName || "Documento cargado")}
                                      </span>
                                      <div className="text-xs text-midBlue">
                                        {local
                                          ? `${local.tamaño} • ${local.fecha}`
                                          : existing?.status
                                            ? `Estatus: ${existing.status}`
                                            : "Ya cargado"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {local ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFile(code)}
                                        className="text-red-500 hover:text-red-700 transition text-sm flex items-center gap-1"
                                      >
                                        <X className="w-4 h-4" />
                                        Remover
                                      </button>
                                    ) : null}

                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        className="hidden"
                                        id={`update-${code}`}
                                        accept=".pdf"
                                        onChange={(e) => handleFileUpload(e, code)}
                                      />
                                      <div className="flex items-center space-x-1 px-3 py-1 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition text-sm">
                                        <Upload className="w-4 h-4" />
                                        <span>{existing ? "Reemplazar" : "Actualizar"}</span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                                    errors[code]
                                      ? "border-red-500 bg-red-50"
                                      : "border-lightBlue hover:border-midBlue"
                                  }`}
                                >
                                  <Upload className="w-6 h-6 text-midBlue mx-auto mb-2" />
                                  <p className="text-sm text-darkBlue mb-2">
                                    Haz clic para subir el documento en PDF
                                  </p>
                                  <p className="text-xs text-midBlue mb-2">
                                    Máximo 10MB - Solo archivos PDF
                                  </p>
                                  <input
                                    type="file"
                                    className="hidden"
                                    id={`upload-${code}`}
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(e, code)}
                                  />
                                  <label
                                    htmlFor={`upload-${code}`}
                                    className="inline-block px-4 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition cursor-pointer text-sm"
                                  >
                                    Seleccionar Archivo
                                  </label>
                                  {errors[code] && (
                                    <p className="text-red-500 text-xs mt-2">{errors[code]}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Resumen de Documentos Subidos */}
            {tipoPersona && (Object.keys(archivos).length > 0 || Object.keys(existingByCode).length > 0) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-4">Resumen de Documentos</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-darkBlue">
                    <strong>{Object.keys(archivos).length + Object.keys(existingByCode).length}</strong> de{" "}
                    <strong>{getDocumentosActuales().filter((d) => d.isRequired).length}</strong>{" "}
                    documentos requeridos cubiertos
                  </p>
                  {todosDocumentosCubiertos() && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      ✓ Todos los documentos requeridos han sido subidos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botón Enviar */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-lightBlue">
              <button
                type="submit"
                disabled={!tipoPersona || !todosDocumentosCubiertos() || submitting}
                className={`px-6 py-2 rounded-lg transition ${
                  tipoPersona && todosDocumentosCubiertos() && !submitting
                    ? "bg-midBlue text-white hover:bg-darkBlue"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {submitting ? "Enviando..." : "Enviar Documentos"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Alert />
    </div>
  );
};

export default DocumentosPro;
