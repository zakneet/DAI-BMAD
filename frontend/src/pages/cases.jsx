import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
              DAI
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Dossiers anesthésie
            </h1>
            <p className="mt-2 text-slate-500">
              Liste des dossiers disponibles avec accès rapide au résumé clinique.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {c.patient_full_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{c.surgery_type}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusColors[c.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <p className="text-slate-400">Case ID</p>
                  <p className="mt-1 truncate font-medium text-slate-700">{c.id}</p>
                </div>
                <div>
                  <p className="text-slate-400">Patient</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {c.patient_full_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="mt-1 font-medium text-slate-700">{c.status}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}