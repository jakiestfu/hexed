import React from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"

import { Separator } from "@hexed/ui"
import { cn } from "@hexed/ui/lib/utils"

export interface MarkdownRendererProps {
  content: string
  className?: string
  compressed?: boolean
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  compressed = false
}) => {
  const spacing = {
    paragraphMargin: compressed
      ? "[&:not(:first-child)]:mt-4"
      : "[&:not(:first-child)]:mt-6",
    blockquoteMargin: compressed ? "mt-4" : "mt-6",
    blockquotePadding: compressed ? "pl-4" : "pl-6",
    listMarginY: compressed ? "my-4" : "my-6",
    listMarginLeft: compressed ? "ml-4" : "ml-6",
    codeBlockMargin: compressed ? "my-4" : "my-6",
    tableMargin: compressed ? "my-4" : "my-6"
  }

  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1
        className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="scroll-m-20 text-2xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="scroll-m-20 text-xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        className="scroll-m-20 text-lg font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="scroll-m-20 text-base font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p
        className={cn(spacing.paragraphMargin)}
        {...props}
      >
        {children}
      </p>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className={cn(
          "border-l-2 italic",
          spacing.blockquoteMargin,
          spacing.blockquotePadding
        )}
        {...props}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul
        className={cn(
          "list-disc [&>li]:mt-2",
          spacing.listMarginY,
          spacing.listMarginLeft
        )}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className={cn(
          "list-decimal [&>li]:mt-2",
          spacing.listMarginY,
          spacing.listMarginLeft
        )}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    code: ({ className, children, ...props }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code
            className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            {...props}
          >
            {children}
          </code>
        )
      }
      return (
        <code
          className={cn("font-mono text-sm", className)}
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => {
      return (
        <div className={cn("w-full overflow-y-auto", spacing.codeBlockMargin)}>
          <pre
            className="bg-muted rounded-lg p-4 overflow-x-auto"
            {...props}
          >
            {children}
          </pre>
        </div>
      )
    },
    a: ({ children, ...props }) => (
      <a
        className="text-primary underline-offset-4 hover:underline"
        target={props.target || "_blank"}
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    table: ({ children, ...props }) => (
      <div className={cn("w-full overflow-y-auto", spacing.tableMargin)}>
        <table
          className="w-full"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr
        className="even:bg-muted m-0 border-t p-0"
        {...props}
      >
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      >
        {children}
      </td>
    ),
    hr: () => <Separator className="my-4" />,
    strong: ({ children, ...props }) => (
      <strong
        className="font-semibold"
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em
        className="italic"
        {...props}
      >
        {children}
      </em>
    )
  }

  return (
    <div className={cn(className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
