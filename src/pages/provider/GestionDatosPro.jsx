import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const GestionDatosPro = ({ onClose }) => {
  const [formData, setFormData] = useState({
    // Datos Fiscales
    razonSocial: '',
    rfc: '',
    domicilioFiscal: '',
    
    // Datos de Contacto
    nombreContacto: '',
    cargo: '',
    correo: '',
    telefono: '',
    direccionEntrega: '',
    
    // Datos Bancarios
    cuentaClabe: '',
    banco: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    type: '', 
    title: '', 
    message: '', 
    showConfirm: false, 
    onConfirm: null 
  });

  // Validaciones
  const validations = {
    razonSocial: (value) => {
      if (!value) return 'La razón social es obligatoria';
      if (value.length < 3) return 'La razón social debe tener al menos 3 caracteres';
      return null;
    },
    
    rfc: (value) => {
      if (!value) return 'El RFC es obligatorio';
      const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(value)) return 'Formato de RFC inválido';
      return null;
    },
    
    domicilioFiscal: (value) => {
      if (!value) return 'El domicilio fiscal es obligatorio';
      if (value.length < 10) return 'El domicilio fiscal debe ser más específico';
      return null;
    },
    
    nombreContacto: (value) => {
      if (!value) return 'El nombre de contacto es obligatorio';
      if (value.length < 3) return 'El nombre debe tener al menos 3 caracteres';
      return null;
    },
    
    cargo: (value) => {
      if (!value) return 'El cargo es obligatorio';
      return null;
    },
    
    correo: (value) => {
      if (!value) return 'El correo electrónico es obligatorio';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Formato de correo inválido';
      return null;
    },
    
    telefono: (value) => {
      if (!value) return 'El teléfono es obligatorio';
      const phoneRegex = /^[\d\s\+\-\(\)]{10,15}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Formato de teléfono inválido';
      return null;
    },
    
    direccionEntrega: (value) => {
      if (!value) return 'La dirección de entrega es obligatoria';
      if (value.length < 10) return 'La dirección de entrega debe ser más específica';
      return null;
    },
    
    cuentaClabe: (value) => {
      if (!value) return 'La CLABE es obligatoria';
      const clabeRegex = /^\d{18}$/;
      if (!clabeRegex.test(value.replace(/\s/g, ''))) return 'La CLABE debe tener 18 dígitos';
      return null;
    },
    
    banco: (value) => {
      if (!value) return 'El banco es obligatorio';
      if (value.length < 3) return 'El nombre del banco debe tener al menos 3 caracteres';
      return null;
    }
  };

  // Función para mostrar alertas
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
  };

  // Componente de Alertas
  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: { 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        icon: <CheckCircle className="w-6 h-6 text-green-600" />, 
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-800'
      },
      error: { 
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        icon: <XCircle className="w-6 h-6 text-red-600" />, 
        button: 'bg-red-600 hover:bg-red-700',
        text: 'text-red-800'
      }
    };

    const style = alertStyles[alertConfig.type] || alertStyles.success;

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-95 hover:scale-100`}>
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base sm:text-lg font-semibold ${style.text} mb-2`}>
                    {alertConfig.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base">
                    {alertConfig.message}
                  </p>
                  <button
                    onClick={() => {
                      setAlertOpen(false);
                      if (alertConfig.type === 'success' && onClose) {
                        onClose();
                      }
                    }}
                    className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 text-white rounded-lg transition ${style.button} font-medium text-sm sm:text-base`}
                  >
                    Aceptar
                  </button>
                </div>
                <button
                  onClick={() => {
                    setAlertOpen(false);
                    if (alertConfig.type === 'success' && onClose) {
                      onClose();
                    }
                  }}
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

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validar en tiempo real si el campo ya fue tocado
    if (touched[field]) {
      const error = validations[field](value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    const error = validations[field](formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validar todos los campos
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validations[key](formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    // Si no hay errores, proceder con el envío
    if (Object.keys(newErrors).length === 0) {
      console.log('Datos válidos:', formData);
      // Aquí iría la lógica para guardar los datos
      showAlert(
        'success', 
        'Datos Guardados', 
        'Los datos del proveedor se han guardado correctamente.'
      );
    } else {
      // Mostrar alerta de error si hay campos inválidos
      const camposConError = Object.keys(newErrors).length;
      showAlert(
        'error', 
        'Error en el Formulario', 
        `Hay ${camposConError} campo(s) que requieren atención. Por favor, revisa la información ingresada.`
      );
    }
  };

  const getFieldStatus = (field) => {
    if (!touched[field]) return 'untouched';
    if (errors[field]) return 'error';
    return 'valid';
  };

  const renderFieldIcon = (field) => {
    const status = getFieldStatus(field);
    
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-beige p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">Gestión de Datos del Proveedor</h2>
              <p className="text-midBlue">Administra la información de tu empresa</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-lightBlue p-6 space-y-8">
            {/* Sección 1: Datos Fiscales */}
            <div>
              <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b border-lightBlue pb-2">
                Datos Fiscales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Nombre o Razón Social *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.razonSocial}
                      onChange={(e) => handleChange('razonSocial', e.target.value)}
                      onBlur={() => handleBlur('razonSocial')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('razonSocial') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('razonSocial') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ingresa la razón social de la empresa"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('razonSocial')}
                    </div>
                  </div>
                  {errors.razonSocial && (
                    <p className="text-red-500 text-xs mt-1">{errors.razonSocial}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    RFC *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.rfc}
                      onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                      onBlur={() => handleBlur('rfc')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('rfc') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('rfc') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ej: ABC123456789"
                      maxLength={13}
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('rfc')}
                    </div>
                  </div>
                  {errors.rfc && (
                    <p className="text-red-500 text-xs mt-1">{errors.rfc}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Domicilio Fiscal *
                  </label>
                  <div className="relative">
                    <textarea 
                      value={formData.domicilioFiscal}
                      onChange={(e) => handleChange('domicilioFiscal', e.target.value)}
                      onBlur={() => handleBlur('domicilioFiscal')}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('domicilioFiscal') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('domicilioFiscal') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Calle, número, colonia, ciudad, estado, código postal"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('domicilioFiscal')}
                    </div>
                  </div>
                  {errors.domicilioFiscal && (
                    <p className="text-red-500 text-xs mt-1">{errors.domicilioFiscal}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 2: Datos de Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b border-lightBlue pb-2">
                Datos de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.nombreContacto}
                      onChange={(e) => handleChange('nombreContacto', e.target.value)}
                      onBlur={() => handleBlur('nombreContacto')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('nombreContacto') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('nombreContacto') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Nombre del contacto principal"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('nombreContacto')}
                    </div>
                  </div>
                  {errors.nombreContacto && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombreContacto}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Cargo *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.cargo}
                      onChange={(e) => handleChange('cargo', e.target.value)}
                      onBlur={() => handleBlur('cargo')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('cargo') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('cargo') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ej: Gerente de Ventas"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('cargo')}
                    </div>
                  </div>
                  {errors.cargo && (
                    <p className="text-red-500 text-xs mt-1">{errors.cargo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={formData.correo}
                      onChange={(e) => handleChange('correo', e.target.value)}
                      onBlur={() => handleBlur('correo')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('correo') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('correo') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="correo@empresa.com"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('correo')}
                    </div>
                  </div>
                  {errors.correo && (
                    <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      onBlur={() => handleBlur('telefono')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('telefono') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('telefono') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="+52 55 1234 5678"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('telefono')}
                    </div>
                  </div>
                  {errors.telefono && (
                    <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Dirección de Entrega *
                  </label>
                  <div className="relative">
                    <textarea 
                      value={formData.direccionEntrega}
                      onChange={(e) => handleChange('direccionEntrega', e.target.value)}
                      onBlur={() => handleBlur('direccionEntrega')}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('direccionEntrega') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('direccionEntrega') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Dirección completa para recibir mercancía"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('direccionEntrega')}
                    </div>
                  </div>
                  {errors.direccionEntrega && (
                    <p className="text-red-500 text-xs mt-1">{errors.direccionEntrega}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 3: Datos Bancarios */}
            <div>
              <h3 className="text-lg font-semibold text-darkBlue mb-4 border-b border-lightBlue pb-2">
                Datos Bancarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Cuenta CLABE *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.cuentaClabe}
                      onChange={(e) => handleChange('cuentaClabe', e.target.value.replace(/\D/g, ''))}
                      onBlur={() => handleBlur('cuentaClabe')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('cuentaClabe') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('cuentaClabe') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="18 dígitos"
                      maxLength={18}
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('cuentaClabe')}
                    </div>
                  </div>
                  {errors.cuentaClabe && (
                    <p className="text-red-500 text-xs mt-1">{errors.cuentaClabe}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Banco *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.banco}
                      onChange={(e) => handleChange('banco', e.target.value)}
                      onBlur={() => handleBlur('banco')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('banco') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('banco') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ej: BBVA Bancomer, Santander, etc."
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('banco')}
                    </div>
                  </div>
                  {errors.banco && (
                    <p className="text-red-500 text-xs mt-1">{errors.banco}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción - SOLO GUARDAR CAMBIOS */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-lightBlue">
              <button 
                type="submit"
                className="px-6 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Alertas */}
      <Alert />
    </div>
  );
};

export default GestionDatosPro;