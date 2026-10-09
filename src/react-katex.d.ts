declare module 'react-katex' {
  import type { FC, ReactElement } from 'react'

  interface KatexProps {
    math: string
    block?: boolean
    errorColor?: string
    renderError?: (error: Error) => ReactElement
  }

  export const InlineMath: FC<KatexProps>
  export const BlockMath: FC<KatexProps>
}
