import React, { createContext, useContext, ReactNode } from "react"
import { useIrcClient } from "../hooks/useIrcClient"
import type { Channel, ConnectionState } from "../types"

interface IrcContextType {
  connectionState: ConnectionState
  channels: Channel[]
  currentNick: string
  connect: (server: string, port: number, nick: string) => Promise<void>
  disconnect: () => void
  join: (channel: string) => void
  part: (channel: string) => void
  sendMessage: (target: string, message: string) => void
  sendCommand: (command: string, args: string[], targetChannel?: string) => void
}

const IrcContext = createContext<IrcContextType | null>(null)

interface IrcProviderProps {
  children: ReactNode
}

export const IrcProvider = React.memo(function IrcProvider({ children }: IrcProviderProps) {
  console.log("IrcProvider mounting...")
  const ircData = useIrcClient()
  console.log("IrcProvider useIrcClient completed")

  return (
    <IrcContext.Provider value={ircData}>
      {children}
    </IrcContext.Provider>
  )
})

export function useIrc(): IrcContextType {
  const context = useContext(IrcContext)
  if (!context) {
    throw new Error("useIrc must be used within an IrcProvider")
  }
  return context
}