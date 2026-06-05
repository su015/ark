import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const ctx = useTheme();
  if (!ctx) return null;
  const { theme, toggle } = ctx;
  return (
    <button
      onClick={toggle}
      className={`theme-track inline-flex items-center ${className}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      data-cursor-label="SWAP"
      data-testid="theme-toggle"
    >
      <span className="theme-knob" />
    </button>
  );
}
