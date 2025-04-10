"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  language: string;
  code: string;
  className?: string;
};

export function CodeBlock({ language, code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="absolute right-2 top-2">
        <button
          onClick={copyToClipboard}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-muted p-4">
        <pre className="font-mono text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}