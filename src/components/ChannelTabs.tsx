import React from "react"
import type { Channel } from "../types"

interface ChannelTabsProps {
  channels: Channel[]
  activeIndex: number
  onChannelChange: (index: number) => void
}

export function ChannelTabs({ channels, activeIndex, onChannelChange }: ChannelTabsProps) {
  if (channels.length === 0) {
    return (
      <box height={1} style={{ backgroundColor: "#24283b" }}>
        <text style={{ fg: "#565f89", marginLeft: 1 }}>
          No channels
        </text>
      </box>
    )
  }

  return (
    <box flexDirection="row" height={1} style={{ backgroundColor: "#24283b" }}>
      {channels.map((channel, index) => (
        <box
          key={channel.name}
          flexDirection="row"
          paddingLeft={1}
          paddingRight={1}
          style={{
            backgroundColor: index === activeIndex ? "#414868" : "transparent"
          }}
        >
          <text style={{
            fg: index === activeIndex ? "#7aa2f7" : "#565f89"
          }}>
            {index === activeIndex ? `[${channel.name}]` : channel.name}
          </text>
          {channel.users.size > 0 && (
            <text style={{ fg: "#9ece6a", marginLeft: 1 }}>
              ({channel.users.size})
            </text>
          )}
        </box>
      ))}
    </box>
  )
}