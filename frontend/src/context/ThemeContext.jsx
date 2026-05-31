import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Apply theme to document
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setThemeMode = (mode) => {
    if (mode === "light" || mode === "dark") {
      setTheme(mode);
    }
  };

  useEffect(() => {
    const onThemeChanged = () => {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      }
    };
    window.addEventListener("theme-changed", onThemeChanged);
    return () => window.removeEventListener("theme-changed", onThemeChanged);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
