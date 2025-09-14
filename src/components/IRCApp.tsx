import React, { useState, useCallback } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"
import { useIrc } from "../contexts/IrcContext"
import { ConnectionDialog } from "./ConnectionDialog.tsx"
import { MessageArea } from "./MessageArea.tsx"
import { ChannelTabs } from "./ChannelTabs.tsx"
import { MessageInput } from "./MessageInput.tsx"
import { StatusBar } from "./StatusBar.tsx"
import { HelpBar } from "./HelpBar.tsx"



export function IRCApp() {
  const renderer = useRenderer()
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
  } = useIrc()

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
      if (renderer?.console) {
        renderer.console.toggle()
        console.log("Console toggled with Cmd + `")
      } else {
        console.warn("Renderer not available for console toggle")
      }
    }
  })

  const handleConnect = useCallback(async (server: string, port: number, nick: string) => {
    console.log("handleConnect called with:", server, port, nick)

    // Prevent double connection attempts
    if (connectionState === "connecting" || connectionState === "connected") {
      console.log("Already connecting or connected, ignoring duplicate call")
      return
    }

    try {
      await connect(server, port, nick)
      setShowConnectionDialog(false)
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }, [connect, connectionState])

  // Ensure activeChannelIndex is valid with comprehensive bounds checking
  const activeChannel = channels && channels.length > 0 && activeChannelIndex >= 0 && activeChannelIndex < channels.length
    ? channels[activeChannelIndex]
    : undefined

  const handleMessage = useCallback((message: string) => {
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
  }, [activeChannel, sendMessage, sendCommand, channels])

  const handleCommand = useCallback((command: string, args: string[]) => {
    sendCommand(command, args, activeChannel?.name)
  }, [sendCommand, activeChannel?.name])

  const handleChannelSwitch = useCallback(() => {
    if (channels.length > 0) {
      setActiveChannelIndex((prev) => (prev + 1) % channels.length)
    }
  }, [channels.length])

  const handleChannelSwitchBackward = useCallback(() => {
    if (channels.length > 0) {
      setActiveChannelIndex((prev) => (prev - 1 + channels.length) % channels.length)
    }
  }, [channels.length])

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
        activeIndex={activeChannelIndex}
        onChannelChange={setActiveChannelIndex}
      />

      <box flexGrow={1}>
        <MessageArea channel={activeChannel} />
      </box>

      <MessageInput onMessage={handleMessage} onCommand={handleCommand} onChannelSwitch={handleChannelSwitch} onChannelSwitchBackward={handleChannelSwitchBackward} />

      <HelpBar />
    </box>
  )
}