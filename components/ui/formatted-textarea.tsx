"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Strikethrough, Heading, List, HelpCircle, CornerDownRight } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface FormattedTextareaProps {
  id: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  placeholder?: string
  className?: string
}

export function FormattedTextarea({
  id,
  name,
  value,
  onChange,
  rows = 4,
  placeholder,
  className,
}: FormattedTextareaProps) {
  const [helpOpen, setHelpOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (startTag: string, endTag = "") => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)

    // If text is selected, wrap it with tags
    // If no text is selected, insert tags and place cursor between them
    const newValue = endTag
      ? `${beforeText}${startTag}${selectedText}${endTag}${afterText}`
      : `${beforeText}${startTag}${selectedText}${afterText}`

    // Create a synthetic event to trigger the onChange handler
    const event = {
      target: {
        name,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>

    onChange(event)

    // Set focus back to textarea and adjust cursor position
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        // If text was selected, place cursor after the inserted formatting
        const newCursorPos = start + startTag.length + selectedText.length + endTag.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      } else {
        // If no text was selected, place cursor between tags
        const newCursorPos = start + startTag.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const formatActions = [
    {
      icon: Bold,
      tooltip: "Bold",
      action: () => insertFormatting("*", "*"),
      description: "Makes text bold: *text*",
    },
    {
      icon: Italic,
      tooltip: "Italic",
      action: () => insertFormatting("_", "_"),
      description: "Makes text italic: _text_",
    },
    {
      icon: Strikethrough,
      tooltip: "Strikethrough",
      action: () => insertFormatting("~", "~"),
      description: "Adds strikethrough: ~text~",
    },
    {
      icon: Heading,
      tooltip: "Heading",
      action: () => insertFormatting("<h>", "</h>"),
      description: "Creates a heading: <h>text</h>",
    },
    {
      icon: List,
      tooltip: "List Item",
      action: () => insertFormatting("=> "),
      description: "Creates a list item: => item",
    },
    {
      icon: CornerDownRight,
      tooltip: "Line Break",
      action: () => insertFormatting("<br>"),
      description: "Inserts a line break: <br>",
    },
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1 mb-2 bg-muted/50 p-1 rounded-md">
        <TooltipProvider>
          {formatActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="sm" onClick={action.action} className="h-8 w-8 p-0">
                  <action.icon className="h-4 w-4" />
                  <span className="sr-only">{action.tooltip}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Formatting Help</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Description Formatting Guide</DialogTitle>
                <DialogDescription>
                  Use these formatting options to enhance your product descriptions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {formatActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="bg-muted p-2 rounded-md">
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div className="text-sm">{action.description}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Example:</h4>
                  <p className="text-sm whitespace-pre-line">
                    <span className="font-bold">*Bold text*</span>
                    {"\n"}
                    <span className="italic">_Italic text_</span>
                    {"\n"}
                    <span className="line-through">~Strikethrough~</span>
                    {"\n"}
                    <span className="text-lg font-semibold">&lt;h&gt;Heading text&lt;/h&gt;</span>
                    {"\n"}• =&gt; List item 1{"\n"}• =&gt; List item 2
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </TooltipProvider>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      <div className="text-xs text-muted-foreground">
        Use the formatting tools above or type directly using *bold*, _italic_, ~strikethrough~,
        &lt;h&gt;heading&lt;/h&gt;, and =&gt; for lists.
      </div>
    </div>
  )
}
