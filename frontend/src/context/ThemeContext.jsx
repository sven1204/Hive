import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Clair par défaut : l'ambiance crème/miel porte mieux la convivialité de Hive.
  // Le choix explicite de l'utilisateur (bouton du Header) reste mémorisé.
  const [theme, setTheme] = useState(() => localStorage.getItem("hive-theme") || "light");

  useEffect(() => {
    document.body.classList.toggle("light", theme === "light");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#fbf6ee" : "#16120e");
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("hive-theme", next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
