import {useState, useEffect, useCallback, useRef} from "react"
import { IrcClient } from "../lib/IrcClient"
import type { Channel, ConnectionState } from "../types"

export function useIrcClient() {
  console.log("useIrcClient called")
  const client = useRef(new IrcClient()).current
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
      console.log('handleMessage', message);
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
        let channels = [...prev]

        // Ensure Server channel exists for system messages
        const serverChannelExists = channels.some(c => c.name === "Server")
        if (!serverChannelExists) {
          channels.push({
            name: "Server",
            users: new Map(),
            messages: []
          })
        }

        // Use Server as default target for system messages
        const actualTarget = target || "Server"

        return channels.map(channel => {
          // Add to target channel (Server for system messages)
          if (channel.name === actualTarget) {
            const systemMessage = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: new Date(),
              nick: "System",
              content,
              type: "system" as const,
              target: actualTarget,
              isComplete: true,
            }

            return {
              ...channel,
              messages: [...channel.messages, systemMessage],
              latestMessage: systemMessage
            }
          }
          return channel
        })
      })
    }

    const handleJoin = (nick: string, channelName: string) => {
      setChannels(prev => {
        const joinMessage = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          nick,
          content: `joined ${channelName}`,
          type: "join" as const,
          target: channelName,
          isComplete: true,
        }

        const existingChannel = prev.find(c => c.name === channelName)
        if (existingChannel) {
          // Update user list AND add join message
          const newUsers = new Map(existingChannel.users)
          newUsers.set(nick, { nick, modes: [] })
          return prev.map(c =>
            c.name === channelName
              ? {
                  ...c,
                  users: newUsers,
                  messages: [...c.messages, joinMessage],
                  latestMessage: joinMessage
                }
              : c
          )
        } else {
          // Create new channel with join message
          const newChannel: Channel = {
            name: channelName,
            users: new Map([[nick, { nick, modes: [] }]]),
            messages: [joinMessage],
            latestMessage: joinMessage
          }
          return [...prev, newChannel]
        }
      })
    }

    const handlePart = (nick: string, channelName: string, reason?: string) => {
      setChannels(prev => {
        const partMessage = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          nick,
          content: reason ? `left ${channelName} (${reason})` : `left ${channelName}`,
          type: "part" as const,
          target: channelName,
          isComplete: true,
        }

        return prev.map(channel => {
          if (channel.name === channelName) {
            // Remove user and add part message
            const newUsers = new Map(channel.users)
            newUsers.delete(nick)
            return {
              ...channel,
              users: newUsers,
              messages: [...channel.messages, partMessage],
              latestMessage: partMessage
            }
          }
          return channel
        })
      })
    }

    const handleQuit = (nick: string, reason: string | undefined, affectedChannels: string[]) => {
      setChannels(prev => {
        const quitMessage = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          nick,
          content: reason ? `quit (${reason})` : `quit`,
          type: "quit" as const,
          target: "Server", // Show quit messages in Server channel
          isComplete: true,
        }

        // Add quit message to Server channel
        const serverChannel = prev.find(c => c.name === "Server")
        if (serverChannel) {
          const updatedServerChannel = {
            ...serverChannel,
            messages: [...serverChannel.messages, quitMessage],
            latestMessage: quitMessage
          }

          // Remove user from affected channels
          const updatedChannels = prev.map(channel => {
            if (affectedChannels.includes(channel.name)) {
              const newUsers = new Map(channel.users)
              newUsers.delete(nick)
              return {
                ...channel,
                users: newUsers
              }
            }
            return channel
          })

          // Replace Server channel with updated one
          return updatedChannels.map(channel =>
            channel.name === "Server" ? updatedServerChannel : channel
          )
        }

        return prev
      })
    }

    console.log('subscribing to events');
    client.on("connected", handleConnected)
    client.on("disconnected", handleDisconnected)
    client.on("error", handleError)
    client.on("message", handleMessage)
    client.on("system", handleSystem)
    client.on("join", handleJoin)
    client.on("part", handlePart)
    client.on("quit", handleQuit)

    return () => {
      client.off("connected", handleConnected)
      client.off("disconnected", handleDisconnected)
      client.off("error", handleError)
      client.off("message", handleMessage)
      client.off("system", handleSystem)
      client.off("join", handleJoin)
      client.off("part", handlePart)
      client.off("quit", handleQuit)
    }
  }, [])

  const connect = useCallback(async (server: string, port: number, nick: string) => {
    setConnectionState("connecting")
    try {
      await client.connect(server, port, nick)
      setCurrentNick(nick)

      // Initialize Server channel for system messages
      setChannels(prev => {
        const serverChannelExists = prev.some(c => c.name === "Server")
        if (!serverChannelExists) {
          return [...prev, {
            name: "Server",
            users: new Map(),
            messages: []
          }]
        }
        return prev
      })
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
        if (args[0]) {
          // Prevent parting from Server channel
          if (args[0].toLowerCase() === "server") {
            client.emit("system", "Cannot part from Server channel", targetChannel)
            return
          }
          client.part(args[0])
        }
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
      case "list":
        client.list();
        break;
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