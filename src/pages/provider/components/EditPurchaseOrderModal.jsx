// src/pages/provider/components/EditPurchaseOrderModal.jsx
import React, { useMemo, useRef } from "react";
import {
  X,
  FileText,
  Save,
  CalendarDays,
  AlertTriangle,
  Link2,
} from "lucide-react";
import UploadCard from "./UploadCard";

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-midBlue">{label}</span>
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-darkBlue outline-none transition",
        "focus:border-midBlue focus:ring-2 focus:ring-lightBlue",
        className,
      ].join(" ")}
    />
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-darkBlue outline-none transition",
        "focus:border-midBlue focus:ring-2 focus:ring-lightBlue",
        className,
      ].join(" ")}
    />
  );
}

export default function EditPurchaseOrderModal({
  open,
  row,
  form,
  setForm,
  currentFiles,

  onClose,
  onSave,

  onPickFile,
  onPickMany,
  removeAt,
  maxMb = 10,
}) {
  const ocInputRef = useRef(null);
  const facPdfInputRef = useRef(null);
  const facXmlInputRef = useRef(null);

  const canSave = useMemo(() => {
    if (!row?.id) return false;
    const n = Number(form?.total);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (!form?.date) return false;
    return true;
  }, [row, form]);

  if (!open || !row) return null;

  const orderFilesUI = (currentFiles?.orderFiles || []).filter(
    (f) => !form?.ocPdfRemoved,
  );

  const invoicePdfUI = (currentFiles?.invoicePdfFiles || []).filter(
    (f) => !(form?.removedInvoicePdfNames || []).includes(f.name),
  );

  const invoiceXmlUI = (currentFiles?.invoiceXmlFiles || []).filter(
    (f) => !(form?.removedInvoiceXmlNames || []).includes(f.name),
  );

  const removedPdfCount = (form?.removedInvoicePdfNames || []).length;
  const removedXmlCount = (form?.removedInvoiceXmlNames || []).length;
  const newPdfCount = (form?.facturaPdfFiles || []).length;
  const newXmlCount = (form?.facturaXmlFiles || []).length;

  const showInvoiceWarning =
    removedPdfCount > 0 ||
    removedXmlCount > 0 ||
    newPdfCount > 0 ||
    newXmlCount > 0;

  const hasMismatch =
    removedPdfCount !== removedXmlCount ||
    ((newPdfCount > 0 || newXmlCount > 0) && newPdfCount !== newXmlCount);

  const markInvoicePairRemoved = (idx) => {
    const pdfFile = invoicePdfUI[idx];
    const xmlFile = invoiceXmlUI[idx];

    setForm((p) => ({
      ...p,
      removedInvoicePdfNames: pdfFile?.name
        ? Array.from(
            new Set([...(p.removedInvoicePdfNames || []), pdfFile.name]),
          )
        : p.removedInvoicePdfNames || [],
      removedInvoiceXmlNames: xmlFile?.name
        ? Array.from(
            new Set([...(p.removedInvoiceXmlNames || []), xmlFile.name]),
          )
        : p.removedInvoiceXmlNames || [],
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-1000/20 backdrop-blur-[3px]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between gap-4 bg-darkBlue px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-2xl font-bold leading-tight">Editar orden</h3>
              <p className="mt-1 text-sm text-white/75">
                Actualiza la información y reemplaza los archivos necesarios.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl p-2 transition hover:bg-white/10"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-beige px-6 py-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-lightBlue bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Orden seleccionada</p>
                  <p className="text-lg font-semibold text-darkBlue">
                    {row?.purchaseOrder?.number || form?.number || "Sin número"}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <CalendarDays className="h-4 w-4" />
                  Editable por proveedor
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-lightBlue bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-darkBlue">
                  Información de la orden
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Verifica los datos antes de guardar los cambios.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Número de Orden">
                  <Input
                    value={form.number || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, number: e.target.value }))
                    }
                    placeholder="OC-000123"
                    disabled
                    title="El número no se edita aquí"
                  />
                </Field>

                <Field label="Monto">
                  <Input
                    value={form.total || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        total: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    placeholder="1000.00"
                    inputMode="decimal"
                  />
                </Field>

                <Field label="Fecha">
                  <Input
                    type="date"
                    value={form.date || ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                  />
                </Field>

                <Field label="RFC">
                  <Input
                    value={form.rfc || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        rfc: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="XAXX010101000"
                    maxLength={13}
                    disabled
                    title="El RFC no se edita aquí"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Observaciones (opcional)">
                    <Textarea
                      value={form.observaciones || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          observaciones: e.target.value,
                        }))
                      }
                      className="min-h-[110px]"
                      placeholder="Notas..."
                    />
                  </Field>
                </div>
              </div>
            </div>

            <input
              ref={ocInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) =>
                onPickFile?.("ocPdfFile", e.target.files?.[0], "pdf")
              }
            />

            <input
              ref={facPdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) =>
                onPickMany?.(
                  "facturaPdfFiles",
                  Array.from(e.target.files || []),
                  "pdf",
                )
              }
            />

            <input
              ref={facXmlInputRef}
              type="file"
              accept=".xml,application/xml,text/xml"
              multiple
              className="hidden"
              onChange={(e) =>
                onPickMany?.(
                  "facturaXmlFiles",
                  Array.from(e.target.files || []),
                  "xml",
                )
              }
            />

            <div className="rounded-2xl border border-lightBlue bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-darkBlue">
                  Archivos del expediente
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Orden: solo PDF. Facturas: PDF y XML. Máximo {maxMb}MB por
                  archivo.
                </p>
              </div>

              {showInvoiceWarning ? (
                <div
                  className={`rounded-2xl px-6 py-2 mb-4 shadow-sm ${
                    hasMismatch
                      ? "border border-amber-200 bg-amber-50"
                      : "border border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ${
                        hasMismatch
                          ? "text-amber-600 ring-amber-200"
                          : "text-blue-600 ring-blue-200"
                      }`}
                    >
                      {hasMismatch ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <Link2 className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          hasMismatch ? "text-amber-800" : "text-blue-800"
                        }`}
                      >
                        {hasMismatch
                          ? "Factura pendiente de completarse"
                          : "Las facturas se reemplazan en pareja"}
                      </p>

                      <p
                        className={`mt-1 text-sm ${
                          hasMismatch ? "text-amber-700" : "text-blue-700"
                        }`}
                      >
                        Si eliminas un PDF o XML de factura, también debe
                        reemplazarse su archivo relacionado. Cada factura debe
                        conservar siempre su par: <strong>PDF + XML</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
                <UploadCard
                  typeLabel="Orden (PDF)"
                  title="Haz clic para reemplazar la orden en PDF"
                  acceptLabel="PDF"
                  onPick={() => ocInputRef.current?.click()}
                  newFileName={form.ocPdfFile?.name || ""}
                  required={false}
                  currentFilesList={orderFilesUI}
                  onRemoveCurrentAt={() => {
                    setForm((p) => ({
                      ...p,
                      ocPdfRemoved: true,
                    }));
                  }}
                  maxMb={maxMb}
                />

                <UploadCard
                  typeLabel="Factura en PDF"
                  title="Haz clic para subir una o varias facturas en PDF"
                  acceptLabel="PDF"
                  onPick={() => facPdfInputRef.current?.click()}
                  newFiles={form.facturaPdfFiles || []}
                  onRemoveNewAt={(idx) => removeAt?.("facturaPdfFiles", idx)}
                  required={false}
                  currentFilesList={invoicePdfUI}
                  onRemoveCurrentAt={(idx) => {
                    markInvoicePairRemoved(idx);
                  }}
                  maxMb={maxMb}
                />

                <UploadCard
                  typeLabel="Factura en XML"
                  title="Haz clic para subir uno o varios XML de facturas"
                  acceptLabel="XML"
                  onPick={() => facXmlInputRef.current?.click()}
                  newFiles={form.facturaXmlFiles || []}
                  onRemoveNewAt={(idx) => removeAt?.("facturaXmlFiles", idx)}
                  required={false}
                  currentFilesList={invoiceXmlUI}
                  onRemoveCurrentAt={(idx) => {
                    markInvoicePairRemoved(idx);
                  }}
                  maxMb={maxMb}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-lightBlue bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Guarda los cambios solo cuando hayas verificado la información y
              los archivos.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={!canSave}
                className={`inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition ${
                  canSave
                    ? "bg-darkBlue text-white hover:opacity-90"
                    : "cursor-not-allowed border bg-gray-100 text-gray-500 opacity-40"
                }`}
                title={!canSave ? "Completa Monto y Fecha" : "Guardar cambios"}
              >
                <Save className="h-4 w-4" />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
