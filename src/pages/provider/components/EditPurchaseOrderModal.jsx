// src/pages/provider/components/EditPurchaseOrderModal.jsx
import React, { useMemo, useRef } from "react";
import { X, FileText } from "lucide-react";
import UploadCard from "./UploadCard";

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

  const orderFilesUI =
    (currentFiles?.orderFiles || []).filter((f) => !form?.ocPdfRemoved);

  const invoicePdfUI =
    (currentFiles?.invoicePdfFiles || []).filter(
      (f) => !(form?.removedInvoicePdfNames || []).includes(f.name)
    );

  const invoiceXmlUI =
    (currentFiles?.invoiceXmlFiles || []).filter(
      (f) => !(form?.removedInvoiceXmlNames || []).includes(f.name)
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-[95vw] max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl">
        <div className="px-5 py-3 border-b border-lightBlue flex items-center justify-between sticky top-0 z-10 bg-darkBlue">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-base font-semibold text-white">Editar orden</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-5 bg-white max-h-[calc(85vh-60px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-midBlue mb-2">
                Número de Orden
              </label>
              <input
                value={form.number || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, number: e.target.value }))
                }
                className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                placeholder="OC-000123"
                disabled
                title="El número no se edita aquí"
              />
            </div>

            <div>
              <label className="block text-sm text-midBlue mb-2">Monto</label>
              <input
                value={form.total || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    total: e.target.value.replace(/[^\d.]/g, ""),
                  }))
                }
                className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                placeholder="1000.00"
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="block text-sm text-midBlue mb-2">Fecha</label>
              <div className="relative">
                <input
                  type="date"
                  value={form.date || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full border rounded-2xl px-4 py-2.5  outline-none focus:ring-2 focus:ring-lightBlue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-midBlue mb-2">RFC</label>
              <input
                value={form.rfc || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rfc: e.target.value.toUpperCase() }))
                }
                className="w-full border rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-lightBlue"
                placeholder="XAXX010101000"
                maxLength={13}
                disabled
                title="El RFC no se edita aquí"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-midBlue mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                value={form.observaciones || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, observaciones: e.target.value }))
                }
                className="w-full border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lightBlue min-h-[90px]"
                placeholder="Notas..."
              />
            </div>
          </div>

          {/* Inputs hidden */}
          <input
            ref={ocInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => onPickFile?.("ocPdfFile", e.target.files?.[0], "pdf")}
          />

          <input
            ref={facPdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) =>
              onPickMany?.("facturaPdfFiles", Array.from(e.target.files || []), "pdf")
            }
          />

          <input
            ref={facXmlInputRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            multiple
            className="hidden"
            onChange={(e) =>
              onPickMany?.("facturaXmlFiles", Array.from(e.target.files || []), "xml")
            }
          />

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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
                const f = invoicePdfUI[idx];
                if (!f?.name) return;
                setForm((p) => ({
                  ...p,
                  removedInvoicePdfNames: Array.from(
                    new Set([...(p.removedInvoicePdfNames || []), f.name])
                  ),
                }));
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
                const f = invoiceXmlUI[idx];
                if (!f?.name) return;
                setForm((p) => ({
                  ...p,
                  removedInvoiceXmlNames: Array.from(
                    new Set([...(p.removedInvoiceXmlNames || []), f.name])
                  ),
                }));
              }}
              maxMb={maxMb}
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border hover:bg-lightBlue transition text-sm font-semibold"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
                canSave
                  ? "bg-darkBlue text-white hover:opacity-90"
                  : "opacity-40 cursor-not-allowed bg-gray-100 text-gray-500 border"
              }`}
              title={!canSave ? "Completa Monto y Fecha" : "Guardar cambios"}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}