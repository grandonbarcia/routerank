declare module 'react-syntax-highlighter' {
  import * as React from 'react';

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: unknown;
    showLineNumbers?: boolean;
    wrapLines?: boolean;
    customStyle?: React.CSSProperties;
    codeTagProps?: React.HTMLAttributes<HTMLElement>;
    children?: React.ReactNode;
    [key: string]: unknown;
  }

  const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/hljs' {
  export const atomOneDark: unknown;
  export const atomOneLight: unknown;
  const styles: Record<string, unknown>;
  export default styles;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/hljs' {
  export const atomOneDark: unknown;
  export const atomOneLight: unknown;
  const styles: Record<string, unknown>;
  export default styles;
}
