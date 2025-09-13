import React from "react"

export function HelpBar() {
  return (
    <box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#1a1b26" }}
    >
      <text style={{ fg: "#565f89" }}>
        /join #channel | /part #channel | /nick newname | /quit | /help
      </text>

      <box flexGrow={1} />

      <text style={{ fg: "#565f89" }}>
        ↑/↓ History | Tab: Switch channels
      </text>
    </box>
  )
}