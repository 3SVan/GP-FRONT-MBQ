import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth.api";

export default function Autentificacion() {
  const navigate = useNavigate();
  const location = useLocation();

  // Email debe venir desde Login: navigate("/autentificacion", { state: { email } })
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // info | success | error

  const codeStr = useMemo(() => code.join(""), [code]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (!email) {
      setMessageType("error");
      setMessage("Falta el correo. Regresa a iniciar sesión.");
    }
  }, [email]);

  const setAlert = (type, msg) => {
    setMessageType(type);
    setMessage(msg);
  };

  const clearCode = () => {
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "");

    // Si pega varios caracteres en una casilla, solo toma el primero
    if (digit.length > 1) {
      const next = [...code];
      next[index] = digit[0];
      setCode(next);
      if (index < 5) inputRefs.current[index + 1]?.focus();
      return;
    }

    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...code];
        next[index - 1] = "";
        setCode(next);
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;

    e.preventDefault();

    const digits = text.slice(0, 6).split("");
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < digits.length; i++) next[i] = digits[i];

    setCode(next);

    const firstEmpty = next.findIndex((d) => !d);
    const focusIndex = firstEmpty === -1 ? 5 : firstEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  const goToDashboardByRole = (roles) => {
    if (roles.includes("ADMIN")) return navigate("/admin");
    if (roles.includes("APPROVER")) return navigate("/approver");
    if (roles.includes("PROVIDER")) return navigate("/provider");
    return navigate("/login");
  };

  const verifyCode = async () => {
    if (!email) {
      setAlert("error", "Falta el correo. Regresa a iniciar sesión.");
      return;
    }
    if (codeStr.length !== 6) {
      setAlert("error", "Ingresa los 6 dígitos del código.");
      return;
    }

    setLoadingVerify(true);
    setAlert("info", "Verificando código...");

    try {
      // 1) Verifica el código (setea cookie en el backend)
      await AuthAPI.loginVerify({ email, code: codeStr });

      // 2) Con cookie, pregunta quién eres y qué rol tienes
      const meRes = await AuthAPI.me();
      const roles = meRes?.data?.user?.roles || [];

      setAlert("success", "Acceso concedido. Redirigiendo...");
      goToDashboardByRole(roles);
    } catch (err) {
      setAlert("error", "Código incorrecto o expirado. Intenta de nuevo.");
      clearCode();
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setAlert("error", "Falta el correo. Regresa a iniciar sesión.");
      return;
    }

    setLoadingResend(true);
    setAlert("info", "Reenviando código...");

    try {
      const res = await AuthAPI.loginResend({ email });

      // Si estás en TEST_MODE, puede venir el code en la respuesta
      const returnedCode = res?.data?.code;
      if (returnedCode) {
        setAlert("success", `Código reenviado (modo pruebas): ${returnedCode}`);
      } else {
        setAlert("success", "Código reenviado. Revisa tu correo.");
      }

      clearCode();
    } catch (err) {
      setAlert("error", err?.message || "No se pudo reenviar el código.");
    } finally {
      setLoadingResend(false);
    }
  };

  // Auto-verificar cuando ya están los 6 dígitos
  useEffect(() => {
    if (!email) return;
    if (codeStr.length === 6 && !code.includes("") && !loadingVerify) {
      verifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeStr]);

  const messageStyles =
    messageType === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : messageType === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-lightBlue text-midBlue border-lightBlue";

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-lightBlue mx-auto">
        <div className="p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkBlue mb-3 sm:mb-4">
              Verificación de Código
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-midBlue">
              Ingresa el código de 6 dígitos que te enviamos
            </p>

            {email ? (
              <p className="text-sm sm:text-base text-midBlue mt-2">
                Correo: <span className="font-semibold text-darkBlue">{email}</span>
              </p>
            ) : null}
          </div>

          {message ? (
            <div className={`mb-8 border rounded-lg p-3 text-sm ${messageStyles}`}>
              {message}
            </div>
          ) : null}

          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Inputs del código */}
            <div
              className="flex justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6"
              onPaste={handlePaste}
            >
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  inputMode="numeric"
                  maxLength={1}
                  disabled={loadingVerify || loadingResend || !email}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-center text-xl sm:text-2xl lg:text-3xl font-bold border-2 border-gray-400 rounded-lg sm:rounded-xl focus:outline-none focus:border-midBlue focus:ring-2 focus:ring-midBlue focus:ring-opacity-30 transition-all bg-white disabled:opacity-50"
                />
              ))}
            </div>

            {/* Estado de carga (mismo look del ejemplo) */}
            {(loadingVerify || loadingResend) && (
              <div className="text-center">
                <div className="inline-flex items-center gap-3 sm:gap-4 text-midBlue text-base sm:text-lg">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-midBlue"></div>
                  <span>
                    {loadingVerify
                      ? "Verificando código..."
                      : "Reenviando código..."}
                  </span>
                </div>
              </div>
            )}

            {/* Reenviar */}
            <div className="text-center pt-6 sm:pt-8 border-t border-lightBlue">
              <button
                onClick={handleResendCode}
                disabled={loadingResend || loadingVerify || !email}
                className="text-midBlue hover:text-darkBlue font-semibold text-base sm:text-lg transition-colors disabled:opacity-50 px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-lightBlue hover:bg-opacity-30 w-full sm:w-auto"
              >
                Reenviar código de verificación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
