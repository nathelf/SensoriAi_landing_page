import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Safe access to localStorage during initialization
  const getStoredTheme = (): Theme | null => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      return (v as Theme) || null;
    } catch {
      return null;
    }
  };

  // Inicializa com o valor salvo (se existir) ou com defaultTheme (ou "system")
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    // Não escrever aqui no localStorage (evitar efeitos colaterais durante render),
    // usaremos um effect na montagem para forçar "light" na primeira visita.
    return defaultTheme ?? "system";
  });

  // Na primeira montagem: se não houver nada no localStorage, definimos e persistimos "light".
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        // Primeiro acesso: definir padrão como "light"
        localStorage.setItem(storageKey, "light");
        setThemeState("light");
      }
    } catch {
      // falha silenciosa (ex: bloqueio de storage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // executa só na montagem

  // Sempre que o tema mudar: aplicar classe no root e persistir no localStorage.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const root = window.document.documentElement;

      // remover classes antigas
      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      // Persistir a escolha do usuário (se storage disponível)
      localStorage.setItem(storageKey, theme);
    } catch {
      // falha silenciosa
    }
  }, [theme, storageKey]);

  const value: ThemeProviderState = {
    theme,
    setTheme: (t: Theme) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, t);
        }
      } catch {
        // ignore
      }
      setThemeState(t);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
