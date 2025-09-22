"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeButton = () => {
  const { setTheme } = useTheme();
  const [theme, setThemeState] = useState("system");
  return (    
    <Button variant="outline" size="icon" onClick={() => {
      const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
      setThemeState(nextTheme);
      setTheme(nextTheme);
    }} className="cursor-pointer">
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeButton;
