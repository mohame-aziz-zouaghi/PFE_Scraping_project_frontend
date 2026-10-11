import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import Aura from "./Aura";

export default function AdminLayout() {
  return (
    <Aura>
      <div className="min-h-screen flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopbar />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </Aura>
  );
}