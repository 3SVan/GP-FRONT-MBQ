import { useState } from "react";
import { api } from "../api/client";

export default function TestApi() {
  const [result, setResult] = useState("");
  const baseURL = api?.defaults?.baseURL;

  const test = async () => {
    setResult("⏳ Haciendo request...");
    try {
      const res = await api.get("/auth/me");
      setResult("✅ OK\n" + JSON.stringify(res.data, null, 2));
    } catch (err) {
      // Para errores tipo CORS/Network, err.response puede ser undefined
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = err?.message || "Error desconocido";

      setResult(
        "❌ FALLÓ\n" +
          `baseURL: ${baseURL}\n` +
          `status: ${status ?? "N/A"}\n` +
          `message: ${message}\n` +
          `data: ${data ? JSON.stringify(data, null, 2) : "N/A"}`
      );
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: "sans-serif" }}>
      <h3>Probar GET /api/auth/me</h3>
      <div style={{ marginBottom: 10 }}>
        <div><b>baseURL:</b> {baseURL || "(vacío)"} </div>
      </div>

      <button onClick={test} style={{ padding: "8px 12px", cursor: "pointer" }}>
        Probar
      </button>

      <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{result}</pre>
    </div>
  );
}
