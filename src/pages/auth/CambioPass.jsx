import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CambioPass() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nuevaPassword: "",
    confirmarPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para nueva contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para confirmar contraseña

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return {
      isValid: hasMinLength && hasLetters && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: hasMinLength,
        hasLetters,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const validateForm = () => {
    const newErrors = {};
    const passwordValidation = validatePassword(formData.nuevaPassword);

    if (!formData.nuevaPassword.trim()) {
      newErrors.nuevaPassword = "La nueva contraseña es requerida";
    } else if (!passwordValidation.isValid) {
      newErrors.nuevaPassword = "La contraseña no cumple los requisitos";
    }

    if (!formData.confirmarPassword.trim()) {
      newErrors.confirmarPassword = "Confirma tu contraseña";
    } else if (formData.nuevaPassword !== formData.confirmarPassword) {
      newErrors.confirmarPassword = "Las contraseñas no coinciden";
    }

    return { newErrors, passwordValidation };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { newErrors, passwordValidation } = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      
      // Navegar al Dashboard después de 2 segundos
      setTimeout(() => {
        navigate("/dashboarda");
      }, 2000);
    }, 1500);
  };

  const passwordValidation = validatePassword(formData.nuevaPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-lightBlue">
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-darkBlue mb-3">Cambiar Contraseña</h1>
            <p className="text-midBlue text-sm">
              Crea una nueva contraseña segura
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nueva Contraseña */}
            <div className="space-y-2">
              <label className="block text-darkBlue font-semibold text-sm">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="nuevaPassword"
                  value={formData.nuevaPassword}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres con letras, números y símbolos"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-midBlue transition ${
                    errors.nuevaPassword ? "border-red-500 bg-red-50 pr-10" : "border-lightBlue pr-10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-darkBlue focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Indicadores de requisitos */}
              {formData.nuevaPassword && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordValidation.requirements.minLength ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-xs ${
                      passwordValidation.requirements.minLength ? "text-green-600" : "text-red-600"
                    }`}>
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordValidation.requirements.hasLetters ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-xs ${
                      passwordValidation.requirements.hasLetters ? "text-green-600" : "text-red-600"
                    }`}>
                      Incluir letras
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordValidation.requirements.hasNumbers ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-xs ${
                      passwordValidation.requirements.hasNumbers ? "text-green-600" : "text-red-600"
                    }`}>
                      Incluir números
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordValidation.requirements.hasSpecialChar ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                    <span className={`text-xs ${
                      passwordValidation.requirements.hasSpecialChar ? "text-green-600" : "text-red-600"
                    }`}>
                      Incluir carácter especial (!@#$% etc.)
                    </span>
                  </div>
                </div>
              )}
              
              {errors.nuevaPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.nuevaPassword}</p>
              )}
            </div>

            {/* Campo Confirmar Contraseña */}
            <div className="space-y-2">
              <label className="block text-darkBlue font-semibold text-sm">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-midBlue transition ${
                    errors.confirmarPassword ? "border-red-500 bg-red-50 pr-10" : "border-lightBlue pr-10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-darkBlue focus:outline-none"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmarPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmarPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 ${
                isLoading 
                  ? "bg-midBlue opacity-70 cursor-not-allowed" 
                  : "bg-midBlue hover:bg-darkBlue text-white"
              }`}
            >
              {isLoading ? "Cambiando contraseña..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div 
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-lightBlue animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              
              <h3 className="text-xl font-bold text-darkBlue mb-4">
                ¡Contraseña Cambiada!
              </h3>
              <p className="text-midBlue text-sm mb-6">
                Tu contraseña ha sido actualizada exitosamente.
              </p>
              
              <div className="text-center text-midBlue text-xs">
                Redirigiendo al dashboard...
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default CambioPass;