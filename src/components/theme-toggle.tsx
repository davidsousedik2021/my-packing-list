import { useEffect, useMemo } from "react";
import { useLocalStorage } from "@/lib/hooks";
import ResetButton from "./reset-button";

type ThemeSetting = "system" | "light" | "dark";
type Theme = "light" | "dark";

const getSystemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

function applyThemeToDom(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [setting, setSetting, clearSetting] = useLocalStorage<ThemeSetting>(
    "theme",
    "system",
    { version: "1" }
  );

  const effectiveTheme = useMemo<Theme>(
    () => (setting === "system" ? getSystemTheme() : setting),
    [setting]
  );

  useEffect(() => {
    applyThemeToDom(effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (setting === "system") applyThemeToDom(getSystemTheme());
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [setting]);

  return (
    <section className="form">
      <div className="muted small">
        Theme: <strong>{effectiveTheme}</strong>{" "}
        {setting === "system" ? <em>(system)</em> : null}
      </div>

      <div className="form-row">
        {(["system", "light", "dark"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setSetting(opt)}
            className={`btn ${setting === opt ? "btn-primary" : "btn-ghost"}`}
          >
            {opt[0].toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      <ResetButton onReset={clearSetting}>Reset theme</ResetButton>
    </section>
  );
}