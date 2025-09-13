import { useState, useEffect, useCallback } from "react"
import { IrcClient } from "../lib/IrcClient"
import type { Channel, ConnectionState } from "../types"

export function useIrcClient() {
  const [client] = useState(() => new IrcClient())
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentNick, setCurrentNick] = useState("")

  useEffect(() => {
    const handleConnected = () => setConnectionState("connected")
    const handleDisconnected = () => setConnectionState("disconnected")
    const handleError = (error: Error) => {
      console.error("IRC Error:", error)
      setConnectionState("error")
    }

    const handleMessage = (message: any) => {
      setChannels(prev => {
        return prev.map(channel => {
          if (channel.name === message.target) {
            return {
              ...channel,
              messages: [...channel.messages, message],
              latestMessage: message
            }
          }
          return channel
        })
      })
    }

    const handleSystem = (content: string, target?: string) => {
      setChannels(prev => {
        return prev.map(channel => {
          // If target is specified, only add to that channel
          // Otherwise, add to all channels (for general system messages)
          if (target && channel.name !== target) return channel

          const systemMessage = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            nick: "System",
            content,
            type: "system" as const,
            target: target || channel.name,
            isComplete: true,
          }

          return {
            ...channel,
            messages: [...channel.messages, systemMessage],
            latestMessage: systemMessage
          }
        })
      })
    }

    const handleJoin = (nick: string, channelName: string) => {
      setChannels(prev => {
        const existingChannel = prev.find(c => c.name === channelName)
        if (existingChannel) {
          const newUsers = new Map(existingChannel.users)
          newUsers.set(nick, { nick, modes: [] })
          return prev.map(c =>
            c.name === channelName
              ? { ...c, users: newUsers }
              : c
          )
        } else {
          const newChannel: Channel = {
            name: channelName,
            users: new Map([[nick, { nick, modes: [] }]]),
            messages: []
          }
          return [...prev, newChannel]
        }
      })
    }

    client.on("connected", handleConnected)
    client.on("disconnected", handleDisconnected)
    client.on("error", handleError)
    client.on("message", handleMessage)
    client.on("system", handleSystem)
    client.on("join", handleJoin)

    return () => {
      client.off("connected", handleConnected)
      client.off("disconnected", handleDisconnected)
      client.off("error", handleError)
      client.off("message", handleMessage)
      client.off("system", handleSystem)
      client.off("join", handleJoin)
    }
  }, [client])

  const connect = useCallback(async (server: string, port: number, nick: string) => {
    setConnectionState("connecting")
    try {
      await client.connect(server, port, nick)
      setCurrentNick(nick)
    } catch (error) {
      setConnectionState("error")
      throw error
    }
  }, [client])

  const sendMessage = useCallback((target: string, message: string) => {
    // Add the message to local state immediately so user can see it
    const userMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      nick: currentNick,
      content: message,
      type: "message" as const,
      target,
      isComplete: true,
    }

    setChannels(prev => {
      return prev.map(channel => {
        if (channel.name === target) {
          return {
            ...channel,
            messages: [...channel.messages, userMessage],
            latestMessage: userMessage
          }
        }
        return channel
      })
    })

    // Send to IRC server
    client.privmsg(target, message)
  }, [client, currentNick])

  const sendCommand = useCallback((command: string, args: string[], targetChannel?: string) => {
    switch (command.toLowerCase()) {
      case "join":
        if (args[0]) client.join(args[0])
        break
      case "part":
        if (args[0]) client.part(args[0])
        break
      case "nick":
        if (args[0]) client.nick(args[0])
        break
      case "quit":
        client.quit(args[0])
        break
      case "system":
        // Internal command to emit system messages
        client.emit("system", args.join(" "), targetChannel)
        break
      case "help":
        const helpText = "Available commands: /join #channel, /part #channel, /nick newname, /quit [reason], /help"
        client.emit("system", helpText, targetChannel)
        break
      default:
        const unknownText = `Unknown command: /${command}. Type /help for available commands.`
        client.emit("system", unknownText, targetChannel)
    }
  }, [client])

  return {
    connectionState,
    channels,
    currentNick,
    connect,
    disconnect: () => client.disconnect(),
    join: (channel: string) => client.join(channel),
    part: (channel: string) => client.part(channel),
    sendMessage,
    sendCommand
  }
}