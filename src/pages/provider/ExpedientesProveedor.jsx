// src/pages/provider/ExpedientesProveedor.jsx
import React from "react";

import { useExpedientesProveedor } from "./expedientes/useExpedientesProveedor";
import { useEditPurchaseOrder } from "./expedientes/useEditPurchaseOrder";

import ExpedientesTable from "./components/ExpedientesTable";
import EditPurchaseOrderModal from "./components/EditPurchaseOrderModal";
import ConfirmActionModal from "./components/ConfirmActionModal";

export default function ExpedientesProveedor({ showAlert }) {
  // =========================
  // DATA + ACCIONES (tabla)
  // =========================
  const {
    visibleRows,
    loading,
    reload,

    canEdit,
    canSubmit,
    canDelete,

    submitRow,
    deleteRow,

    viewPurchaseOrderPdf,
    downloadPurchaseOrderPdf,
    viewInvoicePdf,
    downloadInvoicePdf,
    viewInvoiceXml,
    downloadInvoiceXml,
  } = useExpedientesProveedor({ showAlert });

  // =========================
  // MODAL EDICIÓN
  // =========================
  const edit = useEditPurchaseOrder({
    showAlert,
    maxMb: 10,

    onViewPurchaseOrderPdf: viewPurchaseOrderPdf,
    onViewInvoicePdf: viewInvoicePdf,
    onViewInvoiceXml: viewInvoiceXml,

    onSaved: reload,
  });

  const handleEdit = (row) => {
    if (!canEdit(row)) {
      showAlert?.(
        "warning",
        "No editable",
        "Solo puedes editar órdenes en estado Pendiente.",
      );
      return;
    }
    edit.openForRow(row);
  };

  // =========================
  // ✅ CONFIRM SUBMIT (verde)
  // =========================
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitTarget, setSubmitTarget] = React.useState(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  const requestSubmit = (row) => {
    if (!canSubmit(row)) {
      showAlert?.(
        "warning",
        "No permitido",
        "Solo puedes enviar órdenes en estado Pendiente.",
      );
      return;
    }
    setSubmitTarget(row);
    setSubmitOpen(true);
  };

  const cancelSubmit = () => {
    setSubmitOpen(false);
    setSubmitTarget(null);
    setSubmitLoading(false);
  };

  const confirmSubmit = async () => {
    if (!submitTarget) return;

    try {
      setSubmitLoading(true);
      await submitRow(submitTarget);
      cancelSubmit();
    } catch {
      setSubmitLoading(false);
    }
  };

  // =========================
  // ✅ CONFIRM DELETE (rojo)
  // =========================
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const requestDelete = (row) => {
    if (!canDelete(row)) {
      showAlert?.(
        "warning",
        "No permitido",
        "No puedes eliminar porque la orden ya fue enviada o finalizada.",
      );
      return;
    }
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const cancelDelete = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      await deleteRow(deleteTarget);
      cancelDelete();
    } catch {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-beige min-h-[70vh]">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-darkBlue">
          Expedientes Digitales
        </h2>
        <p className="text-midBlue mt-1">
          Órdenes: solo PDF. Facturas: PDF y XML.
        </p>

        {/* ====== TABLA ====== */}
        <ExpedientesTable
          loading={loading}
          rows={visibleRows}
          canEdit={canEdit}
          canSubmit={canSubmit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onSubmit={requestSubmit} // ✅ ahora abre confirm verde
          onDelete={requestDelete} // ✅ ahora abre confirm rojo

          onViewPurchaseOrderPdf={viewPurchaseOrderPdf}
          onDownloadPurchaseOrderPdf={downloadPurchaseOrderPdf}

          onViewInvoicePdf={viewInvoicePdf}
          onDownloadInvoicePdf={downloadInvoicePdf}

          onViewInvoiceXml={viewInvoiceXml}
          onDownloadInvoiceXml={downloadInvoiceXml}
        />
      </div>

      {/* ====== MODAL EDITAR ====== */}
      <EditPurchaseOrderModal
        open={edit.open}
        row={edit.selectedRow}
        form={edit.form}
        setForm={edit.setForm}
        currentFiles={edit.currentFiles}
        onClose={edit.close}
        onSave={edit.save}
        onPickFile={edit.onPickFile}
        onPickMany={edit.onPickMany}     // ✅
        removeAt={edit.removeAt}         // ✅
        maxMb={edit.maxMb}
      />

      {/* ====== CONFIRM SUBMIT (verde estilo screenshot) ====== */}
      <ConfirmActionModal
        open={submitOpen}
        variant="success"
        title="Enviar a validación"
        message={`¿Deseas enviar la orden ${
          submitTarget?.purchaseOrder?.number || "-"
        } a validación?`}
        cancelText="Cancelar"
        confirmText="Aceptar"
        onCancel={cancelSubmit}
        onConfirm={confirmSubmit}
        loading={submitLoading}
        showCancel
      />

      {/* ====== CONFIRM DELETE (rojo mismo layout) ====== */}
      <ConfirmActionModal
        open={deleteOpen}
        variant="danger"
        title="Eliminar orden"
        message={`¿Deseas eliminar la orden ${
          deleteTarget?.purchaseOrder?.number || "-"
        }? Esta acción no se puede deshacer.`}
        cancelText="Cancelar"
        confirmText="Eliminar"
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        showCancel
      />
    </div>
  );
}
