import { createSignal, onMount, onCleanup } from "solid-js"
import { createStore } from "solid-js/store"
import { IrcClient } from "../lib/IrcClient"
import type { Channel, ConnectionState } from "../types"

export function useIrcClient() {
  const [client] = createSignal(new IrcClient())
  const [connectionState, setConnectionState] = createSignal<ConnectionState>("disconnected")
  const [channels, setChannels] = createStore<Record<string, Channel>>({})
  const [currentNick, setCurrentNick] = createSignal("")

  // Set up IRC client event listeners
  onMount(() => {
    const ircClient = client()

    const handleConnected = () => setConnectionState("connected")
    const handleDisconnected = () => setConnectionState("disconnected")
    const handleError = (error: Error) => {
      console.error("IRC Error:", error)
      setConnectionState("error")
    }

    const handleMessage = (message: any) => {
      // Update the channel with the new message
      setChannels(message.target, "messages", (messages: any[]) => [...messages, message])
      setChannels(message.target, "latestMessage", message)
    }

    const handleJoin = (nick: string, channelName: string) => {
      // Ensure channel exists
      if (!channels[channelName]) {
        setChannels(channelName, {
          name: channelName,
          users: new Map(),
          messages: [],
        })
      }

      // Add user to channel
      setChannels(channelName, "users", (users: Map<string, any>) => {
        const newUsers = new Map(users)
        if (!newUsers.has(nick)) {
          newUsers.set(nick, { nick, modes: [] })
        }
        return newUsers
      })
    }

    const handlePart = (nick: string, channelName: string) => {
      // Remove user from channel
      if (channels[channelName]) {
        setChannels(channelName, "users", (users: Map<string, any>) => {
          const newUsers = new Map(users)
          newUsers.delete(nick)
          return newUsers
        })
      }
    }

    const handleUserList = (channelName: string, users: any[]) => {
      if (channels[channelName]) {
        setChannels(channelName, "users", new Map(users.map((user) => [user.nick, user])))
      }
    }

    ircClient.on("connected", handleConnected)
    ircClient.on("disconnected", handleDisconnected)
    ircClient.on("error", handleError)
    ircClient.on("message", handleMessage)
    ircClient.on("join", handleJoin)
    ircClient.on("part", handlePart)
    ircClient.on("userlist", handleUserList)

    onCleanup(() => {
      ircClient.off("connected", handleConnected)
      ircClient.off("disconnected", handleDisconnected)
      ircClient.off("error", handleError)
      ircClient.off("message", handleMessage)
      ircClient.off("join", handleJoin)
      ircClient.off("part", handlePart)
      ircClient.off("userlist", handleUserList)
    })
  })

  const connect = async (server: string, port: number, nick: string) => {
    setConnectionState("connecting")
    try {
      await client().connect(server, port, nick)
      setCurrentNick(nick)
    } catch (error) {
      setConnectionState("error")
      console.error("Connection failed:", error)
      throw error
    }
  }

  const disconnect = () => {
    client().disconnect()
  }

  const join = (channel: string) => {
    client().join(channel)
  }

  const part = (channel: string) => {
    client().part(channel)
  }

  const sendMessage = (target: string, message: string) => {
    client().privmsg(target, message)
  }

  const sendCommand = (command: string, args: string[]) => {
    switch (command.toLowerCase()) {
      case "join":
        if (args[0]) {
          join(args[0])
        }
        break
      case "part":
      case "leave":
        if (args[0]) {
          part(args[0])
        }
        break
      case "msg":
      case "privmsg":
        if (args[0] && args[1]) {
          sendMessage(args[0], args.slice(1).join(" "))
        }
        break
      case "nick":
        if (args[0]) {
          client().nick(args[0])
        }
        break
      case "quit":
        client().quit(args.join(" "))
        break
      default:
        console.log(`Unknown command: /${command}`)
    }
  }

  return {
    connectionState,
    channels: () => Object.values(channels),
    currentNick,
    connect,
    disconnect,
    join,
    part,
    sendMessage,
    sendCommand,
  }
}
