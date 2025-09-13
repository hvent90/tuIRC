import { For, Show, createSignal, createEffect } from "solid-js"
import type { Channel } from "../types"
import { MessageItem } from "./MessageItem"

export interface MessageAreaProps {
  channel?: Channel
}

export function MessageArea(props: MessageAreaProps) {
  const [streamingMessage, setStreamingMessage] = createSignal<{
    id: string
    content: string
    fullContent: string
    isComplete: boolean
  } | null>(null)

  // Handle streaming message updates
  createEffect(() => {
    if (props.channel?.latestMessage && !props.channel.latestMessage.isComplete) {
      startMessageStream(props.channel.latestMessage)
    }
  })

  const startMessageStream = (message: any) => {
    const chunkSize = Math.floor(Math.random() * 3) + 1 // 1-3 chars per chunk
    let currentIndex = 0
    const channel = props.channel

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
        // Mark message as complete in the channel
        if (channel) {
          const msgIndex = channel.messages.findIndex((m) => m.id === message.id)
          if (msgIndex !== -1) {
            channel.messages[msgIndex]!.isComplete = true
          }
        }
      }
    }, 32) // ~30fps for smooth streaming
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
      <Show
        when={props.channel?.messages?.length}
        fallback={
          <box justifyContent="center" alignItems="center" padding={2}>
            <text style={{ fg: "#666666" }}>No messages yet. Start typing to join the conversation!</text>
          </box>
        }
      >
        <For each={props.channel?.messages || []}>
          {(message) => (
            <MessageItem
              message={message}
              isStreaming={streamingMessage()?.id === message.id}
              streamContent={streamingMessage()?.content}
            />
          )}
        </For>
      </Show>
    </scrollbox>
  )
}
