import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Overview of perioperative anesthesia activity"
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Module</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Pre-op</h3>
          <p className="mt-2 text-sm text-slate-500">
            Questionnaire, validation, clinical scores.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Module</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Per-op</h3>
          <p className="mt-2 text-sm text-slate-500">
            Monitoring, alerts, intraoperative events.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">Module</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Post-op</h3>
          <p className="mt-2 text-sm text-slate-500">
            Recovery follow-up and discharge readiness.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white shadow-lg">
        <h3 className="text-2xl font-bold">Clinical case workspace</h3>
        <p className="mt-2 max-w-2xl text-blue-50">
          Access active anesthesia records, review perioperative summaries and
          navigate through the complete patient workflow.
        </p>

        <button
          onClick={() => navigate("/cases")}
          className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Open cases
        </button>
      </div>
    </AppLayout>
  );
}