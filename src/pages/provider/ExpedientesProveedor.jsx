// src/pages/provider/ExpedientesProveedor.jsx
import React from "react";
import { FileText } from "lucide-react";

import { useExpedientesProveedor } from "./expedientes/useExpedientesProveedor";
import { useEditPurchaseOrder } from "./expedientes/useEditPurchaseOrder";

import ExpedientesTable from "./components/ExpedientesTable";
import EditPurchaseOrderModal from "./components/EditPurchaseOrderModal";
import ConfirmActionModal from "./components/ConfirmActionModal";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

export default function ExpedientesProveedor({ showAlert }) {
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
        "Solo puedes editar órdenes en estado Pendiente."
      );
      return;
    }

    edit.openForRow(row);
  };

  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitTarget, setSubmitTarget] = React.useState(null);
  const [submitLoading, setSubmitLoading] = React.useState(false);

  const requestSubmit = (row) => {
    if (!canSubmit(row)) {
      showAlert?.(
        "warning",
        "No permitido",
        "Solo puedes enviar órdenes en estado Pendiente."
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

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const requestDelete = (row) => {
    if (!canDelete(row)) {
      showAlert?.(
        "warning",
        "No permitido",
        "No puedes eliminar porque la orden ya fue enviada o finalizada."
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

  const totalRows = visibleRows.length;
  const pendientes = visibleRows.filter(
    (row) =>
      String(row?.purchaseOrder?.statusLabel || row?.purchaseOrder?.status || "")
        .toUpperCase() === "PENDIENTE"
  ).length;

  const enviadas = visibleRows.filter((row) => {
    const st = String(
      row?.purchaseOrder?.statusLabel || row?.purchaseOrder?.status || ""
    ).toUpperCase();

    return (
      st === "ENVIADA" ||
      st === "ENVIADO" ||
      st === "SUBMITTED" ||
      st === "EN VALIDACIÓN" ||
      st === "VALIDACION"
    );
  }).length;

  if (loading && totalRows === 0) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando expedientes..."
          subtitle="Estamos consultando tus órdenes de compra y documentos relacionados."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6 min-h-[70vh]">
      <PageHeader
        title="Expedientes Digitales"
        subtitle="Administra órdenes de compra y facturas. Órdenes: solo PDF. Facturas: PDF y XML."
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="neutral">Total: {totalRows}</StatusBadge>
            <StatusBadge tone="warning">Pendientes: {pendientes}</StatusBadge>
            <StatusBadge tone="info">Enviadas: {enviadas}</StatusBadge>
          </div>
        }
      />

      <SectionCard className="p-0 overflow-hidden">
        {totalRows === 0 && !loading ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title="Aún no tienes expedientes registrados"
              subtitle="Cuando existan órdenes de compra y facturas asociadas aparecerán aquí."
            />
          </div>
        ) : (
          <ExpedientesTable
            loading={loading}
            rows={visibleRows}
            canEdit={canEdit}
            canSubmit={canSubmit}
            canDelete={canDelete}
            onEdit={handleEdit}
            onSubmit={requestSubmit}
            onDelete={requestDelete}
            onViewPurchaseOrderPdf={viewPurchaseOrderPdf}
            onDownloadPurchaseOrderPdf={downloadPurchaseOrderPdf}
            onViewInvoicePdf={viewInvoicePdf}
            onDownloadInvoicePdf={downloadInvoicePdf}
            onViewInvoiceXml={viewInvoiceXml}
            onDownloadInvoiceXml={downloadInvoiceXml}
          />
        )}
      </SectionCard>

      <EditPurchaseOrderModal
        open={edit.open}
        row={edit.selectedRow}
        form={edit.form}
        setForm={edit.setForm}
        currentFiles={edit.currentFiles}
        onClose={edit.close}
        onSave={edit.save}
        onPickFile={edit.onPickFile}
        onPickMany={edit.onPickMany}
        removeAt={edit.removeAt}
        maxMb={edit.maxMb}
      />

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