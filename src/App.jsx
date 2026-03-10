import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
import Login from "./pages/auth/Login.jsx";
import Autentificacion from "./pages/auth/Autentificacion.jsx";
import CambioPass from "./pages/auth/CambioPass.jsx";

/* ADMIN */
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

/* APPROVER */
import DashboardApro from "./pages/approver/DashboardApro.jsx";
import Documents from "./pages/approver/Documents.jsx";
import Reportes from "./pages/approver/Reportes.jsx";
import SolicitudesAcceso from "./pages/approver/SolicitudesAcceso.jsx";

/* PROVIDER */
import DashboardProvider from "./pages/provider/DashboardProvider.jsx";
import GestionDatosPro from "./pages/provider/GestionDatosPro.jsx";
import OrdenCompraPro from "./pages/provider/OrdenCompraPro.jsx";
import DocumentosPro from "./pages/provider/DocumentosPro.jsx";
import EstatusPago from "./pages/provider/EstatusPago.jsx";
import XmlViewer from "./pages/provider/XmlViewer.jsx";

/* SHARED */
import Graficas from "./pages/shared/Graficas.jsx";

/* DEV */
import TestApi from "./components/TestApi.jsx";

/* GUARDS */
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

function App() {
  return (
    <Routes>
      {/* Públicas solo si no hay sesión */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/autentificacion" element={<Autentificacion />} />
      </Route>

      {/* Cambio de contraseña: requiere sesión */}
      <Route path="/cambio-pass" element={<CambioPass />} />

      {/* ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/proveedores" element={<GestionProveedores />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/verificacion" element={<VerificacionR />} />
        <Route
          path="/admin/historial-actividad"
          element={<HistorialActividad />}
        />
        <Route
          path="/admin/reactivacion-proveedores"
          element={<ReactivacionProveedores />}
        />
        <Route
          path="/admin/actualizacion-sat"
          element={<ActualizacionListaSAT />}
        />

        <Route path="/admin/pagos" element={<GestionPagos />} />
        <Route path="/admin/pagos/historial" element={<HistorialPagos />} />
        <Route path="/admin/pagos/aprobacion" element={<AprobaciondePagos />} />

        <Route path="/admin/expedientes" element={<ExpedientesDigitales />} />
      </Route>

      {/* APPROVER */}
      <Route element={<ProtectedRoute allowedRoles={["APPROVER"]} />}>
        <Route path="/approver" element={<DashboardApro />} />
        <Route path="/approver/documentos" element={<Documents />} />
        <Route path="/approver/reportes" element={<Reportes />} />
        <Route
          path="/approver/solicitudes-acceso"
          element={<SolicitudesAcceso />}
        />
      </Route>

      {/* PROVIDER */}
      <Route element={<ProtectedRoute allowedRoles={["PROVIDER"]} />}>
        <Route path="/provider" element={<DashboardProvider />} />
        <Route path="/provider/datos" element={<GestionDatosPro />} />
        <Route path="/provider/ordenes-compra" element={<OrdenCompraPro />} />
        <Route path="/provider/documentos" element={<DocumentosPro />} />
        <Route path="/provider/estatus-pago" element={<EstatusPago />} />
        <Route path="/provider/xml-viewer/:orderId" element={<XmlViewer />} />
        <Route path="/xml-viewer/:orderId" element={<XmlViewer />} />
      </Route>

      {/* Compartidas, pero con sesión */}
      <Route element={<ProtectedRoute />}>
        <Route path="/graficas" element={<Graficas />} />
        <Route path="/test-api" element={<TestApi />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
