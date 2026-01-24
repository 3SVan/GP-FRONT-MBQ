import React from 'react';
import { Clock, Eye, CheckCircle, DollarSign } from 'lucide-react';

const EstatusPago = () => {
  // Datos con solo los días de tardanza por estatus
  const tiemposEstatus = [
    {
      estatus: 'Pendiente de validación',
      tiempo: '2 días',
      color: 'bg-yellow-50 border-yellow-200',
      icono: Clock,
      iconColor: 'text-yellow-500',
      bgIcon: 'bg-yellow-100'
    },
    {
      estatus: 'En revisión',
      tiempo: '3 días',
      color: 'bg-blue-50 border-blue-200',
      icono: Eye,
      iconColor: 'text-blue-500',
      bgIcon: 'bg-blue-100'
    },
    {
      estatus: 'Autorizado',
      tiempo: '1 día',
      color: 'bg-green-50 border-green-200',
      icono: CheckCircle,
      iconColor: 'text-green-500',
      bgIcon: 'bg-green-100'
    },
    {
      estatus: 'Pagado',
      tiempo: '2 días',
      color: 'bg-purple-50 border-purple-200',
      icono: DollarSign,
      iconColor: 'text-purple-500',
      bgIcon: 'bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-beige p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-darkBlue mb-4">Tiempos por Estatus de Pago</h2>
          <p className="text-xl text-midBlue">Días de tardanza en cada etapa del proceso</p>
        </div>

        {/* Cuadritos de Estatus - Más grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiemposEstatus.map((item, index) => {
            const Icono = item.icono;
            
            return (
              <div 
                key={index} 
                className={`p-8 rounded-xl border-2 ${item.color} text-center transition-all duration-300 hover:scale-105 hover:shadow-lg`}
              >
                {/* Icono Principal - Más grande */}
                <div className={`p-4 rounded-2xl ${item.bgIcon} inline-flex items-center justify-center mb-6`}>
                  <Icono className={`w-12 h-12 ${item.iconColor}`} />
                </div>

                {/* Tiempo - Texto más grande */}
                <div className="text-4xl font-bold text-gray-800 mb-4">{item.tiempo}</div>

                {/* Nombre del Estatus - Texto más grande */}
                <h3 className="text-lg font-semibold text-darkBlue leading-tight">{item.estatus}</h3>

                {/* Línea decorativa */}
                <div className={`h-1 w-16 mx-auto mt-4 rounded-full ${item.bgIcon.replace('bg-', 'bg-').replace('100', '300')}`}></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstatusPago;