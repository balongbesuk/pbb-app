"use client";

import { useEffect, useState } from "react";

export function usePublicTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default to dark for premium feel

  useEffect(() => {
    const savedTheme = localStorage.getItem("public-theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("public-theme", newTheme);
  };

  return { theme, toggleTheme };
}
