import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

const statusColors = {
  PRE_OP: "bg-amber-100 text-amber-700",
  PER_OP: "bg-blue-100 text-blue-700",
  POST_OP: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
};

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      const res = await api.get(`/cases/${id}/full-summary/`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Erreur chargement dossier");
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl text-slate-600">Chargement...</div>
      </div>
    );
  }

  const { case: caseData, patient, preop_questionnaire, clinical_scores, perop_session, perop_vitals, perop_events, postop_stay, postop_observations, alerts } = data;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/cases")}
          className="mb-6 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          ← Retour aux dossiers
        </button>

        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                Dossier anesthésie
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="mt-2 text-slate-300">
                Intervention: {caseData.surgery_type}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                statusColors[caseData.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {caseData.status}
            </span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-400">Patient ID</p>
            <p className="mt-2 truncate font-semibold text-slate-800">{patient.id}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-400">Date naissance</p>
            <p className="mt-2 font-semibold text-slate-800">{patient.birth_date}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-400">Genre</p>
            <p className="mt-2 font-semibold text-slate-800">{patient.gender}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-400">Case status</p>
            <p className="mt-2 font-semibold text-slate-800">{caseData.status}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <SectionCard title="Pré-opératoire">
            {preop_questionnaire ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Langue:</span> {preop_questionnaire.language}</p>
                <p><span className="font-semibold">Validation:</span> {preop_questionnaire.validation_status}</p>
                <p><span className="font-semibold">Réponses:</span> {preop_questionnaire.responses?.length || 0}</p>
              </div>
            ) : (
              <p className="text-slate-500">Aucune donnée pré-op disponible.</p>
            )}
          </SectionCard>

          <SectionCard title="Scores cliniques">
            {clinical_scores?.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {clinical_scores.map((score) => (
                  <div
                    key={score.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm text-slate-400">{score.score_type}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {score.score_value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Aucun score disponible.</p>
            )}
          </SectionCard>

          <SectionCard title="Per-opératoire">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400">Session</p>
                <p className="mt-2 font-semibold text-slate-800">
                  {perop_session ? perop_session.status : "Aucune session"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400">Vitals</p>
                <p className="mt-2 font-semibold text-slate-800">
                  {perop_vitals?.length || 0}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400">Events</p>
                <p className="mt-2 font-semibold text-slate-800">
                  {perop_events?.length || 0}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Post-opératoire">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400">Stay</p>
                <p className="mt-2 font-semibold text-slate-800">
                  {postop_stay ? postop_stay.status : "Aucun séjour"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-400">Observations</p>
                <p className="mt-2 font-semibold text-slate-800">
                  {postop_observations?.length || 0}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Alertes">
            {alerts?.length ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-red-200 bg-red-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-red-700">{alert.title}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                        {alert.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Aucune alerte.</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}