export function HelpBar() {
  return (
    <box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#1f2335", fg: "#666666" }}
    >
      <text>F1:Help</text>
      <text marginLeft={2}>F2:Reconnect</text>
      <text marginLeft={2}>Tab:Next Channel</text>
      <text marginLeft={2}>Esc:Focus Input</text>

      <box flexGrow={1} />

      <text>Ctrl+C:Quit</text>
    </box>
  )
}
