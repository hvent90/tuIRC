export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error"

export interface Channel {
  name: string
  topic?: string
  users: Map<string, User>
  messages: Message[]
  latestMessage?: Message
}

export interface User {
  nick: string
  modes: string[]
  realname?: string
}

export interface Message {
  id: string
  timestamp: Date
  nick: string
  content: string
  type: "message" | "action" | "join" | "part" | "quit" | "system"
  target: string
  isComplete?: boolean
}

export interface IrcMessage {
  prefix?: string
  command: string
  params: string[]
  raw: string
}
