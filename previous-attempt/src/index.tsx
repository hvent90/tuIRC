// Core IRC functionality
export { IrcClient } from "./lib/IrcClient"
export { IrcParser } from "./lib/IrcParser"

// Types
export type { ConnectionState, Channel, User, Message, IrcMessage } from "./types"

// Components
export { IRCApp } from "./components/IRCApp"
export { MessageArea } from "./components/MessageArea"
export { MessageItem } from "./components/MessageItem"
export { ChannelTabs } from "./components/ChannelTabs"
export { MessageInput } from "./components/MessageInput"
export { ConnectionDialog } from "./components/ConnectionDialog"

// Hooks
export { useIrcClient } from "./hooks/useIrcClient"
