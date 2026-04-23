import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const statusColors = {
  PRE_OP: "bg-amber-100 text-amber-700",
  PER_OP: "bg-blue-100 text-blue-700",
  POST_OP: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
};

function SectionCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-semibold text-slate-900">{title}</h3>
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
      <AppLayout
        title="Case detail"
        subtitle="Loading anesthesia record summary"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
          Chargement...
        </div>
      </AppLayout>
    );
  }

  const {
    case: caseData,
    patient,
    preop_questionnaire,
    clinical_scores,
    perop_session,
    perop_vitals,
    perop_events,
    postop_stay,
    postop_observations,
    alerts,
  } = data;

  return (
    <AppLayout
      title="Case Detail"
      subtitle="Integrated perioperative anesthesia record"
    >
      <button
        onClick={() => navigate("/cases")}
        className="mb-6 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        ← Back to cases
      </button>

      <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
              Anesthesia Record
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="mt-2 text-slate-300">
              Procedure: {caseData.surgery_type}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Patient ID</p>
          <p className="mt-2 truncate font-semibold text-slate-800">{patient.id}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Birth date</p>
          <p className="mt-2 font-semibold text-slate-800">{patient.birth_date}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Gender</p>
          <p className="mt-2 font-semibold text-slate-800">{patient.gender}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-400">Case status</p>
          <p className="mt-2 font-semibold text-slate-800">{caseData.status}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <SectionCard title="Pre-operative">
          {preop_questionnaire ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Language:</span> {preop_questionnaire.language}</p>
              <p><span className="font-semibold">Validation:</span> {preop_questionnaire.validation_status}</p>
              <p><span className="font-semibold">Responses:</span> {preop_questionnaire.responses?.length || 0}</p>
            </div>
          ) : (
            <p className="text-slate-500">No pre-operative data available.</p>
          )}
        </SectionCard>

        <SectionCard title="Clinical Scores">
          {clinical_scores?.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {clinical_scores.map((score) => (
                <div
                  key={score.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-400">{score.score_type}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {score.score_value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No scores available.</p>
          )}
        </SectionCard>

        <SectionCard title="Per-operative">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Session</p>
              <p className="mt-2 font-semibold text-slate-800">
                {perop_session ? perop_session.status : "No session"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Vitals</p>
              <p className="mt-2 font-semibold text-slate-800">
                {perop_vitals?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Events</p>
              <p className="mt-2 font-semibold text-slate-800">
                {perop_events?.length || 0}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Post-operative">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Stay</p>
              <p className="mt-2 font-semibold text-slate-800">
                {postop_stay ? postop_stay.status : "No stay"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-400">Observations</p>
              <p className="mt-2 font-semibold text-slate-800">
                {postop_observations?.length || 0}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Alerts">
          {alerts?.length ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-red-700">{alert.title}</p>
                    <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      {alert.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No alerts.</p>
          )}
        </SectionCard>
      </div>
    </AppLayout>
  );
}