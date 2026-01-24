import { Routes, Route } from "react-router-dom";
import Login from "./routes/Login.jsx";
import Autentificacion from "./routes/Autentificacion.jsx";
import CambioPass from "./routes/CambioPass.jsx";
import DashboardAdmin from "./routes/DashboardAdmin.jsx";
import ExpedientesDigitales from "./routes/ExpedientesDigitales.jsx";
import GestionProveedores from "./routes/GestionProveedores.jsx";
import Usuarios from "./routes/Usuarios.jsx";
import VerificacionR from "./routes/VerificacionR.jsx";
import Aprobacion from "./routes/Aprobacion.jsx";
import DashboardApro from "./routes/DashboardApro.jsx";
import Graficas from "./routes/Graficas.jsx";
import Reportes from "./routes/Reportes.jsx";
import DashboardProvider from "./routes/DashboardProvider.jsx";
import GestionDatosPro from "./routes/GestionDatosPro.jsx";
import OrdenCompraPro from "./routes/OrdenCompraPro.jsx";
import DocumentosPro from "./routes/DocumentosPro.jsx";
import EstatusPago from "./routes/EstatusPago.jsx";

import HistorialActividad from './routes/HistorialActividad';
import ActualizacionListaSAT from './routes/ActualizacionListaSAT';
import ReactivacionProveedores from './routes/ReactivacionProveedores';
import HistorialPagos from './routes/HistorialPagos';
import GestionPagos from "./routes/GestionPagos.jsx";
import AprobaciondePagos from "./routes/AprobaciondePagos.jsx";




function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/autentificacion" element={<Autentificacion />} />
        <Route path="/cambio-pass" element={<CambioPass />} />
        <Route path="/dashboarda" element={<DashboardAdmin />} />
        <Route path="/expedientes" element={<ExpedientesDigitales />} />
        <Route path="/gestionpro" element={<GestionProveedores />} />
        <Route path="/usarios" element={<Usuarios />} />
        <Route path="/verificacior" element={<VerificacionR />} />
        <Route path="/aprobacion" element={<Aprobacion />} />
        <Route path="/dashboardapro" element={<DashboardApro />} />
        <Route path="/graficas" element={<Graficas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/dashboardprovider" element={<DashboardProvider />} />
        <Route path="/gestionproveedor" element={<GestionDatosPro />} />
        <Route path="/ordenesdecomprapro" element={<OrdenCompraPro />} />
        <Route path="/documentospro" element={<DocumentosPro />} />
        <Route path="/estatuspago" element={<EstatusPago />} />
        <Route path="/historialactividad" element={<HistorialActividad />} />
        <Route path="/actualizacionsat" element={<ActualizacionListaSAT />} />
        <Route path="/reactivacionproveedores" element={<ReactivacionProveedores />} />
        <Route path="/historialpagos" element={<HistorialPagos />} />
        <Route path="/gestionpagos" element={<GestionPagos />} />
        <Route path="/apropagos" element={<AprobaciondePagos />} />

    </Routes>
  );
}

export default App;
 