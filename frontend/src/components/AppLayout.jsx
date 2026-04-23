import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <div className="ml-72 min-h-screen">
        <Header title={title} subtitle={subtitle} />

        <main className="p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}