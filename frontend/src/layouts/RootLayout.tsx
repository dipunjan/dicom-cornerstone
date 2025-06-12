import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="app-layout">
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
