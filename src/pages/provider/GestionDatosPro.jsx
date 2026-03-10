// src/pages/provider/GestionDatosPro.jsx
import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { ProvidersAPI } from "../../api/providers.api";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import InlineLoading from "../../components/ui/InlineLoading.jsx";
import SystemAlert from "../../components/ui/SystemAlert.jsx";

const GestionDatosPro = ({ onClose }) => {
  const [formData, setFormData] = useState({
    razonSocial: "",
    rfc: "",
    domicilioFiscal: "",

    nombreContacto: "",
    cargo: "",
    correo: "",
    telefono: "",
    direccionEntrega: "",

    cuentaClabe: "",
    banco: "",

    bankAccountId: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validations = {
    razonSocial: (value) => {
      if (!value) return "La razón social es obligatoria";
      if (value.length < 3) {
        return "La razón social debe tener al menos 3 caracteres";
      }
      return null;
    },

    rfc: (value) => {
      if (!value) return "El RFC es obligatorio";
      const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(value)) return "Formato de RFC inválido";
      return null;
    },

    domicilioFiscal: (value) => {
      if (!value) return "El domicilio fiscal es obligatorio";
      if (value.length < 10) {
        return "El domicilio fiscal debe ser más específico";
      }
      return null;
    },

    nombreContacto: (value) => {
      if (!value) return "El nombre de contacto es obligatorio";
      if (value.length < 3) {
        return "El nombre debe tener al menos 3 caracteres";
      }
      return null;
    },

    cargo: (value) => {
      if (!value) return "El cargo es obligatorio";
      return null;
    },

    correo: (value) => {
      if (!value) return "El correo electrónico es obligatorio";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Formato de correo inválido";
      return null;
    },

    telefono: (value) => {
      if (!value) return "El teléfono es obligatorio";
      const phoneRegex = /^[\d\s\+\-\(\)]{10,15}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ""))) {
        return "Formato de teléfono inválido";
      }
      return null;
    },

    direccionEntrega: (value) => {
      if (!value) return "La dirección de entrega es obligatoria";
      if (value.length < 10) {
        return "La dirección de entrega debe ser más específica";
      }
      return null;
    },

    cuentaClabe: (value) => {
      if (!value) return "La CLABE es obligatoria";
      const clabeRegex = /^\d{18}$/;
      if (!clabeRegex.test(value.replace(/\s/g, ""))) {
        return "La CLABE debe tener 18 dígitos";
      }
      return null;
    },

    banco: (value) => {
      if (!value) return "El banco es obligatorio";
      if (value.length < 3) {
        return "El nombre del banco debe tener al menos 3 caracteres";
      }
      return null;
    },
  };

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
    const shouldCloseParent = alertConfig.type === "success" && typeof onClose === "function";
    const confirmFn = alertConfig.onConfirm;

    setAlertOpen(false);
    setAlertConfig({
      type: "info",
      title: "",
      message: "",
      showConfirm: false,
      onConfirm: null,
    });

    if (typeof confirmFn === "function") {
      confirmFn();
    }

    if (shouldCloseParent) {
      onClose();
    }
  };

  useEffect(() => {
    let alive = true;

    const loadMe = async () => {
      setLoading(true);

      try {
        const res = await ProvidersAPI.me();
        const data = res?.data;

        if (!alive) return;

        setFormData((prev) => ({
          ...prev,
          razonSocial: data?.businessName || "",
          rfc: (data?.rfc || "").toUpperCase(),
          domicilioFiscal: data?.fiscalAddress || "",

          nombreContacto: data?.fullName || "",
          cargo: data?.contactPosition || "",
          correo: data?.email || "",
          telefono: data?.phone || "",
          direccionEntrega: data?.deliveryAddress || "",

          cuentaClabe: data?.clabe || "",
          banco: data?.bankName || "",
          bankAccountId: data?.bankAccountId ?? null,
        }));
      } catch (err) {
        if (!alive) return;

        showAlert(
          "error",
          "No se pudo cargar tu información",
          err?.message || "¿Sesión expirada o proveedor no encontrado?",
        );
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadMe();

    return () => {
      alive = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (touched[field]) {
      const error = validations[field](value);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    const error = validations[field](formData[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const getFieldStatus = (field) => {
    if (!touched[field]) return "untouched";
    if (errors[field]) return "error";
    return "valid";
  };

  const renderFieldIcon = (field) => {
    const status = getFieldStatus(field);

    switch (status) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getInputClass = (field) => {
    const status = getFieldStatus(field);

    if (status === "error") {
      return "w-full rounded-lg border border-red-500 bg-white px-3 py-2.5 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500";
    }

    if (status === "valid") {
      return "w-full rounded-lg border border-green-500 bg-white px-3 py-2.5 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";
    }

    return "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "bankAccountId") allTouched[key] = true;
    });
    setTouched(allTouched);

    const newErrors = {};
    const fieldsToValidate = [
      "razonSocial",
      "rfc",
      "domicilioFiscal",
      "nombreContacto",
      "cargo",
      "correo",
      "telefono",
      "direccionEntrega",
      "cuentaClabe",
      "banco",
    ];

    fieldsToValidate.forEach((key) => {
      const error = validations[key](formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showAlert(
        "error",
        "Error en el formulario",
        `Hay ${Object.keys(newErrors).length} campo(s) que requieren atención. Por favor, revisa la información ingresada.`,
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        businessName: formData.razonSocial.trim(),
        rfc: formData.rfc.trim().toUpperCase(),
        fiscalAddress: formData.domicilioFiscal.trim(),

        fullName: formData.nombreContacto.trim(),
        contactPosition: formData.cargo.trim(),
        phone: formData.telefono.trim(),

        clabe: formData.cuentaClabe.replace(/\s/g, "").trim(),
        bankName: formData.banco.trim(),
        bankAccountId: formData.bankAccountId ?? null,
      };

      await ProvidersAPI.updateMe(payload);

      showAlert(
        "success",
        "Datos guardados",
        "Los datos del proveedor se han guardado correctamente.",
      );
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudieron guardar los cambios. Intenta de nuevo.";

      showAlert("error", "No se pudo guardar", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-beige px-6 py-6">
        <LoadingState
          title="Cargando datos del proveedor..."
          subtitle="Estamos preparando tu información fiscal, de contacto y bancaria."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Gestión de datos del proveedor"
        subtitle="Administra la información de tu empresa."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard className="p-6">
          <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
            Datos fiscales
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre o razón social *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.razonSocial}
                  onChange={(e) =>
                    handleChange("razonSocial", e.target.value)
                  }
                  onBlur={() => handleBlur("razonSocial")}
                  className={getInputClass("razonSocial")}
                  placeholder="Ingresa la razón social de la empresa"
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("razonSocial")}
                </div>
              </div>
              {errors.razonSocial && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.razonSocial}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                RFC *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.rfc}
                  onChange={(e) =>
                    handleChange("rfc", e.target.value.toUpperCase())
                  }
                  onBlur={() => handleBlur("rfc")}
                  className={getInputClass("rfc")}
                  placeholder="Ej: ABC123456789"
                  maxLength={13}
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("rfc")}
                </div>
              </div>
              {errors.rfc && (
                <p className="mt-1 text-xs text-red-500">{errors.rfc}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Domicilio fiscal *
              </label>
              <div className="relative">
                <textarea
                  value={formData.domicilioFiscal}
                  onChange={(e) =>
                    handleChange("domicilioFiscal", e.target.value)
                  }
                  onBlur={() => handleBlur("domicilioFiscal")}
                  rows={3}
                  className={getInputClass("domicilioFiscal")}
                  placeholder="Calle, número, colonia, ciudad, estado, código postal"
                  disabled={saving}
                />
                <div className="absolute right-3 top-3">
                  {renderFieldIcon("domicilioFiscal")}
                </div>
              </div>
              {errors.domicilioFiscal && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.domicilioFiscal}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
            Datos de contacto
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre completo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.nombreContacto}
                  onChange={(e) =>
                    handleChange("nombreContacto", e.target.value)
                  }
                  onBlur={() => handleBlur("nombreContacto")}
                  className={getInputClass("nombreContacto")}
                  placeholder="Nombre del contacto principal"
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("nombreContacto")}
                </div>
              </div>
              {errors.nombreContacto && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.nombreContacto}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cargo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => handleChange("cargo", e.target.value)}
                  onBlur={() => handleBlur("cargo")}
                  className={getInputClass("cargo")}
                  placeholder="Ej: Gerente de Ventas"
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("cargo")}
                </div>
              </div>
              {errors.cargo && (
                <p className="mt-1 text-xs text-red-500">{errors.cargo}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Correo electrónico *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleChange("correo", e.target.value)}
                  onBlur={() => handleBlur("correo")}
                  className={getInputClass("correo")}
                  placeholder="correo@empresa.com"
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("correo")}
                </div>
              </div>
              {errors.correo && (
                <p className="mt-1 text-xs text-red-500">{errors.correo}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Teléfono *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  onBlur={() => handleBlur("telefono")}
                  className={getInputClass("telefono")}
                  placeholder="+52 55 1234 5678"
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("telefono")}
                </div>
              </div>
              {errors.telefono && (
                <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Dirección de entrega *
              </label>
              <div className="relative">
                <textarea
                  value={formData.direccionEntrega}
                  onChange={(e) =>
                    handleChange("direccionEntrega", e.target.value)
                  }
                  onBlur={() => handleBlur("direccionEntrega")}
                  rows={3}
                  className={getInputClass("direccionEntrega")}
                  placeholder="Dirección completa para recibir mercancía"
                  disabled={saving}
                />
                <div className="absolute right-3 top-3">
                  {renderFieldIcon("direccionEntrega")}
                </div>
              </div>
              {errors.direccionEntrega && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.direccionEntrega}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-6">
          <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
            Datos bancarios
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cuenta CLABE *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cuentaClabe}
                  onChange={(e) =>
                    handleChange(
                      "cuentaClabe",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  onBlur={() => handleBlur("cuentaClabe")}
                  className={getInputClass("cuentaClabe")}
                  placeholder="18 dígitos"
                  maxLength={18}
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("cuentaClabe")}
                </div>
              </div>
              {errors.cuentaClabe && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.cuentaClabe}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Banco *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => handleChange("banco", e.target.value)}
                  onBlur={() => handleBlur("banco")}
                  className={getInputClass("banco")}
                  placeholder="Ej: BBVA, Santander, Banorte..."
                  disabled={saving}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {renderFieldIcon("banco")}
                </div>
              </div>
              {errors.banco && (
                <p className="mt-1 text-xs text-red-500">{errors.banco}</p>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <InlineLoading text="Guardando..." className="text-white" />
            ) : (
              "Guardar cambios"
            )}
          </button>
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

export default GestionDatosPro;