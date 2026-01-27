import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, X, User, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentosPro = () => {
  const navigate = useNavigate();
  const [tipoPersona, setTipoPersona] = useState('');
  const [archivos, setArchivos] = useState({});
  const [errors, setErrors] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    type: '', 
    title: '', 
    message: '', 
    showConfirm: false, 
    onConfirm: null 
  });

  // Documentos por tipo de persona
  const documentosPorTipo = {
    fisica: [
      { 
        id: 'opinion-sat-fisica', 
        nombre: 'Opinión de Cumplimiento SAT/Constancia Fiscal', 
        requerido: true,
        descripcion: 'Documento emitido por el SAT que acredita el cumplimiento de obligaciones fiscales'
      },
      { 
        id: 'identificacion-fisica', 
        nombre: 'Identificación Física', 
        requerido: true,
        descripcion: 'Documento que acredita tu identidad física'
      },
      { 
        id: 'identificacion-oficial-fisica', 
        nombre: 'Identificación Oficial', 
        requerido: true,
        descripcion: 'INE, Pasaporte o Cédula Profesional vigente'
      },
      { 
        id: 'contratos-fisica', 
        nombre: 'Contratos', 
        requerido: true,
        descripcion: 'Contratos de servicios o productos establecidos'
      }
    ],
    moral: [
      { 
        id: 'opinion-sat-moral', 
        nombre: 'Opinión de Cumplimiento SAT/Constancia Fiscal', 
        requerido: true,
        descripcion: 'Documento emitido por el SAT que acredita el cumplimiento de obligaciones fiscales de la empresa'
      },
      { 
        id: 'contratos-moral', 
        nombre: 'Contratos', 
        requerido: true,
        descripcion: 'Contratos de servicios o productos establecidos'
      }
    ]
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
        icon: <CheckCircle className="w-6 h-6 text-red-600" />, 
        button: 'bg-red-600 hover:bg-red-700',
        text: 'text-red-800'
      },
      warning: { 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200', 
        icon: <CheckCircle className="w-6 h-6 text-yellow-600" />, 
        button: 'bg-yellow-600 hover:bg-yellow-700',
        text: 'text-yellow-800'
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
                        setArchivos({});
                        setTipoPersona('');
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
                      setArchivos({});
                      setTipoPersona('');
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

  const handleTipoPersonaChange = (tipo) => {
    setTipoPersona(tipo);
    setArchivos({});
    setErrors({});
  };

  const handleFileUpload = (event, documentoId) => {
    const file = event.target.files[0];
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          [documentoId]: 'Solo se permiten archivos PDF'
        }));
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [documentoId]: 'El archivo no puede ser mayor a 10MB'
        }));
        return;
      }

      // Archivo válido
      setErrors(prev => ({
        ...prev,
        [documentoId]: null
      }));

      const nuevoArchivo = {
        id: Date.now(),
        documentoId,
        nombre: file.name,
        tipo: file.type,
        tamaño: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        fecha: new Date().toLocaleDateString('es-MX'),
        archivo: file
      };

      setArchivos(prev => ({
        ...prev,
        [documentoId]: nuevoArchivo
      }));
    }
  };

  const handleRemoveFile = (documentoId) => {
    setArchivos(prev => {
      const nuevosArchivos = { ...prev };
      delete nuevosArchivos[documentoId];
      return nuevosArchivos;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!tipoPersona) {
      showAlert(
        'warning', 
        'Tipo de Persona Requerido', 
        'Por favor selecciona el tipo de persona antes de continuar.'
      );
      return;
    }

    // Validar que todos los documentos requeridos estén subidos
    const documentosRequeridos = documentosPorTipo[tipoPersona];
    const documentosFaltantes = documentosRequeridos.filter(doc => 
      doc.requerido && !archivos[doc.id]
    );

    if (documentosFaltantes.length > 0) {
      showAlert(
        'error', 
        'Documentos Faltantes', 
        `Faltan ${documentosFaltantes.length} documento(s) por subir:\n\n${documentosFaltantes.map(doc => `• ${doc.nombre}`).join('\n')}`
      );
      return;
    }

    // Enviar datos
    console.log('Documentos subidos:', archivos);
    showAlert(
      'success', 
      'Documentos Enviados', 
      'Los documentos se han enviado correctamente.\n\nTu información ha sido procesada y estará sujeta a validación.'
    );
  };

  const getDocumentosActuales = () => {
    return tipoPersona ? documentosPorTipo[tipoPersona] : [];
  };

  const todosDocumentosSubidos = () => {
    if (!tipoPersona) return false;
    const documentosRequeridos = documentosPorTipo[tipoPersona];
    return documentosRequeridos.every(doc => 
      !doc.requerido || archivos[doc.id]
    );
  };

  return (
    <div className="min-h-screen bg-beige p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-darkBlue">Carga de Documentos</h2>
              <p className="text-midBlue">Sube los documentos requeridos según tu tipo de persona</p>
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
                  onClick={() => handleTipoPersonaChange('fisica')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    tipoPersona === 'fisica'
                      ? 'border-midBlue bg-lightBlue'
                      : 'border-lightBlue hover:border-midBlue'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-6 h-6 ${
                      tipoPersona === 'fisica' ? 'text-midBlue' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-darkBlue">Persona Física</h4>
                      <p className="text-sm text-midBlue">4 documentos requeridos</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTipoPersonaChange('moral')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    tipoPersona === 'moral'
                      ? 'border-midBlue bg-lightBlue'
                      : 'border-lightBlue hover:border-midBlue'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building className={`w-6 h-6 ${
                      tipoPersona === 'moral' ? 'text-midBlue' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-darkBlue">Persona Moral</h4>
                      <p className="text-sm text-midBlue">2 documentos requeridos</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Documentos Requeridos */}
            {tipoPersona && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-4">
                  Documentos para {tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                </h3>
                <div className="space-y-4">
                  {getDocumentosActuales().map((documento) => (
                    <div key={documento.id} className="border border-lightBlue rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-midBlue" />
                            <div>
                              <span className="font-medium text-darkBlue">{documento.nombre}</span>
                              {documento.requerido && (
                                <span className="ml-2 text-xs text-red-500">*Requerido</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-midBlue mb-3">{documento.descripcion}</p>
                          
                          {archivos[documento.id] ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div>
                                  <span className="font-medium text-darkBlue">{archivos[documento.id].nombre}</span>
                                  <div className="text-xs text-midBlue">
                                    {archivos[documento.id].tamaño} • {archivos[documento.id].fecha}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(documento.id)}
                                  className="text-red-500 hover:text-red-700 transition text-sm flex items-center gap-1"
                                >
                                  <X className="w-4 h-4" />
                                  Remover
                                </button>
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    className="hidden"
                                    id={`update-${documento.id}`}
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload(e, documento.id)}
                                  />
                                  <div className="flex items-center space-x-1 px-3 py-1 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition text-sm">
                                    <Upload className="w-4 h-4" />
                                    <span>Actualizar</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                              errors[documento.id] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-lightBlue hover:border-midBlue'
                            }`}>
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
                                id={`upload-${documento.id}`}
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e, documento.id)}
                              />
                              <label
                                htmlFor={`upload-${documento.id}`}
                                className="inline-block px-4 py-2 bg-midBlue text-white rounded-lg hover:bg-darkBlue transition cursor-pointer text-sm"
                              >
                                Seleccionar Archivo
                              </label>
                              {errors[documento.id] && (
                                <p className="text-red-500 text-xs mt-2">{errors[documento.id]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen de Documentos Subidos */}
            {tipoPersona && Object.keys(archivos).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-darkBlue mb-4">Resumen de Documentos</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-darkBlue">
                    <strong>{Object.keys(archivos).length}</strong> de{' '}
                    <strong>{getDocumentosActuales().filter(doc => doc.requerido).length}</strong>{' '}
                    documentos requeridos subidos
                  </p>
                  {todosDocumentosSubidos() && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      ✓ Todos los documentos requeridos han sido subidos
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción - SOLO ENVIAR DOCUMENTOS */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-lightBlue">
              <button 
                type="submit"
                disabled={!tipoPersona || !todosDocumentosSubidos()}
                className={`px-6 py-2 rounded-lg transition ${
                  tipoPersona && todosDocumentosSubidos()
                    ? 'bg-midBlue text-white hover:bg-darkBlue'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Enviar Documentos
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

export default DocumentosPro;