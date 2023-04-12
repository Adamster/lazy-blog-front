import { createContext, useContext, useEffect, useState } from "react";

const defaultTheme = {
  darkTheme: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext(defaultTheme);

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }: any) => {
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const localTheme = window.localStorage.getItem("darkTheme");

    if (localTheme) {
      setDarkTheme(true);
    }
  }, []);

  useEffect(() => {
    document.body.className = darkTheme ? "dark" : "";

    if (darkTheme) {
      window.localStorage.setItem("darkTheme", "true");
    } else {
      window.localStorage.removeItem("darkTheme");
    }
  }, [darkTheme]);

  const toggleTheme = () => {
    setDarkTheme((prevTheme) => !prevTheme);
  };

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
