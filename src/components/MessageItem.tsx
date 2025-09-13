import React from "react"
import type { Message } from "../types"

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  streamContent?: string
  key?: string
}

export const MessageItem = React.memo(({ message, isStreaming, streamContent }: MessageItemProps) => {
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

  return (
    <box flexDirection="row" paddingLeft={1} paddingRight={1} paddingBottom={0}>
      <text style={{ fg: "#565f89", width: 8 }}>
        {formatTimestamp(message.timestamp)}
      </text>

      <text style={{ fg: "#7aa2f7", width: 12, marginRight: 1 }}>
        {message.nick}
      </text>

      <text style={{ fg: getMessageColor() }}>
        {displayContent}{showCursor ? "█" : ""}
      </text>
    </box>
  )
})