import { createSignal } from "solid-js"

export interface ConnectionDialogProps {
  onConnect: (server: string, port: number, nick: string) => void
  isConnecting: boolean
}

export function ConnectionDialog(props: ConnectionDialogProps) {
  const [server, setServer] = createSignal("irc.libera.chat")
  const [port, setPort] = createSignal(6667)
  const [nick, setNick] = createSignal("")
  const [focusedField, setFocusedField] = createSignal(0)

  const handleConnect = () => {
    if (nick().trim()) {
      props.onConnect(server(), port(), nick().trim())
    }
  }

  return (
    <box justifyContent="center" alignItems="center" width="100%" height="100%">
      <box
        flexDirection="column"
        width={50}
        height={15}
        border={true}
        padding={2}
        style={{ backgroundColor: "#1f2335" }}
      >
        <box justifyContent="center" marginBottom={2}>
          <text>Connect to IRC Server</text>
        </box>

        <text>Server:</text>
        <input value={server()} onInput={setServer} focused={focusedField() === 0} marginBottom={1} />

        <text>Port:</text>
        <input
          value={port().toString()}
          onInput={(value) => setPort(parseInt(value) || 6667)}
          focused={focusedField() === 1}
          marginBottom={1}
        />

        <text>Nickname:</text>
        <input
          value={nick()}
          onInput={setNick}
          onSubmit={handleConnect}
          focused={focusedField() === 2}
          marginBottom={2}
        />

        <box flexDirection="row" justifyContent="center">
          <button onClick={handleConnect} disabled={props.isConnecting || !nick().trim()}>
            {props.isConnecting ? "Connecting..." : "Connect"}
          </button>
        </box>
      </box>
    </box>
  )
}
