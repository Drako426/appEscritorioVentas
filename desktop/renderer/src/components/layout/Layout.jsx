import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="p-4 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
