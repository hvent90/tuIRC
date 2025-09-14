import { EventEmitter } from "events"
import * as net from "net"
import type { Channel, User, Message, ConnectionState, IrcMessage } from "../types"
import { IrcParser } from "./IrcParser"

export class IrcClient extends EventEmitter {
  private socket: net.Socket | null = null
  private connectionState: ConnectionState = "disconnected"
  private channels: Map<string, Channel> = new Map()
  private currentNick: string = ""
  private server: string = ""
  private port: number = 6667

  // Connection management
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000
  private pingInterval?: NodeJS.Timeout
  private lastPingTime = 0

  constructor() {
    super()
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Set up any initial event handlers if needed
  }

  async connect(server: string, port: number, nick: string): Promise<void> {
    console.log('IrcClient::connect');
    if (this.connectionState === "connecting") {
      throw new Error("Already connecting")
    }

    if (this.connectionState === "connected") {
      throw new Error("Already connected")
    }

    // Input validation
    if (!server || typeof server !== 'string') {
      throw new Error('Invalid server address')
    }
    if (!port || port < 1 || port > 65535) {
      throw new Error('Invalid port number')
    }
    if (!nick || nick.length === 0) {
      throw new Error('Invalid nickname')
    }

    this.server = server
    this.port = port
    this.currentNick = nick
    this.connectionState = "connecting"
    this.emit("connecting")

    try {
      this.socket = new net.Socket()
      this.socket.setTimeout(30000) // 30 second timeout
      this.socket.setEncoding("utf8")

      await new Promise<void>((resolve, reject) => {
        if (!this.socket) return reject(new Error("Socket not initialized"))

        this.socket.connect(port, server, resolve)
        this.socket.on("error", reject)
        this.socket.on("timeout", () => reject(new Error("Connection timeout")))
      })

      this.setupSocketHandlers()
      this.authenticate(nick)
      this.startPingTimer()

      this.reconnectAttempts = 0
      this.connectionState = "connected"
      this.emit("connected")
    } catch (error) {
      this.connectionState = "error"
      this.emit("error", error)
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end()
      this.socket = null
    }
    this.connectionState = "disconnected"
    this.clearPingTimer()
    this.emit("disconnected")
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return

    this.socket.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n")
      for (const line of lines) {
        if (line.trim()) {
          this.handleRawMessage(line.trim())
        }
      }
    })

    this.socket.on("close", () => {
      this.connectionState = "disconnected"
      this.clearPingTimer()
      this.emit("disconnected")
      // Auto-reconnect if not manually disconnected
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    })

    this.socket.on("error", (error) => {
      this.emit("error", error)
      this.connectionState = "error"
    })
  }

  private authenticate(nick: string): void {
    this.send("NICK", [nick])
    this.send("USER", [nick, "0", "*", nick])
  }

  join(channel: string): void {
    if (!channel.startsWith("#")) {
      channel = `#${channel}`
    }
    this.send("JOIN", [channel])
  }

  part(channel: string, reason?: string): void {
    const params = reason ? [channel, reason] : [channel]
    this.send("PART", params)
  }

  privmsg(target: string, message: string): void {
    this.send("PRIVMSG", [target, message])
  }

  nick(newNick: string): void {
    this.send("NICK", [newNick])
  }

  quit(reason?: string): void {
    const params = reason ? [`:${reason}`] : []
    this.send("QUIT", params)
  }

  private send(command: string, params: string[]): void {
    if (!this.socket || this.connectionState === "disconnected") {
      throw new Error("Not connected")
    }

    const message = IrcParser.format(command, params)
    this.socket.write(`${message}\r\n`)
  }

  handleRawMessage(line: string): void {
    try {
      const message = IrcParser.parse(line)
      this.processMessage(message)
    } catch (error) {
      console.error("Failed to parse IRC message:", line, error)
    }
  }

  private processMessage(message: IrcMessage): void {
    const { command, params, prefix } = message
    const nick = IrcParser.extractNickFromPrefix(prefix)

    switch (command.toUpperCase()) {
      case "PING":
        this.send("PONG", params)
        break

      case "PONG":
        this.handlePong()
        break

      case "001": // Welcome message
      case "002":
      case "003":
      case "004":
      case "005":
        this.emit("system", `Server: ${params.slice(1).join(" ")}`)
        break

      case "JOIN":
        if (params[0]) this.handleJoin(nick, params[0])
        break

      case "PART":
        if (params[0]) this.handlePart(nick, params[0], params[1])
        break

      case "PRIVMSG":
        console.log("IrcClient::processMessage::PRIVMSG");
        if (params[0] && params[1]) this.handlePrivmsg(nick, params[0], params[1])
        break

      case "QUIT":
        this.handleQuit(nick, params[0])
        break

      case "353": // NAMES list
        if (params[2] && params[3]) this.handleNames(params[2], params[3])
        break

      case "366": // End of NAMES list
        // NAMES list complete
        break

      case "332": // Topic
        if (params[1] && params[2]) this.handleTopic(params[1], params[2])
        break

      case "NICK":
        if (params[0]) this.handleNickChange(nick, params[0])
        break

      default:
        // Unknown command - could emit for debugging
        break
    }
  }

  private handleJoin(nick: string, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, {
        name: channel,
        users: new Map(),
        messages: [],
      })
    }

    const channelData = this.channels.get(channel)
    if (!channelData) return

    const user: User = { nick, modes: [] }
    channelData.users.set(nick, user)

    // Only emit specific event - let React hook handle message creation
    this.emit("join", nick, channel)
  }

  private handlePart(nick: string, channel: string, reason?: string): void {
    const channelData = this.channels.get(channel)
    if (channelData) {
      channelData.users.delete(nick)

      // Only emit specific event
      this.emit("part", nick, channel, reason)
    }
  }

  private handlePrivmsg(nick: string, target: string, content: string): void {
    console.log('IrcClient::handlePrivmsg', nick, target, content);
    const isChannel = IrcParser.isChannelName(target)
    const channelData = isChannel ? this.channels.get(target) : this.channels.get(nick)

    if (!channelData && isChannel) {
      // Create channel if it doesn't exist
      this.channels.set(target, {
        name: target,
        users: new Map(),
        messages: [],
      })
    }

    const message: Message = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      nick,
      content,
      type: "message",
      target,
      isComplete: false, // Will be streamed
    }

    this.emit("message", message)
  }

  private handleQuit(nick: string, reason?: string): void {
    const affectedChannels: string[] = []

    // Remove user from all channels
    for (const channel of this.channels.values()) {
      if (channel.users.has(nick)) {
        channel.users.delete(nick)
        affectedChannels.push(channel.name)
      }
    }

    // Single event with all affected channels
    this.emit("quit", nick, reason, affectedChannels)
  }

  private handleNames(channel: string, namesList: string): void {
    const channelData = this.channels.get(channel)
    if (!channelData) return

    const names = namesList.split(" ")
    for (const name of names) {
      if (name) {
        const modes = []
        let nick = name

        // Parse user modes (op, voice, etc.)
        if (nick.startsWith("@")) {
          modes.push("op")
          nick = nick.substring(1)
        } else if (nick.startsWith("+")) {
          modes.push("voice")
          nick = nick.substring(1)
        }

        const user: User = { nick, modes }
        channelData.users.set(nick, user)
      }
    }

    this.emit("userlist", channel, Array.from(channelData.users.values()))
  }

  private handleTopic(channel: string, topic: string): void {
    const channelData = this.channels.get(channel)
    if (channelData) {
      channelData.topic = topic
      this.emit("topic", channel, topic)
    }
  }

  private handleNickChange(oldNick: string, newNick: string): void {
    if (oldNick === this.currentNick) {
      this.currentNick = newNick
    }

    // Update nick in all channels
    for (const channel of this.channels.values()) {
      if (channel.users.has(oldNick)) {
        const user = channel.users.get(oldNick)!
        channel.users.delete(oldNick)
        user.nick = newNick
        channel.users.set(newNick, user)
      }
    }

    this.emit("nick", oldNick, newNick)
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      this.connectionState = "reconnecting"
      this.emit("reconnecting", this.reconnectAttempts)

      setTimeout(() => {
        this.connect(this.server, this.port, this.currentNick)
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      this.emit("reconnect_failed")
    }
  }

  private startPingTimer(): void {
    this.pingInterval = setInterval(() => {
      if (Date.now() - this.lastPingTime > 180000) {
        // 3 minutes
        this.send("PING", [":" + this.server])
        this.lastPingTime = Date.now()
      }
    }, 60000) // Check every minute
  }

  private clearPingTimer(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = undefined
    }
  }

  private handlePong(): void {
    this.lastPingTime = Date.now()
  }

  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  getChannels(): Map<string, Channel> {
    return this.channels
  }

  getCurrentNick(): string {
    return this.currentNick
  }
}