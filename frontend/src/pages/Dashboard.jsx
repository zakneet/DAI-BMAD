import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">DAI Dashboard</h1>

      <button
        onClick={() => navigate("/cases")}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Voir les cases
      </button>
    </div>
  );
}