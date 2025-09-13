import React, { useState } from "react"
import { useKeyboard } from "@opentui/react"

interface ConnectionDialogProps {
  onConnect: (server: string, port: number, nick: string) => void
  isConnecting: boolean
}

export function ConnectionDialog({ onConnect, isConnecting }: ConnectionDialogProps) {
  const [server, setServer] = useState("irc.libera.chat")
  const [port, setPort] = useState(6667)
  const [nick, setNick] = useState("")
  const [focusedField, setFocusedField] = useState<"server" | "port" | "nick" | "submit">("server")

  const handleSubmit = () => {
    if (server && port && nick) {
      onConnect(server, port, nick)
    }
  }

  useKeyboard((key) => {
    if (key.name === "tab") {
      setFocusedField(prev => {
        switch (prev) {
          case "server": return "port"
          case "port": return "nick"
          case "nick": return "submit"
          case "submit": return "server"
          default: return "server"
        }
      })
    }
    if (key.name === "enter" || key.name === "return") {
      handleSubmit()
    }
  })

  return (
    <box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      padding={2}
    >
      <box
        flexDirection="column"
        width={60}
        height={18}
        border={true}
        borderStyle="single"
        padding={2}
        style={{ backgroundColor: "#1a1b26", gap: 1 }}
      >
        <box justifyContent="center">
          <text style={{ fg: "#bb9af7" }}>
            IRC Client Connection
          </text>
        </box>

        {/* Server Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Server:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={server}
              onInput={setServer}
              onSubmit={handleSubmit}
              focused={focusedField === "server"}
              placeholder="irc.libera.chat"
            />
          </box>
        </box>

        {/* Port Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Port:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={port.toString()}
              onInput={(value: string) => setPort(parseInt(value) || 6667)}
              onSubmit={handleSubmit}
              focused={focusedField === "port"}
              placeholder="6667"
            />
          </box>
        </box>

        {/* Nickname Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Nickname:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={nick}
              onInput={setNick}
              onSubmit={handleSubmit}
              focused={focusedField === "nick"}
              placeholder="Enter your nickname"
            />
          </box>
        </box>

        {/* Submit Button Alternative - Using Select */}
        <box marginTop={1}>
          <select
            options={[{
              name: isConnecting ? "Connecting..." : "Connect",
              value: "connect",
              description: isConnecting ? "Please wait..." : "Connect to IRC server"
            }]}
            focused={focusedField === "submit"}
            onChange={(index, option) => {
              if (option?.value === "connect" && !isConnecting) {
                handleSubmit()
              }
            }}
            style={{
              height: 3,
              backgroundColor: isConnecting ? "#414868" : "#9ece6a",
              focusedBackgroundColor: isConnecting ? "#565f89" : "#b3f95c"
            }}
          />
        </box>

        {isConnecting && (
          <box justifyContent="center">
            <text style={{ fg: "#e0af68" }}>
              Connecting to {server}:{port}...
            </text>
          </box>
        )}
      </box>
    </box>
  )
}