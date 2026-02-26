"use client"

import { ThemeProvider, type ThemeProviderProps } from "next-themes"

export function ColorModeProvider(props: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}
