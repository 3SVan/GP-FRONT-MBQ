// src/pages/provider/DocumentosPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  User,
  Building,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentsAPI } from "../../api/documents.api";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";
import SystemAlert from "../../components/ui/SystemAlert.jsx";
import StatusBadge, {
  statusToneFromText,
} from "../../components/ui/StatusBadge.jsx";

const DocumentosPro = () => {
  const navigate = useNavigate();

  const [tipoPersona, setTipoPersona] = useState("");
  const [archivos, setArchivos] = useState({});
  const [errors, setErrors] = useState({});

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const [documentTypes, setDocumentTypes] = useState([]);
  const [existingDocs, setExistingDocs] = useState([]);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingMe, setLoadingMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (
    type,
    title,
    message,
    showConfirm = false,
    onConfirm = null,
  ) => {
    setAlertConfig({
      type,
      title,
      message,
      showConfirm,
      onConfirm,
    });
    setAlertOpen(true);
  };

  const closeAlert = () => {
    setAlertOpen(false);

    if (alertConfig.type === "success") {
      setArchivos({});
      setErrors({});
    }
  };

  const personTypeApi = useMemo(() => {
    if (tipoPersona === "fisica") return "FISICA";
    if (tipoPersona === "moral") return "MORAL";
    return "";
  }, [tipoPersona]);

  const existingByCode = useMemo(() => {
    const map = {};
    for (const d of existingDocs || []) {
      const code = d?.documentType?.code;
      if (code) map[code] = d;
    }
    return map;
  }, [existingDocs]);

  const requiredCodes = useMemo(() => {
    return (Array.isArray(documentTypes) ? documentTypes : [])
      .filter((d) => d?.isRequired)
      .map((d) => d.code)
      .filter(Boolean);
  }, [documentTypes]);

  const isLocked = useMemo(() => {
    if (!tipoPersona) return false;
    if (requiredCodes.length === 0) return false;
    return requiredCodes.every((code) => Boolean(existingByCode[code]));
  }, [tipoPersona, requiredCodes, existingByCode]);

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
    if (isLocked) return;

    const file = event.target.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        setErrors((prev) => ({
          ...prev,
          [documentoCode]: "Solo se permiten archivos PDF",
        }));
        return;
      }

      if (file.size > 30 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [documentoCode]: "El archivo no puede ser mayor a 30MB" }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        [documentoCode]: null,
      }));

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
    if (isLocked) return;

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

    if (isLocked) return;

    if (!tipoPersona) {
      showAlert(
        "warning",
        "Tipo de persona requerido",
        "Por favor selecciona el tipo de persona antes de continuar.",
      );
      return;
    }

    const docs = getDocumentosActuales();
    const faltantes = docs.filter((doc) => {
      if (!doc?.isRequired) return false;
      const code = doc?.code;
      return !archivos[code] && !existingByCode[code];
    });

    if (faltantes.length > 0) {
      showAlert(
        "error",
        "Documentos faltantes",
        `Faltan ${faltantes.length} documento(s) por subir:\n\n${faltantes
          .map((doc) => `• ${doc.name}`)
          .join("\n")}`,
      );
      return;
    }

    const fd = new FormData();
    fd.append("personType", personTypeApi);

    let count = 0;
    for (const doc of docs) {
      const code = doc?.code;
      const localFile = archivos[code]?.archivo;
      if (localFile) {
        fd.append(code, localFile);
        count++;
      }
    }

    if (count === 0) {
      showAlert(
        "warning",
        "Sin cambios",
        "No seleccionaste archivos nuevos para subir. Ya tienes documentos cargados.",
      );
      return;
    }

    setSubmitting(true);

    try {
      await DocumentsAPI.uploadMe(fd);

      showAlert(
        "success",
        "Documentos enviados",
        "Los documentos se han enviado correctamente.\n\nTu información ha sido procesada y estará sujeta a validación.",
      );

      await loadTypesAndMe(personTypeApi);
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

  const loadingDocuments = tipoPersona && (loadingTypes || loadingMe);

  if (loadingDocuments && getDocumentosActuales().length === 0) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando documentos..."
          subtitle="Estamos preparando los documentos requeridos para tu tipo de persona."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Carga de documentos"
        subtitle="Sube los documentos requeridos según tu tipo de persona."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Tipo de persona *
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleTipoPersonaChange("fisica")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${tipoPersona === "fisica"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-400"
                }`}
            >
              <div className="flex items-center gap-3">
                <User
                  className={`h-6 w-6 ${tipoPersona === "fisica"
                      ? "text-blue-600"
                      : "text-gray-400"
                    }`}
                />
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Persona física
                  </h4>
                  <p className="text-sm text-gray-500">
                    Documentos requeridos
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTipoPersonaChange("moral")}
              className={`rounded-lg border-2 p-4 text-left transition-all ${tipoPersona === "moral"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-400"
                }`}
            >
              <div className="flex items-center gap-3">
                <Building
                  className={`h-6 w-6 ${tipoPersona === "moral"
                      ? "text-blue-600"
                      : "text-gray-400"
                    }`}
                />
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Persona moral
                  </h4>
                  <p className="text-sm text-gray-500">
                    Documentos requeridos
                  </p>
                </div>
              </div>
            </button>
          </div>
        </SectionCard>

        {tipoPersona ? (
          <SectionCard className="p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Documentos para{" "}
              {tipoPersona === "fisica" ? "Persona física" : "Persona moral"}
            </h3>

            <p className="mb-4 text-sm text-gray-500">
              {isLocked
                ? "Ya has enviado todos los documentos requeridos. Este apartado está bloqueado."
                : "Selecciona solo archivos PDF válidos para cada documento. Puedes actualizar o remover archivos antes de enviar."}
            </p>

            {loadingDocuments ? (
              <div className="py-8">
                <LoadingState
                  compact
                  title="Cargando documentos..."
                  subtitle="Estamos consultando tus requisitos y documentos existentes."
                />
              </div>
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
                    <div
                      key={code}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-800">
                                {documento.name}
                              </span>
                              {documento.isRequired ? (
                                <span className="ml-2 text-xs text-red-500">
                                  *Requerido
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {documento.description ? (
                            <p className="mb-3 text-sm text-gray-500">
                              {documento.description}
                            </p>
                          ) : null}

                          {code === "CONTRATO" ? (
                            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                              <p className="text-sm font-medium text-amber-800">
                                Este contrato debe de ir firmado por ambas partes o en su caso por el
                                proveedor de una manera correcta.
                              </p>
                            </div>
                          ) : null}

                          {local || existing ? (
                            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <div>
                                  <span className="font-medium text-gray-800">
                                    {local
                                      ? local.nombre
                                      : existingName || "Documento cargado"}
                                  </span>

                                  <div className="text-xs text-gray-500">
                                    {local
                                      ? `${local.tamaño} • ${local.fecha}`
                                      : existing?.status
                                        ? `Estatus: ${existing.status}`
                                        : "Ya cargado"}
                                  </div>
                                </div>
                              </div>

                              {!isLocked ? (
                                <div className="flex items-center gap-2">
                                  {local ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(code)}
                                      className="flex items-center gap-1 text-sm text-red-500 transition hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                      Remover
                                    </button>
                                  ) : null}

                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      className="hidden"
                                      id={`update-${code}`}
                                      accept=".pdf"
                                      onChange={(e) =>
                                        handleFileUpload(e, code)
                                      }
                                    />
                                    <div className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700">
                                      <Upload className="h-4 w-4" />
                                      <span>
                                        {existing ? "Reemplazar" : "Actualizar"}
                                      </span>
                                    </div>
                                  </label>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div
                              className={`rounded-lg border-2 border-dashed p-4 text-center transition ${errors[code]
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300 hover:border-blue-500"
                                }`}
                            >
                              <Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-700">
                                Haz clic para subir el documento en PDF
                              </p>
                              <p className="mb-2 text-xs text-gray-500">
                                Máximo 10MB - Solo archivos PDF
                              </p>

                              {!isLocked ? (
                                <>
                                  <input
                                    type="file"
                                    className="hidden"
                                    id={`upload-${code}`}
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(e, code)}
                                  />
                                  <label
                                    htmlFor={`upload-${code}`}
                                    className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
                                  >
                                    Seleccionar archivo
                                  </label>
                                </>
                              ) : (
                                <p className="mt-2 text-xs text-gray-500">
                                  Este apartado está bloqueado porque ya enviaste
                                  tus documentos.
                                </p>
                              )}

                              {errors[code] ? (
                                <p className="mt-2 text-xs text-red-500">
                                  {errors[code]}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        ) : null}

        {tipoPersona &&
          (Object.keys(archivos).length > 0 ||
            Object.keys(existingByCode).length > 0) ? (
          <SectionCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Resumen de documentos
            </h3>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-800">
                <strong>
                  {Object.keys(archivos).length + Object.keys(existingByCode).length}
                </strong>{" "}
                de{" "}
                <strong>
                  {getDocumentosActuales().filter((d) => d.isRequired).length}
                </strong>{" "}
                documentos requeridos cubiertos
              </p>

              {todosDocumentosCubiertos() ? (
                <p className="mt-2 text-sm font-medium text-green-600">
                  ✓ Todos los documentos requeridos han sido cubiertos
                </p>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        <div className="flex justify-end border-t border-gray-200 pt-4">
          {isLocked ? (
            <div className="text-sm font-medium text-gray-500">
              Documentos enviados. Este apartado está bloqueado.
            </div>
          ) : (
            <button
              type="submit"
              disabled={!tipoPersona || !todosDocumentosCubiertos() || submitting}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition ${tipoPersona && todosDocumentosCubiertos() && !submitting
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
            >
              {submitting ? (
                <InlineLoading text="Enviando..." className="text-white" />
              ) : (
                "Enviar documentos"
              )}
            </button>
          )}
        </div>
      </form>

      <SystemAlert
        open={alertOpen}
        onClose={closeAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
        acceptText="Aceptar"
      />
    </div>
  );
};

export default DocumentosPro;