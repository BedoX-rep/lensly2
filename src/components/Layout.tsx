
import { Navbar } from "./Navbar";
import { Link } from "react-router-dom";
import { useGlobalSubscriptionChecker } from "@/hooks/useSubscriptionStatus";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useGlobalSubscriptionChecker();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-[1920px]">
        {children}
      </main>
    </div>
  );
};

export default Layout;
