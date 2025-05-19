// src/theme/styled.d.ts
import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme {
    background: string
    foreground: string
    caret: string
    accent: string
    error: string
    success: string
    textPrimary: string
    textSecondary: string
    fontFamily: string
  }
}
