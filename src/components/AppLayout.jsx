import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useTheme } from "../utils/useTheme";

const AppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: "/dashboard", icon: "📊", label: "Dashboard" },
    { path: "/timer", icon: "⏱️", label: "Focus Timer" },
    { path: "/goals", icon: "🎯", label: "Goals" },
    { path: "/insights", icon: "💡", label: "Insights" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Focus Coach</h3>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link to="/settings" className="nav-item">
            ⚙️ Settings
          </Link>
        </div>
      </aside>
      <main className="app-content">{children}</main>
    </div>
  );
};

export default AppLayout;
