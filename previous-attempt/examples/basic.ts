#!/usr/bin/env bun
import { IrcClient } from "../src/index"

async function main() {
  console.log("Testing IRC Client...")

  const client = new IrcClient()

  client.on("connected", () => {
    console.log("Connected to IRC server!")
    client.join("#test")
  })

  client.on("message", (message) => {
    console.log(`[${message.timestamp.toLocaleTimeString()}] <${message.nick}> ${message.content}`)
  })

  client.on("error", (error) => {
    console.error("IRC Error:", error)
  })

  try {
    await client.connect("irc.libera.chat", 6667, "opentui-test-" + Math.random().toString(36).substring(2, 6))
    console.log("Connection initiated...")

    // Wait for a bit then disconnect
    setTimeout(() => {
      console.log("Disconnecting...")
      client.disconnect()
      process.exit(0)
    }, 10000)
  } catch (error) {
    console.error("Failed to connect:", error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}
