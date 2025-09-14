import React, { useState } from "react"
import { useKeyboard, useRenderer } from "@opentui/react"



interface MessageInputProps {
  onMessage: (message: string) => void
  onCommand: (command: string, args: string[]) => void
  onChannelSwitch?: () => void
  onChannelSwitchBackward?: () => void
}

export function MessageInput({ onMessage, onCommand, onChannelSwitch, onChannelSwitchBackward }: MessageInputProps) {
  const renderer = useRenderer()
  const [inputValue, setInputValue] = useState("")
  const [messageHistory, setMessageHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const handleSubmit = (value: string) => {
    if (!value.trim()) return

    // Add to history
    setMessageHistory(prev => [...prev, value].slice(-50))
    setHistoryIndex(-1)

    if (value.startsWith('/')) {
      // Parse command
      const parts = value.slice(1).split(' ')
      const command = parts[0] || ''
      const args = parts.slice(1)

      // Handle built-in debug command
      if (command === 'debug') {
        console.log("Debug command detected!")
        if (renderer?.console) {
          renderer.console.toggle()
          console.log("Console toggled with /debug command")
        } else {
          console.warn("Renderer not available for console toggle")
        }
        return
      }

      onCommand(command, args)
    } else {
      onMessage(value)
    }

    setInputValue('')
  }

  const handleKeyboard = (key: any) => {
    // Handle console toggle shortcut (Cmd + `)
    const isToggleConsole =
      key.sequence === "cmd+`" ||
      key.sequence === "⌘+`" ||
      (key.meta && key.sequence === "`") ||
      (key.meta && key.name === "`") ||
      (key.name === "`" && key.meta)

    if (isToggleConsole) {
      console.log("Console toggle detected in MessageInput!")
      if (renderer?.console) {
        renderer.console.toggle()
        console.log("Console toggled from MessageInput")
      }
      return // Don't process other key handling
    }

    if (key.name === 'tab') {
      // Handle tab for channel switching
      if (key.shift) {
        // Shift+Tab: cycle backward
        if (onChannelSwitchBackward) {
          onChannelSwitchBackward()
        }
      } else {
        // Tab: cycle forward
        if (onChannelSwitch) {
          onChannelSwitch()
        }
      }
    } else if (key.name === 'up') {
      if (historyIndex < messageHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex] || '')
      }
    } else if (key.name === 'down') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInputValue('')
      }
    }
  }

  useKeyboard(handleKeyboard)

  return (
    <box
      height={3}
      border={true}
      borderStyle="single"
      borderColor="#414868"
      style={{ backgroundColor: "#1f2335" }}
    >
      <input
        value={inputValue}
        onInput={setInputValue}
        onSubmit={handleSubmit}
        focused={true}
        placeholder="Type a message or /command..."
      />
    </box>
  )
}