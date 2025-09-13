import React, { useState } from "react"
import { useKeyboard } from "@opentui/react"
import { useIrcClient } from "../hooks/useIrcClient"
import { ConnectionDialog } from "./ConnectionDialog.tsx"
import { MessageArea } from "./MessageArea.tsx"
import { ChannelTabs } from "./ChannelTabs.tsx"
import { MessageInput } from "./MessageInput.tsx"
import { StatusBar } from "./StatusBar.tsx"
import { HelpBar } from "./HelpBar.tsx"

// Declare global type for renderer
declare global {
  var renderer: {
    console: {
      toggle(): void
      show(): void
      hide(): void
    }
  }
}

export function IRCApp() {
  console.log("IRCApp component rendering")
  const [showConnectionDialog, setShowConnectionDialog] = useState(true)
  const [activeChannelIndex, setActiveChannelIndex] = useState(0)

  const {
    connectionState,
    channels,
    currentNick,
    connect,
    disconnect,
    sendMessage,
    sendCommand
  } = useIrcClient()

  console.log("Connection state:", connectionState)
  console.log("Channels:", channels.length)
  console.log("Show connection dialog:", showConnectionDialog)

  // Global keyboard shortcuts
  useKeyboard((key) => {
    // Try multiple ways to detect Cmd + `
    const isToggleConsole =
      key.sequence === "cmd+`" ||
      key.sequence === "⌘+`" ||
      (key.meta && key.sequence === "`") ||
      (key.meta && key.name === "`") ||
      (key.name === "`" && key.meta)

    if (isToggleConsole) {
      console.log("Console toggle detected!")
      if (global.renderer && global.renderer.console) {
        global.renderer.console.toggle()
        console.log("Console toggled with Cmd + `")
      } else {
        console.warn("Renderer not available for console toggle")
      }
    }
  })

  const handleConnect = async (server: string, port: number, nick: string) => {
    try {
      await connect(server, port, nick)
      setShowConnectionDialog(false)
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }

  // Ensure activeChannelIndex is valid
  const safeActiveChannelIndex = channels.length > 0 ? Math.min(activeChannelIndex, channels.length - 1) : 0
  const activeChannel = channels.length > 0 ? channels[safeActiveChannelIndex] : undefined

  const handleMessage = (message: string) => {
    if (activeChannel) {
      sendMessage(activeChannel.name, message)
    } else {
      // No active channel - show error message to user
      console.warn("Cannot send message: no active channel")
      // Emit system message to inform user
      if (channels.length === 0) {
        // No channels at all - user needs to join one
        console.log("No channels available. User needs to join a channel first.")
        // Can't emit system message with no channels, so just log for now
      } else {
        // Channels exist but index is invalid - emit to first available channel
        sendCommand("system", ["No active channel selected"], channels[0]?.name)
      }
    }
  }

  const handleCommand = (command: string, args: string[]) => {
    sendCommand(command, args, activeChannel?.name)
  }

  const handleChannelSwitch = () => {
    if (channels.length > 0) {
      setActiveChannelIndex((prev) => (prev + 1) % channels.length)
    }
  }

  if (showConnectionDialog) {
    return (
      <ConnectionDialog
        onConnect={handleConnect}
        isConnecting={connectionState === "connecting"}
      />
    )
  }

  return (
    <box flexDirection="column" width="100%" height="100%">
      <StatusBar
        connectionState={connectionState}
        currentChannel={activeChannel?.name}
        currentNick={currentNick}
        userCount={activeChannel?.users.size}
      />

      <ChannelTabs
        channels={channels}
        activeIndex={safeActiveChannelIndex}
        onChannelChange={setActiveChannelIndex}
      />

      <box flexGrow={1}>
        <MessageArea channel={activeChannel} />
      </box>

      <MessageInput onMessage={handleMessage} onCommand={handleCommand} onChannelSwitch={handleChannelSwitch} />

      <HelpBar />
    </box>
  )
}