import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrdenCompraPro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    monto: '',
    fecha: '',
    numeroOrden: '',
    rfc: '',
    observaciones: '',
    archivoOrden: null
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [archivoSubido, setArchivoSubido] = useState(null);
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
    monto: (value) => {
      if (!value) return 'El monto es obligatorio';
      const montoRegex = /^\d+(\.\d{1,2})?$/;
      if (!montoRegex.test(value)) return 'Formato de monto inválido (ej: 1500.00)';
      if (parseFloat(value) <= 0) return 'El monto debe ser mayor a 0';
      return null;
    },
    
    fecha: (value) => {
      if (!value) return 'La fecha es obligatoria';
      const fechaSeleccionada = new Date(value);
      const hoy = new Date();
      if (fechaSeleccionada > hoy) return 'La fecha no puede ser futura';
      return null;
    },
    
    numeroOrden: (value) => {
      if (!value) return 'El número de orden es obligatorio';
      if (value.length < 3) return 'El número de orden debe tener al menos 3 caracteres';
      return null;
    },
    
    rfc: (value) => {
      if (!value) return 'El RFC es obligatorio';
      const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(value)) return 'Formato de RFC inválido';
      return null;
    },
    
    observaciones: (value) => {
      if (value && value.length > 500) return 'Las observaciones no pueden exceder 500 caracteres';
      return null;
    },
    
    archivoOrden: (value) => {
      if (!value) return 'La orden de compra en PDF es obligatoria';
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
                      if (alertConfig.type === 'success') {
                        // Limpiar formulario después de éxito
                        setFormData({
                          monto: '',
                          fecha: '',
                          numeroOrden: '',
                          rfc: '',
                          observaciones: '',
                          archivoOrden: null
                        });
                        setArchivoSubido(null);
                        setTouched({});
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
                    if (alertConfig.type === 'success') {
                      // Limpiar formulario después de éxito
                      setFormData({
                        monto: '',
                        fecha: '',
                        numeroOrden: '',
                        rfc: '',
                        observaciones: '',
                        archivoOrden: null
                      });
                      setArchivoSubido(null);
                      setTouched({});
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          archivoOrden: 'Solo se permiten archivos PDF'
        }));
        setArchivoSubido(null);
        setFormData(prev => ({ ...prev, archivoOrden: null }));
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          archivoOrden: 'El archivo no puede ser mayor a 10MB'
        }));
        setArchivoSubido(null);
        setFormData(prev => ({ ...prev, archivoOrden: null }));
        return;
      }

      // Archivo válido
      setErrors(prev => ({
        ...prev,
        archivoOrden: null
      }));
      
      setArchivoSubido({
        nombre: file.name,
        tamaño: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        tipo: file.type
      });
      
      setFormData(prev => ({
        ...prev,
        archivoOrden: file
      }));

      // Marcar como tocado
      setTouched(prev => ({
        ...prev,
        archivoOrden: true
      }));
    }
  };

  const handleRemoveFile = () => {
    setArchivoSubido(null);
    setFormData(prev => ({ ...prev, archivoOrden: null }));
    setErrors(prev => ({
      ...prev,
      archivoOrden: 'La orden de compra en PDF es obligatoria'
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
      // Aquí iría la lógica para enviar los datos
      showAlert(
        'success', 
        'Orden Registrada', 
        'La orden de compra se ha registrado correctamente.'
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">Registro de Órdenes de Compra</h2>
              <p className="text-midBlue">Registra tus órdenes de compra</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-lightBlue p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="space-y-6">
                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Monto en $ *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.monto}
                      onChange={(e) => handleChange('monto', e.target.value)}
                      onBlur={() => handleBlur('monto')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('monto') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('monto') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ej: 1500.00"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('monto')}
                    </div>
                  </div>
                  {errors.monto && (
                    <p className="text-red-500 text-xs mt-1">{errors.monto}</p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Fecha *
                  </label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={formData.fecha}
                      onChange={(e) => handleChange('fecha', e.target.value)}
                      onBlur={() => handleBlur('fecha')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('fecha') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('fecha') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('fecha')}
                    </div>
                  </div>
                  {errors.fecha && (
                    <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>
                  )}
                </div>

                {/* Número de Orden */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Número de Orden *
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.numeroOrden}
                      onChange={(e) => handleChange('numeroOrden', e.target.value)}
                      onBlur={() => handleBlur('numeroOrden')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('numeroOrden') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('numeroOrden') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Ej: OC-2024-001"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('numeroOrden')}
                    </div>
                  </div>
                  {errors.numeroOrden && (
                    <p className="text-red-500 text-xs mt-1">{errors.numeroOrden}</p>
                  )}
                </div>

                {/* RFC */}
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
              </div>

              {/* Columna derecha */}
              <div className="space-y-6">
                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Observaciones
                  </label>
                  <div className="relative">
                    <textarea 
                      value={formData.observaciones}
                      onChange={(e) => handleChange('observaciones', e.target.value)}
                      onBlur={() => handleBlur('observaciones')}
                      rows="4"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
                        getFieldStatus('observaciones') === 'error' 
                          ? 'border-red-500 focus:ring-red-500' 
                          : getFieldStatus('observaciones') === 'valid'
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-lightBlue focus:ring-midBlue'
                      }`}
                      placeholder="Observaciones adicionales (opcional)"
                    />
                    <div className="absolute right-3 top-2">
                      {renderFieldIcon('observaciones')}
                    </div>
                  </div>
                  {errors.observaciones && (
                    <p className="text-red-500 text-xs mt-1">{errors.observaciones}</p>
                  )}
                  <div className="text-right text-xs text-midBlue mt-1">
                    {formData.observaciones.length}/500 caracteres
                  </div>
                </div>

                {/* Subir Orden de Compra PDF */}
                <div>
                  <label className="block text-sm font-medium text-darkBlue mb-1">
                    Orden de Compra en PDF *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                    errors.archivoOrden 
                      ? 'border-red-500 bg-red-50' 
                      : archivoSubido
                      ? 'border-green-500 bg-green-50'
                      : 'border-lightBlue hover:border-midBlue'
                  }`}>
                    {!archivoSubido ? (
                      <div>
                        <Upload className="w-8 h-8 text-midBlue mx-auto mb-2" />
                        <p className="text-sm text-darkBlue mb-2">
                          Haz clic para subir la orden de compra en PDF
                        </p>
                        <p className="text-xs text-midBlue">
                          Máximo 10MB - Solo archivos PDF
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          id="orden-pdf"
                          accept=".pdf"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="orden-pdf"
                          className="inline-block mt-2 px-4 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition cursor-pointer text-sm"
                        >
                          Seleccionar Archivo
                        </label>
                      </div>
                    ) : (
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-darkBlue">{archivoSubido.nombre}</p>
                        <p className="text-xs text-midBlue">{archivoSubido.tamaño}</p>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="mt-2 px-3 py-1 text-red-500 hover:text-red-700 transition text-sm flex items-center gap-1 mx-auto"
                        >
                          <X className="w-4 h-4" />
                          Remover archivo
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.archivoOrden && (
                    <p className="text-red-500 text-xs mt-1">{errors.archivoOrden}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción - SOLO REGISTRAR ORDEN DE COMPRA */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-lightBlue">
              <button 
                type="submit"
                className="px-6 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition"
              >
                Registrar Orden de Compra
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

export default OrdenCompraPro;