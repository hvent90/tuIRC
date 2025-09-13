import React, { useState, useEffect } from "react"
import type { Channel, Message } from "../types"
import { MessageItem } from "./MessageItem"

export interface MessageAreaProps {
  channel?: Channel
}

export function MessageArea({ channel }: MessageAreaProps) {
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string
    content: string
    fullContent: string
    isComplete: boolean
  } | null>(null)

  useEffect(() => {
    if (channel?.latestMessage && !channel.latestMessage.isComplete) {
      const interval = startMessageStream(channel.latestMessage)
      return () => clearInterval(interval)
    }
  }, [channel?.latestMessage])

  const startMessageStream = (message: Message) => {
    const chunkSize = Math.floor(Math.random() * 3) + 1
    let currentIndex = 0

    const interval = setInterval(() => {
      currentIndex += chunkSize
      const content = message.content.slice(0, currentIndex)

      setStreamingMessage({
        id: message.id,
        content,
        fullContent: message.content,
        isComplete: currentIndex >= message.content.length,
      })

      if (currentIndex >= message.content.length) {
        clearInterval(interval)
        setStreamingMessage(null)
      }
    }, 32)

    return interval
  }

  return (
    <scrollbox
      scrollbarOptions={{ visible: true }}
      stickyScroll={true}
      stickyStart="bottom"
      paddingTop={1}
      paddingBottom={1}
      contentOptions={{
        flexGrow: 1,
        gap: 0,
      }}
      style={{
        backgroundColor: "#1a1b26",
        border: true,
        borderColor: "#414868",
      }}
    >
      {channel?.messages?.length ? (
        channel.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={streamingMessage?.id === message.id}
            streamContent={streamingMessage?.content}
          />
        ))
      ) : (
        <box justifyContent="center" alignItems="center" padding={2}>
          <text style={{ fg: "#666666" }}>
            No messages yet. Start typing to join the conversation!
          </text>
        </box>
      )}
    </scrollbox>
  )
}