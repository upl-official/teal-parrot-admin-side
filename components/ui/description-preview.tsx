"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DescriptionPreviewProps {
  description: string
}

export function DescriptionPreview({ description }: DescriptionPreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  const formatDescription = (text: string) => {
    if (!text) return ""

    // Replace <br> with line breaks
    let formatted = text.replace(/<br>/g, "\n")

    // Replace *text* with bold
    formatted = formatted.replace(/\*(.*?)\*/g, "<strong>$1</strong>")

    // Replace _text_ with italic
    formatted = formatted.replace(/_(.*?)_/g, "<em>$1</em>")

    // Replace ~text~ with strikethrough
    formatted = formatted.replace(/~(.*?)~/g, "<del>$1</del>")

    // Replace <h>text</h> with heading
    formatted = formatted.replace(/<h>(.*?)<\/h>/g, '<h3 class="text-lg font-semibold mb-2">$1</h3>')

    // Replace => with bullet points
    formatted = formatted.replace(/=>(.*?)(?:\n|$)/g, "<li>$1</li>")

    // Wrap lists in ul tags if they exist
    if (formatted.includes("<li>")) {
      formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul class="list-disc pl-5 mb-4">$&</ul>')
    }

    return formatted
  }

  if (!description.trim()) {
    return null
  }

  return (
    <div className="mt-4">
      <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="mb-2">
        {showPreview ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide Preview
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Preview Description
          </>
        )}
      </Button>

      {showPreview && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Description Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatDescription(description) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
