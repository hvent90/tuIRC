import React from "react"
import { useTerminalDimensions } from "@opentui/react"
import type { Message } from "../types"

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  streamContent?: string
  key?: string
}

export const MessageItem = React.memo(({ message, isStreaming, streamContent }: MessageItemProps) => {
  const { width: terminalWidth } = useTerminalDimensions()
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour12: false })
  }

  const getMessageColor = () => {
    switch (message.type) {
      case "join":
      case "part":
      case "quit":
        return "#565f89"
      case "action":
        return "#ff9e64"
      case "system":
        return "#f7768e"
      default:
        return "#c0caf5"
    }
  }

  const displayContent = isStreaming && streamContent ? streamContent : message.content
  const showCursor = isStreaming && !message.isComplete

  // Calculate available width for message content
  // timestamp: 8, nick: 12, margin: 1, left padding: 1, right padding: 1, buffer: 2
  const availableWidth = Math.max(20, terminalWidth - 8 - 12 - 1 - 1 - 1 - 2)

  // Split long text into multiple lines
  const splitTextIntoLines = (text: string, maxWidth: number): string[] => {
    if (text.length <= maxWidth) return [text]

    const lines: string[] = []
    let remaining = text

    while (remaining.length > 0) {
      if (remaining.length <= maxWidth) {
        lines.push(remaining)
        break
      }

      // Find the last space within the width limit
      let cutIndex = maxWidth
      while (cutIndex > 0 && remaining[cutIndex] !== ' ') {
        cutIndex--
      }

      // If no space found, cut at maxWidth
      if (cutIndex === 0) {
        cutIndex = maxWidth
      }

      lines.push(remaining.slice(0, cutIndex).trim())
      remaining = remaining.slice(cutIndex).trim()
    }

    return lines
  }

  const textLines = splitTextIntoLines(`${displayContent}${showCursor ? "█" : ""}`, availableWidth)

  return (
    <box flexDirection="column" paddingLeft={1} paddingRight={1} paddingBottom={0}>
      {textLines.map((line, index) => (
        <box key={index} flexDirection="row">
          {index === 0 && (
            <>
              <text style={{ fg: "#565f89", width: 8 }}>
                {formatTimestamp(message.timestamp)}
              </text>

              <text style={{ fg: "#7aa2f7", width: 12, marginRight: 1 }}>
                {message.nick}
              </text>
            </>
          )}
          {index > 0 && (
            <>
              <text style={{ width: 8 }}></text>
              <text style={{ width: 12, marginRight: 1 }}></text>
            </>
          )}

          <text
            content={line}
            style={{ fg: getMessageColor(), width: availableWidth }}
          />
        </box>
      ))}
    </box>
  )
})