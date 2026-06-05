import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && user !== false) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="font-display text-4xl text-[var(--fg)]">ARK<span className="text-[var(--accent)]">.</span>ADMIN</div>
          <p className="text-[var(--fg-dim)] text-sm mt-2 font-mono uppercase tracking-widest">[ restricted area ]</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6" data-testid="admin-login-form">
          <div className="border-b border-[var(--line)] pb-3">
            <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-lg text-[var(--fg)]"
              data-testid="admin-email"
              placeholder="admin@arketype.studio"
            />
          </div>
          <div className="border-b border-[var(--line)] pb-3">
            <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-lg text-[var(--fg)]"
              data-testid="admin-password"
            />
          </div>
          {error && (
            <div className="text-[var(--accent)] font-mono text-xs uppercase tracking-widest" data-testid="admin-error">{error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-solid w-full justify-center disabled:opacity-50" data-testid="admin-submit">
            {loading ? "Authenticating…" : "Enter →"}
          </button>
        </form>

        <a href="/" className="block mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] ulink">← Back to site</a>
      </div>
    </div>
  );
}
