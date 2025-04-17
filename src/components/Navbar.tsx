
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";

const NavItem = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "px-4 py-2 rounded-md transition-all duration-300 ease-in-out text-sm font-medium",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      {children}
    </Link>
  );
};

export const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/products">Products</NavItem>
          <NavItem to="/clients">Clients</NavItem>
          <NavItem to="/receipts">Receipts</NavItem>
          <NavItem to="/receipt/new">New Receipt</NavItem>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                logout();
                navigate('/login');
              }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
