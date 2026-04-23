import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const statusColors = {
  PRE_OP: "bg-amber-100 text-amber-700",
  PER_OP: "bg-blue-100 text-blue-700",
  POST_OP: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
};

export default function Cases() {
  const [cases, setCases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await api.get("/cases/");
      setCases(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement cases");
    }
  };

  return (
    <AppLayout
      title="Anesthesia Cases"
      subtitle="Browse and open perioperative anesthesia records"
    >
      <div className="grid gap-5">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {c.patient_full_name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">{c.surgery_type}</p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  statusColors[c.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {c.status}
              </span>
            </div>

            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Case ID</p>
                <p className="mt-2 truncate font-medium text-slate-800">{c.id}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Patient</p>
                <p className="mt-2 font-medium text-slate-800">
                  {c.patient_full_name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Status</p>
                <p className="mt-2 font-medium text-slate-800">{c.status}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}