import { Routes, Route } from "react-router-dom";

/* =======================
   AUTH
======================= */
import Login from "./pages/auth/Login.jsx";
import Autentificacion from "./pages/auth/Autentificacion.jsx";
import CambioPass from "./pages/auth/CambioPass.jsx";

/* =======================
   ADMIN
======================= */
import DashboardAdmin from "./pages/admin/DashboardAdmin.jsx";
import GestionProveedores from "./pages/admin/proveedores/GestionProveedores.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";
import VerificacionR from "./pages/admin/sat/VerificacionR.jsx";
import HistorialActividad from "./pages/admin/HistorialActividad.jsx";
import ReactivacionProveedores from "./pages/admin/proveedores/ReactivacionProveedores.jsx";
import ActualizacionListaSAT from "./pages/admin/sat/ActualizacionListaSAT.jsx";

/* ADMIN → PAGOS */
import GestionPagos from "./pages/admin/pagos/GestionPagos.jsx";
import HistorialPagos from "./pages/admin/pagos/HistorialPagos.jsx";
import AprobaciondePagos from "./pages/admin/pagos/AprobaciondePagos.jsx";

/* ADMIN → EXPEDIENTES */
import ExpedientesDigitales from "./pages/admin/expedientes/ExpedientesDigitales.jsx";

/* =======================
   APPROVER
======================= */
import DashboardApro from "./pages/approver/DashboardApro.jsx";
import Aprobacion from "./pages/approver/Aprobacion.jsx";
import Reportes from "./pages/approver/Reportes.jsx";
import SolicitudesAcceso from "./pages/approver/SolicitudesAcceso.jsx";

/* =======================
   PROVIDER
======================= */
import DashboardProvider from "./pages/provider/DashboardProvider.jsx";
import GestionDatosPro from "./pages/provider/GestionDatosPro.jsx";
import OrdenCompraPro from "./pages/provider/OrdenCompraPro.jsx";
import DocumentosPro from "./pages/provider/DocumentosPro.jsx";
import EstatusPago from "./pages/provider/EstatusPago.jsx";

/* =======================
   SHARED
======================= */
import Graficas from "./pages/shared/Graficas.jsx";

/* =======================
   DEV / TEST
======================= */
import TestApi from "./components/TestApi.jsx";

function App() {
  return (
    <Routes>

      {/* AUTH */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/autentificacion" element={<Autentificacion />} />
      <Route path="/cambio-pass" element={<CambioPass />} />

      {/* ADMIN */}
      <Route path="/admin" element={<DashboardAdmin />} />
      <Route path="/admin/proveedores" element={<GestionProveedores />} />
      <Route path="/admin/usuarios" element={<Usuarios />} />
      <Route path="/admin/verificacion" element={<VerificacionR />} />
      <Route path="/admin/historial-actividad" element={<HistorialActividad />} />
      <Route path="/admin/reactivacion-proveedores" element={<ReactivacionProveedores />} />
      <Route path="/admin/actualizacion-sat" element={<ActualizacionListaSAT />} />

      {/* ADMIN → PAGOS */}
      <Route path="/admin/pagos" element={<GestionPagos />} />
      <Route path="/admin/pagos/historial" element={<HistorialPagos />} />
      <Route path="/admin/pagos/aprobacion" element={<AprobaciondePagos />} />

      {/* ADMIN → EXPEDIENTES */}
      <Route path="/admin/expedientes" element={<ExpedientesDigitales />} />

      {/* APPROVER */}
      <Route path="/approver" element={<DashboardApro />} />
      <Route path="/approver/aprobaciones" element={<Aprobacion />} />
      <Route path="/approver/reportes" element={<Reportes />} />
      <Route path="/approver/solicitudes-acceso" element={<SolicitudesAcceso />} />

      {/* PROVIDER */}
      <Route path="/provider" element={<DashboardProvider />} />
      <Route path="/provider/datos" element={<GestionDatosPro />} />
      <Route path="/provider/ordenes-compra" element={<OrdenCompraPro />} />
      <Route path="/provider/documentos" element={<DocumentosPro />} />
      <Route path="/provider/estatus-pago" element={<EstatusPago />} />

      {/* SHARED */}
      <Route path="/graficas" element={<Graficas />} />

      {/* DEV */}
      <Route path="/test-api" element={<TestApi />} />

    </Routes>
  );
}

export default App;
