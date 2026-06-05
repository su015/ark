import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--fg-dim)] font-mono text-xs uppercase tracking-widest">
        Authenticating&hellip;
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}
