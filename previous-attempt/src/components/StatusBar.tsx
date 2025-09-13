import type { ConnectionState } from "../types"

export interface StatusBarProps {
  connectionState: ConnectionState
  currentChannel?: string
  currentNick?: string
  userCount?: number
}

export function StatusBar(props: StatusBarProps) {
  const statusColor = () => {
    switch (props.connectionState) {
      case "connected":
        return "#00ff00"
      case "connecting":
        return "#ffff00"
      case "reconnecting":
        return "#ff8800"
      case "error":
        return "#ff0000"
      default:
        return "#666666"
    }
  }

  const statusText = () => {
    switch (props.connectionState) {
      case "connected":
        return "● Connected"
      case "connecting":
        return "○ Connecting..."
      case "reconnecting":
        return "◐ Reconnecting..."
      case "error":
        return "● Connection Error"
      default:
        return "○ Disconnected"
    }
  }

  return (
    <box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#24283b" }}
    >
      <text style={{ fg: statusColor() }}>{statusText()}</text>

      <box flexGrow={1} />

      {props.currentNick && <text style={{ fg: "#7aa2f7", marginRight: 2 }}>{props.currentNick}</text>}

      {props.currentChannel && (
        <text style={{ fg: "#bb9af7" }}>
          {props.currentChannel}
          {props.userCount !== undefined && ` (${props.userCount})`}
        </text>
      )}
    </box>
  )
}
