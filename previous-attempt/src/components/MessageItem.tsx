import { createMemo } from "solid-js"

export interface MessageItemProps {
  message: {
    id: string
    timestamp: Date
    nick: string
    content: string
    type: "message" | "action" | "join" | "part" | "quit" | "system"
    target: string
    isComplete?: boolean
  }
  isStreaming?: boolean
  streamContent?: string
}

export function MessageItem(props: MessageItemProps) {
  const timeString = createMemo(() =>
    props.message.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  )

  const messageColor = () => {
    switch (props.message.type) {
      case "join":
        return "#00ff00"
      case "part":
      case "quit":
        return "#ff6666"
      case "action":
        return "#ff00ff"
      case "system":
        return "#ffff00"
      default:
        return "#ffffff"
    }
  }

  const displayContent = () => {
    if (props.isStreaming && props.streamContent !== undefined) {
      return props.streamContent
    }
    return props.message.content
  }

  return (
    <box
      paddingLeft={1}
      paddingRight={1}
      style={{
        backgroundColor: props.message.type === "system" ? "#001122" : "transparent",
      }}
    >
      <box flexDirection="row">
        <text style={{ fg: "#666666", width: 8 }}>[{timeString()}]</text>
        <text style={{ fg: messageColor(), width: 15 }}>&lt;{props.message.nick}&gt;</text>
        <text style={{ fg: messageColor() }}>{displayContent()}</text>
        {props.isStreaming && !props.message.isComplete && <text style={{ fg: "#ffff00" }}>▊</text>}
      </box>
    </box>
  )
}
