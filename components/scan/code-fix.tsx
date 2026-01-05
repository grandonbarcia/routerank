'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeFixProps {
  code: string;
  language?: string;
  suggestion?: string;
  onCopy?: (code: string) => void;
}

export function CodeFix({
  code,
  language = 'javascript',
  suggestion,
  onCopy,
}: CodeFixProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy?.(code);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 space-y-2">
      {suggestion && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-3">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
            Fix Suggestion:
          </p>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-300">
            {suggestion}
          </p>
        </div>
      )}

      <div className="rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-900 px-3 py-2">
          <p className="text-xs font-semibold text-gray-400">
            {language.toUpperCase()}
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy
              </>
            )}
          </button>
        </div>
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={language}
            style={atomOneDark}
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              padding: '12px',
              borderRadius: 0,
              backgroundColor: '#1e1e1e',
              fontSize: '13px',
              lineHeight: '1.5',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'Fira Code, monospace',
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
