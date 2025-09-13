import { createMemo } from "solid-js"
import type { Channel } from "../types"

export interface ChannelTabsProps {
  channels: Channel[]
  activeIndex: number
  onChannelChange: (index: number) => void
}

export function ChannelTabs(props: ChannelTabsProps) {
  const tabOptions = createMemo(() =>
    props.channels.map((channel, index) => ({
      name: channel.name,
      value: index,
      description: `${channel.users.size} users`,
    })),
  )

  return (
    <tab_select
      height={2}
      width="100%"
      options={tabOptions()}
      onChange={props.onChannelChange}
      showDescription={true}
      style={{
        backgroundColor: "#24283b",
        focusedBackgroundColor: "#2d3748",
        selectedBackgroundColor: "#7aa2f7",
        selectedTextColor: "#ffffff",
      }}
    />
  )
}
