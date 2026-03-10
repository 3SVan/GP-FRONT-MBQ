// src/pages/provider/EstatusPago.jsx
import React from "react";
import { Clock, Eye, CheckCircle, DollarSign } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader.jsx";
import SectionCard from "../../components/ui/SectionCard.jsx";

const EstatusPago = () => {
  const tiemposEstatus = [
    {
      estatus: "Pendiente de validación",
      tiempo: "2 días",
      tone: "yellow",
      icono: Clock,
      iconColor: "text-yellow-600",
      bgIcon: "bg-yellow-100",
      border: "border-yellow-200",
      bgCard: "bg-yellow-50",
      bar: "bg-yellow-300",
    },
    {
      estatus: "En revisión",
      tiempo: "3 días",
      tone: "blue",
      icono: Eye,
      iconColor: "text-blue-600",
      bgIcon: "bg-blue-100",
      border: "border-blue-200",
      bgCard: "bg-blue-50",
      bar: "bg-blue-300",
    },
    {
      estatus: "Autorizado",
      tiempo: "1 día",
      tone: "green",
      icono: CheckCircle,
      iconColor: "text-green-600",
      bgIcon: "bg-green-100",
      border: "border-green-200",
      bgCard: "bg-green-50",
      bar: "bg-green-300",
    },
    {
      estatus: "Pagado",
      tiempo: "2 días",
      tone: "purple",
      icono: DollarSign,
      iconColor: "text-purple-600",
      bgIcon: "bg-purple-100",
      border: "border-purple-200",
      bgCard: "bg-purple-50",
      bar: "bg-purple-300",
    },
  ];

  return (
    <div className="space-y-6 bg-beige px-6 py-6">
      <PageHeader
        title="Tiempos por estatus de pago"
        subtitle="Consulta los días estimados de tardanza en cada etapa del proceso."
      />

      <SectionCard className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiemposEstatus.map((item, index) => {
            const Icono = item.icono;

            return (
              <div
                key={index}
                className={`rounded-xl border p-6 text-center shadow-sm transition-transform duration-300 hover:scale-[1.02] ${item.border} ${item.bgCard}`}
              >
                <div
                  className={`mb-5 inline-flex items-center justify-center rounded-2xl p-4 ${item.bgIcon}`}
                >
                  <Icono className={`h-10 w-10 ${item.iconColor}`} />
                </div>

                <div className="mb-3 text-3xl font-bold text-gray-800">
                  {item.tiempo}
                </div>

                <h3 className="text-base font-semibold leading-tight text-gray-800">
                  {item.estatus}
                </h3>

                <div className={`mx-auto mt-4 h-1 w-16 rounded-full ${item.bar}`} />
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

export default EstatusPago;