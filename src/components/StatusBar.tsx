import React from "react"
import type { ConnectionState } from "../types"

interface StatusBarProps {
  connectionState: ConnectionState
  currentChannel?: string
  currentNick?: string
  userCount?: number
}

export const StatusBar = React.memo(({
  connectionState,
  currentChannel,
  currentNick,
  userCount
}: StatusBarProps) => {
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return "#9ece6a"
      case 'connecting': return "#e0af68"
      case 'error': return "#f7768e"
      default: return "#565f89"
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return '● Connected'
      case 'connecting': return '● Connecting...'
      case 'error': return '● Connection Error'
      default: return '● Disconnected'
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
      <text style={{ fg: getStatusColor() }}>
        {getStatusText()}
      </text>

      {currentNick && (
        <text style={{ fg: "#7aa2f7", marginLeft: 2 }}>
          {currentNick}
        </text>
      )}

      <box flexGrow={1} />

      {currentChannel && (
        <text style={{ fg: "#bb9af7" }}>
          {currentChannel} {userCount ? `(${userCount})` : ''}
        </text>
      )}
    </box>
  )
})