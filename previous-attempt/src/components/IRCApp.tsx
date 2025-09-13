import { createSignal, Show } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { useIrcClient } from "../hooks/useIrcClient"
import { ConnectionDialog } from "./ConnectionDialog"
import { MessageArea } from "./MessageArea"
import { ChannelTabs } from "./ChannelTabs"
import { MessageInput } from "./MessageInput"
import { StatusBar } from "./StatusBar"
import { HelpBar } from "./HelpBar"

export function IRCApp() {
  const [showConnectionDialog, setShowConnectionDialog] = createSignal(true)
  const [activeChannelIndex, setActiveChannelIndex] = createSignal(0)

  const { connectionState, channels, currentNick, connect, disconnect, join, sendMessage, sendCommand } = useIrcClient()

  const handleConnect = async (server: string, port: number, nick: string) => {
    try {
      await connect(server, port, nick)
      setShowConnectionDialog(false)
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }

  const handleMessage = (message: string) => {
    const activeChannel = channels()[activeChannelIndex()]
    if (activeChannel) {
      sendMessage(activeChannel.name, message)
    }
  }

  const handleCommand = (command: string, args: string[]) => {
    sendCommand(command, args)
  }

  const activeChannel = () => channels()[activeChannelIndex()] || undefined

  // Keyboard shortcuts
  useKeyboard((key) => {
    switch (key.name) {
      case "f1":
        // Toggle help (could show help dialog)
        console.log("F1: Help")
        break

      case "f2":
        // Quick reconnect
        if (connectionState() === "disconnected" || connectionState() === "error") {
          // Reconnect with last settings (would need to store these)
          console.log("F2: Reconnect")
        }
        break

      case "escape":
        // Focus message input (already focused by default)
        console.log("Escape: Focus input")
        break

      case "tab":
        // Cycle through channels
        if (key.shift) {
          // Previous channel
          const prevIndex = activeChannelIndex() - 1
          setActiveChannelIndex(prevIndex < 0 ? channels().length - 1 : prevIndex)
        } else {
          // Next channel
          const nextIndex = activeChannelIndex() + 1
          setActiveChannelIndex(nextIndex >= channels().length ? 0 : nextIndex)
        }
        break

      case "c":
        // Ctrl+C graceful disconnect
        if (key.ctrl) {
          console.log("Ctrl+C: Disconnecting...")
          disconnect()
          process.exit(0)
        }
        break
    }
  })

  return (
    <Show
      when={!showConnectionDialog()}
      fallback={<ConnectionDialog onConnect={handleConnect} isConnecting={connectionState() === "connecting"} />}
    >
      <box flexDirection="column" width="100%" height="100%">
        <StatusBar
          connectionState={connectionState()}
          currentChannel={activeChannel()?.name}
          currentNick={currentNick()}
          userCount={activeChannel()?.users.size}
        />

        <ChannelTabs channels={channels()} activeIndex={activeChannelIndex()} onChannelChange={setActiveChannelIndex} />

        <box flexGrow={1}>
          <MessageArea channel={activeChannel()} />
        </box>

        <MessageInput onMessage={handleMessage} onCommand={handleCommand} />

        <HelpBar />
      </box>
    </Show>
  )
}
