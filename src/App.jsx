import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* AUTH */
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const Autentificacion = lazy(() => import("./pages/auth/Autentificacion.jsx"));
const CambioPass = lazy(() => import("./pages/auth/CambioPass.jsx"));

/* ADMIN */
const DashboardAdmin = lazy(() => import("./pages/admin/DashboardAdmin.jsx"));
const GestionProveedores = lazy(() =>
  import("./pages/admin/proveedores/GestionProveedores.jsx")
);
const Usuarios = lazy(() => import("./pages/admin/Usuarios.jsx"));
const VerificacionR = lazy(() => import("./pages/admin/sat/VerificacionR.jsx"));
const HistorialActividad = lazy(() =>
  import("./pages/admin/HistorialActividad.jsx")
);
const ReactivacionProveedores = lazy(() =>
  import("./pages/admin/proveedores/ReactivacionProveedores.jsx")
);
const ActualizacionListaSAT = lazy(() =>
  import("./pages/admin/sat/ActualizacionListaSAT.jsx")
);

/* ADMIN → PAGOS */
const GestionPagos = lazy(() => import("./pages/admin/pagos/GestionPagos.jsx"));
const HistorialPagos = lazy(() =>
  import("./pages/admin/pagos/HistorialPagos.jsx")
);
const AprobaciondePagos = lazy(() =>
  import("./pages/admin/pagos/AprobaciondePagos.jsx")
);

/* ADMIN → EXPEDIENTES */
const ExpedientesDigitales = lazy(() =>
  import("./pages/admin/expedientes/ExpedientesDigitales.jsx")
);

/* APPROVER */
const DashboardApro = lazy(() => import("./pages/approver/DashboardApro.jsx"));
const Documents = lazy(() => import("./pages/approver/Documents.jsx"));
const Reportes = lazy(() => import("./pages/approver/Reportes.jsx"));
const SolicitudesAcceso = lazy(() =>
  import("./pages/approver/SolicitudesAcceso.jsx")
);

/* PROVIDER */
const DashboardProvider = lazy(() =>
  import("./pages/provider/DashboardProvider.jsx")
);
const GestionDatosPro = lazy(() =>
  import("./pages/provider/GestionDatosPro.jsx")
);
const OrdenCompraPro = lazy(() =>
  import("./pages/provider/OrdenCompraPro.jsx")
);
const DocumentosPro = lazy(() =>
  import("./pages/provider/DocumentosPro.jsx")
);
const EstatusPago = lazy(() => import("./pages/provider/EstatusPago.jsx"));
const XmlViewer = lazy(() => import("./pages/provider/XmlViewer.jsx"));

/* SHARED */
const Graficas = lazy(() => import("./pages/shared/Graficas.jsx"));

/* DEV */
const TestApi = lazy(() => import("./components/TestApi.jsx"));

/* GUARDS */
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-beige">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-lightBlue border-t-midBlue rounded-full animate-spin mx-auto mb-3" />
            <p className="text-darkBlue font-medium">Cargando...</p>
          </div>
        </div>
      }
    >
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
    </Suspense>
  );
}

export default App;