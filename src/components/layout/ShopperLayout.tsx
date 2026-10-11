import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Aura from "./Aura";

export default function ShopperLayout() {
  return (
    <Aura>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </Aura>
  );
}