"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  content: string;
  className?: string;
}

export default function MathText({ content, className = "" }: MathTextProps) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Regex to split by display math ($$...$$, \[...\]) or inline math ($...$, \(...\))
    // Also matches raw LaTeX expressions like \frac{...}{...}, \sqrt{...}, etc. if not wrapped in dollars
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?:\\\$|[^\$\n])+\$|\\\([\s\S]+?\\\))/g;

    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display / Block Math
      if (
        (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) ||
        (part.startsWith("\\[") && part.endsWith("\\]") && part.length >= 4)
      ) {
        const mathExpr = part.startsWith("$$")
          ? part.slice(2, -2).trim()
          : part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="block my-2 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      }

      // Inline Math
      if (
        (part.startsWith("$") && part.endsWith("$") && part.length >= 2) ||
        (part.startsWith("\\(") && part.endsWith("\\)") && part.length >= 4)
      ) {
        const mathExpr = part.startsWith("$")
          ? part.slice(1, -1).trim()
          : part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      }

      // Check if this segment contains raw un-delimited LaTeX commands like \frac or \sqrt or \int
      if (/\\(frac|sqrt|int|sum|prod|lim|alpha|beta|gamma|theta|pi|partial|cdot|times|pm|approx|neq|le|ge)\b/.test(part)) {
        try {
          const html = katex.renderToString(part.trim(), {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      }

      // Standard text segment
      return <span key={index}>{part}</span>;
    });
  }, [content]);

  return <span className={className}>{renderedElements}</span>;
}
