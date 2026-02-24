// src/pages/provider/components/CalendarSimple.jsx
import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { formatDateISO } from "../utils/mockPlanes";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarSimple({ events = [], onOpenPlan, onOpenUpload }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(null);

  const { days, title } = useMemo(() => {
    const mStart = startOfMonth(cursor);
    const mEnd = endOfMonth(cursor);

    // grid inicia en domingo (0)
    const gridStart = new Date(mStart);
    gridStart.setDate(mStart.getDate() - mStart.getDay());

    const gridEnd = new Date(mEnd);
    gridEnd.setDate(mEnd.getDate() + (6 - mEnd.getDay()));

    const out = [];
    const it = new Date(gridStart);
    while (it <= gridEnd) {
      out.push(new Date(it));
      it.setDate(it.getDate() + 1);
    }

    const monthName = cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    return { days: out, title: monthName };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    // orden: cierres arriba
    for (const [k, list] of map) {
      list.sort((a, b) => (a.kind === "CIERRE" ? -1 : 1) - (b.kind === "CIERRE" ? -1 : 1));
      map.set(k, list);
    }
    return map;
  }, [events]);

  const today = new Date();
  const todayISO = toISO(today);

  const selectedList = selected ? eventsByDay.get(selected) || [] : [];

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Calendario</p>
          <h2 className="text-lg font-bold text-darkBlue capitalize">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl border hover:bg-gray-50"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="p-2 rounded-xl border hover:bg-gray-50"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-100 font-semibold">
          Cierre
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-semibold">
          Pago programado
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full border bg-gray-50 text-gray-700 border-gray-100 font-semibold">
          Pagada (tenue)
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2 text-xs">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <div key={d} className="text-gray-500 font-semibold px-2 py-1">
            {d}
          </div>
        ))}

        {days.map((d) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = iso === todayISO;

          const list = eventsByDay.get(iso) || [];
          const hasClose = list.some((e) => e.kind === "CIERRE");
          const hasPay = list.some((e) => e.kind === "PAGO");

          return (
            <button
              key={iso}
              onClick={() => setSelected(iso)}
              className={[
                "rounded-xl border text-left p-2 min-h-[72px] hover:bg-gray-50 transition relative",
                !inMonth ? "opacity-50" : "",
                selected === iso ? "ring-2 ring-midBlue border-midBlue" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isToday ? "text-midBlue" : "text-gray-700"}`}>{d.getDate()}</span>
                {isToday && <span className="text-[10px] font-bold text-midBlue">HOY</span>}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {hasClose && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-semibold">
                    Cierre
                  </span>
                )}
                {hasPay && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                    Pago
                  </span>
                )}
                {list.length === 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100 font-semibold">
                    —
                  </span>
                )}
              </div>

              {list.length > 0 && (
                <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-400">{list.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Popover simple */}
      {selected && (
        <div className="mt-5 rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-darkBlue">
              Eventos del día <span className="text-gray-500 text-sm">({formatDateISO(selected)})</span>
            </p>
            <button className="text-xs px-3 py-1 rounded-xl border hover:bg-gray-50" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>

          {selectedList.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">No hay eventos este día.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {selectedList.map((e) => (
                <div key={e.id} className="rounded-2xl border p-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {e.kind === "CIERRE" ? "Cierre parcialidad" : "Pago parcialidad"} #{e.parcialidadNumero}
                    </p>
                    <p className="text-xs text-gray-500">
                      Plan: <b className="text-gray-700">{e.planOC}</b>
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={e.estado} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="text-xs px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold"
                      onClick={() => onOpenPlan?.(e.planId)}
                    >
                      Ver plan
                    </button>

                    {e.cta === "SUBIR" && (
                      <button
                        className="text-xs px-3 py-2 rounded-xl bg-midBlue text-white hover:opacity-90 font-semibold"
                        onClick={() => onOpenUpload?.(e.planId, e.parcialidadId)}
                      >
                        Subir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}