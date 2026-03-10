// src/pages/admin/sat/ActualizacionListaSAT.jsxy
import React, { useState } from "react";
import { Upload, FileSpreadsheet, FileText, Info } from "lucide-react";
import { SatAPI } from "../../../api/sat.api";
import InlineLoading from "../../../components/ui/InlineLoading";
import PageHeader from "../../../components/ui/PageHeader";

function ActualizacionListaSAT({ showAlert }) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [archivoAntiguo, setArchivoAntiguo] = useState(
    "base_datos_original.xlsx",
  );
  const [subiendo, setSubiendo] = useState(false);

  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const extensionesValidas = [".xlsx", ".xls"];
    const extension = archivo.name
      .substring(archivo.name.lastIndexOf("."))
      .toLowerCase();

    if (!extensionesValidas.includes(extension)) {
      showAlert(
        "error",
        "Formato no válido",
        "Solo se aceptan archivos Excel (.xlsx, .xls)",
      );
      setArchivoSeleccionado(null);
      e.target.value = "";
      return;
    }

    const maxMb = 20;
    if (archivo.size > maxMb * 1024 * 1024) {
      showAlert("error", "Archivo muy grande", `Máximo ${maxMb}MB`);
      setArchivoSeleccionado(null);
      e.target.value = "";
      return;
    }

    setArchivoSeleccionado(archivo);
  };

  const subirArchivo = async () => {
    if (!archivoSeleccionado) {
      showAlert(
        "warning",
        "Sin archivo",
        "Por favor, selecciona un archivo Excel primero",
      );
      return;
    }

    setSubiendo(true);

    try {
      const { data } = await SatAPI.importBlacklist(archivoSeleccionado);

      const stats = data?.ok
        ? [
            `Archivo: "${archivoSeleccionado.name}"`,
            `Total leídos: ${data.totalParsed ?? "N/D"}`,
            `Insertados: ${data.inserted ?? "N/D"}`,
            `Únicos: ${data.uniqueRfcs ?? "N/D"}`,
            `Duplicados en archivo: ${data.duplicatesInFile ?? "N/D"}`,
          ].join("\n")
        : `Archivo "${archivoSeleccionado.name}" procesado correctamente.\nBase de datos actualizada.`;

      showAlert("success", "Actualización SAT completada", stats);

      setArchivoAntiguo(archivoSeleccionado.name);
      setArchivoSeleccionado(null);

      const fileInput = document.getElementById("excel-file");
      if (fileInput) fileInput.value = "";
    } catch (err) {
      const msg =
        err?.response?.data?.message || "No se pudo importar la lista SAT";
      const detail = err?.response?.data?.detail;

      showAlert(
        "error",
        "Error al importar",
        detail ? `${msg}\n${detail}` : msg,
      );
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Actualización Lista SAT"
          subtitle="Sube un archivo Excel para actualizar la base de datos del SAT."
        />

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-800">
              Cargar archivo Excel
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              El archivo cargado reemplazará la información anterior.
            </p>
          </div>

          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-800">Archivo actual:</span>{" "}
              {archivoAntiguo}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FileSpreadsheet className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Selecciona un archivo Excel
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Formatos permitidos: .xlsx y .xls
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                  <Upload className="h-4 w-4" />
                  Seleccionar archivo
                  <input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={manejarSeleccionArchivo}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={subirArchivo}
                  disabled={!archivoSeleccionado || subiendo}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
                    !archivoSeleccionado || subiendo
                      ? "cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {subiendo ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Subir archivo
                    </>
                  )}
                </button>
              </div>

              {subiendo && (
                <div className="mt-2">
                  <InlineLoading text="Subiendo y procesando archivo..." />
                </div>
              )}

              {archivoSeleccionado && (
                <div className="w-full max-w-xl rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-left">
                  <p className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <FileSpreadsheet className="h-4 w-4" />
                    Archivo seleccionado: {archivoSeleccionado.name}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Tamaño máximo permitido: 20MB
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-800">
              Instrucciones
            </h3>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                1
              </span>
              <p>Selecciona un archivo Excel válido.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                2
              </span>
              <p>Haz clic en “Subir archivo” para iniciar el proceso.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                3
              </span>
              <p>La base de datos se actualizará con la información del nuevo archivo.</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                4
              </span>
              <p>Verifica que el archivo tenga la estructura esperada antes de cargarlo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActualizacionListaSAT;