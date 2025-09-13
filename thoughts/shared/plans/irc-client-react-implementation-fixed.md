# IRC Client Implementation Plan - React OpenTUI

## Overview

Implement a terminal-based IRC (Internet Relay Chat) client using the React implementation of OpenTUI. This client will provide a modern, reactive interface for IRC communication with real-time message streaming, multi-channel support, and comprehensive keyboard navigation - all running natively in the terminal.

## Current State Analysis

Based on the research of OpenTUI's React implementation, we have excellent foundational components:

### Available Components:

- **ScrollBox** with sticky scrolling and auto-scroll behavior (similar patterns expected in React implementation)
- **Input** component with validation and event handling (`packages/core/src/renderables/Input.ts:26`)
- **TabSelect** for channel navigation (`packages/core/src/examples/tab-select-demo.ts:95-115`)
- **Real-time message streaming** patterns (React hooks for state management)
- **Flexbox layout** system with Box components (`packages/core/src/renderables/Box.ts:40-273`)
- **Global keyboard handling** (`packages/core/src/lib/KeyHandler.ts:9-37`)

### Key Discoveries:

- React provides component-based architecture with hooks for state management
- Built-in focus management and keyboard navigation patterns
- Double buffering and efficient rendering for terminal updates
- Comprehensive event system with INPUT/CHANGE/SUBMIT events
- React's useEffect and useState hooks perfect for real-time updates

## Desired End State

A fully functional IRC client with:

### Core Features:

- **Multi-server connection** support with connection management
- **Channel and direct message** support with tab-based navigation
- **Real-time message display** with automatic scrolling
- **Message composition** with command parsing (/join, /part, /msg, etc.)
- **User list display** for channels (optional sidebar)
- **Connection status** indicators and error handling
- **Keyboard shortcuts** for efficient navigation

### Success Verification:

- Connect to IRC servers (Libera.Chat, Freenode, etc.)
- Join and leave channels successfully
- Send and receive messages in real-time
- Handle IRC commands and server responses
- Maintain stable connection with reconnection logic
- Provide responsive terminal UI with smooth scrolling

## What We're NOT Doing

**Explicitly out-of-scope**:

- File transfer (DCC) support
- Advanced IRC features (CTCP, colors, formatting)
- Plugin system or scripting support
- Logging to disk (messages only in memory)
- Multiple network connections simultaneously
- Voice/video integration
- Web interface or GUI version

## Implementation Approach

**Strategy**: Build incrementally using existing OpenTUI patterns, starting with core IRC protocol handling and progressively adding UI components. Leverage React hooks for state management and OpenTUI's efficient rendering for smooth terminal experience.

**Technology Stack**:

- **Frontend**: React with OpenTUI components
- **Backend**: Node.js with native net module for TCP sockets
- **Protocol**: Raw IRC protocol implementation
- **State Management**: React hooks (useState, useEffect, useContext)
- **Build System**: Existing OpenTUI build configuration

---

## Phase 1: Project Setup and Core IRC Protocol

### Overview

Establish project structure and implement basic IRC protocol handling with TCP socket connection management.

### Changes Required:

#### 1. Project Structure

**Files**: Create new IRC client package structure

```
./
├── src/
│   ├── components/          # React UI components
│   ├── lib/                # IRC protocol and utilities
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── index.tsx           # Main application entry
├── examples/               # Usage examples and demos
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

#### 2. IRC Protocol Implementation

**File**: `src/lib/IrcClient.ts`
**Changes**: Core IRC client class with connection management

```typescript
export class IrcClient extends EventEmitter {
  private socket: net.Socket | null = null
  private connectionState: ConnectionState = "disconnected"
  private channels: Map<string, Channel> = new Map()
  private currentNick: string = ""

  connect(server: string, port: number, nick: string): Promise<void>
  disconnect(): void
  join(channel: string): void
  part(channel: string, reason?: string): void
  privmsg(target: string, message: string): void
  handleRawMessage(line: string): void
}
```

#### 3. Message Parsing

**File**: `src/lib/IrcParser.ts`
**Changes**: IRC message parsing and formatting utilities

```typescript
export interface IrcMessage {
  prefix?: string
  command: string
  params: string[]
  raw: string
}

export class IrcParser {
  static parse(line: string): IrcMessage
  static format(command: string, params: string[]): string
  static isCommand(message: string): boolean
  static parseCommand(message: string): { command: string; args: string[] }
}
```

#### 4. Type Definitions

**File**: `src/types/index.ts`
**Changes**: Core TypeScript interfaces for IRC data structures

```typescript
export interface Channel {
  name: string
  topic?: string
  users: Map<string, User>
  messages: Message[]
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
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Package builds successfully: `npm run build`
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] Unit tests for IRC parser pass: `npm run test`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:

- [ ] Can establish TCP connection to IRC server (irc.libera.chat:6667)
- [ ] Receives and parses IRC server messages correctly
- [ ] Can send basic IRC commands (NICK, USER, JOIN)
- [ ] Handles connection errors gracefully
- [ ] IRC message parsing handles edge cases (missing prefix, multiple params)

---

## Phase 2: React Hooks and Context Setup

### Overview

Create custom React hooks for IRC client state management and establish context providers for global state sharing.

### Changes Required:

#### 1. IRC Client Hook

**File**: `src/hooks/useIrcClient.ts`
**Changes**: Custom React hook for IRC client state management

```typescript
export function useIrcClient() {
  const [client] = useState(() => new IrcClient())
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [channels, setChannels] = useState<Record<string, Channel>>({})
  const [currentNick, setCurrentNick] = useState("")

  useEffect(() => {
    // Set up IRC client event listeners
    const handleConnected = () => setConnectionState("connected")
    const handleDisconnected = () => setConnectionState("disconnected")
    const handleMessage = (message: Message) => {
      setChannels(prev => ({
        ...prev,
        [message.target]: {
          ...prev[message.target],
          messages: [...(prev[message.target]?.messages || []), message]
        }
      }))
    }

    client.on("connected", handleConnected)
    client.on("disconnected", handleDisconnected)
    client.on("message", handleMessage)

    return () => {
      client.off("connected", handleConnected)
      client.off("disconnected", handleDisconnected)
      client.off("message", handleMessage)
    }
  }, [client])

  const connect = useCallback(async (server: string, port: number, nick: string) => {
    setConnectionState("connecting")
    try {
      await client.connect(server, port, nick)
      setCurrentNick(nick)
    } catch (error) {
      setConnectionState("error")
      console.error("Connection failed:", error)
    }
  }, [client])

  return {
    connectionState,
    channels,
    currentNick,
    connect,
    join: useCallback((channel: string) => client.join(channel), [client]),
    part: useCallback((channel: string) => client.part(channel), [client]),
    sendMessage: useCallback((target: string, message: string) => client.privmsg(target, message), [client]),
  }
}
```

#### 2. IRC Context Provider

**File**: `src/hooks/IrcContext.tsx`
**Changes**: React context for sharing IRC state across components

```typescript
interface IrcContextType {
  connectionState: ConnectionState
  channels: Record<string, Channel>
  currentNick: string
  activeChannel: string | null
  setActiveChannel: (channel: string | null) => void
  connect: (server: string, port: number, nick: string) => Promise<void>
  join: (channel: string) => void
  part: (channel: string) => void
  sendMessage: (target: string, message: string) => void
}

const IrcContext = createContext<IrcContextType | null>(null)

export function IrcProvider({ children }: { children: React.ReactNode }) {
  const ircClient = useIrcClient()
  const [activeChannel, setActiveChannel] = useState<string | null>(null)

  const contextValue: IrcContextType = {
    ...ircClient,
    activeChannel,
    setActiveChannel,
  }

  return (
    <IrcContext.Provider value={contextValue}>
      {children}
    </IrcContext.Provider>
  )
}

export function useIrc(): IrcContextType {
  const context = useContext(IrcContext)
  if (!context) {
    throw new Error("useIrc must be used within an IrcProvider")
  }
  return context
}
```

#### 3. Message Streaming Hook

**File**: `src/hooks/useMessageStream.ts`
**Changes**: Hook for character-by-character message streaming animation

```typescript
export function useMessageStream(message: Message | null) {
  const [streamedContent, setStreamedContent] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!message || message.content.length === 0) {
      setStreamedContent("")
      setIsComplete(false)
      return
    }

    let currentIndex = 0
    setStreamedContent("")
    setIsComplete(false)

    const interval = setInterval(() => {
      const chunkSize = Math.floor(Math.random() * 3) + 1 // 1-3 chars per chunk
      currentIndex += chunkSize
      const content = message.content.slice(0, currentIndex)

      setStreamedContent(content)

      if (currentIndex >= message.content.length) {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, 32) // ~30fps for smooth streaming

    return () => clearInterval(interval)
  }, [message])

  return { streamedContent, isComplete }
}
```

#### 4. Keyboard Hook

**File**: `src/hooks/useKeyboard.ts`
**Changes**: Hook for global keyboard shortcuts

```typescript
export function useKeyboard(onKeyPress: (key: KeyboardEvent) => void) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      onKeyPress(event)
    }

    // Integrate with OpenTUI's keyboard handling system
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [onKeyPress])
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Hooks compile without TypeScript errors: `npm run typecheck`
- [ ] Hook tests pass: `npm run test`
- [ ] Context provider renders without errors: Component tests
- [ ] ESLint passes for all hooks: `npm run lint`

#### Manual Verification:

- [ ] IRC context provides state to child components correctly
- [ ] useIrcClient hook manages connection state properly
- [ ] Message streaming animation works smoothly
- [ ] Keyboard shortcuts are captured and processed
- [ ] Context state updates trigger component re-renders appropriately

---

## Phase 3: Basic UI Components and Message Display

### Overview

Create core React components for IRC client interface using OpenTUI patterns, focusing on message display and basic layout.

### Changes Required:

#### 1. Main Application Component

**File**: `src/components/IRCApp.tsx`
**Changes**: Root application component with layout structure

```tsx
import React from 'react'
import { Box } from '@opentui/react'
import { IrcProvider, useIrc } from '../hooks/IrcContext'
import { ConnectionDialog } from './ConnectionDialog'
import { ConnectionStatus } from './ConnectionStatus'
import { ChannelTabs } from './ChannelTabs'
import { MessageArea } from './MessageArea'
import { MessageInput } from './MessageInput'
import { useKeyboard } from '../hooks/useKeyboard'

function IRCAppContent() {
  const { connectionState, channels, activeChannel, setActiveChannel } = useIrc()
  const [showConnectionDialog, setShowConnectionDialog] = React.useState(true)

  const channelList = Object.values(channels)
  const activeChannelIndex = channelList.findIndex(ch => ch.name === activeChannel)

  useKeyboard(React.useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        // Focus message input
        break
      case 'Tab':
        // Cycle through channels
        if (event.shiftKey) {
          // Previous channel
          const prevIndex = activeChannelIndex > 0 ? activeChannelIndex - 1 : channelList.length - 1
          setActiveChannel(channelList[prevIndex]?.name || null)
        } else {
          // Next channel
          const nextIndex = activeChannelIndex < channelList.length - 1 ? activeChannelIndex + 1 : 0
          setActiveChannel(channelList[nextIndex]?.name || null)
        }
        event.preventDefault()
        break
    }
  }, [activeChannelIndex, channelList, setActiveChannel]))

  if (showConnectionDialog && connectionState === 'disconnected') {
    return (
      <ConnectionDialog
        onConnect={() => setShowConnectionDialog(false)}
        isConnecting={connectionState === 'connecting'}
      />
    )
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <ConnectionStatus state={connectionState} />
      <ChannelTabs
        channels={channelList}
        activeIndex={activeChannelIndex}
        onChannelChange={(index) => setActiveChannel(channelList[index]?.name || null)}
      />
      <MessageArea
        channel={activeChannel ? channels[activeChannel] : undefined}
        flexGrow={1}
      />
      <MessageInput />
    </Box>
  )
}

export default function IRCApp() {
  return (
    <IrcProvider>
      <IRCAppContent />
    </IrcProvider>
  )
}
```

#### 2. Message Display Component

**File**: `src/components/MessageArea.tsx`
**Changes**: Scrollable message area with auto-scroll

```tsx
import React from 'react'
import { ScrollBox, Box, Text } from '@opentui/react'
import { Channel } from '../types'
import { MessageItem } from './MessageItem'

interface MessageAreaProps {
  channel?: Channel
  flexGrow?: number
}

export function MessageArea({ channel, ...props }: MessageAreaProps) {
  return (
    <ScrollBox
      scrollbarOptions={{ visible: true }}
      stickyScroll={true}
      stickyStart="bottom"
      paddingTop={1}
      paddingBottom={1}
      contentOptions={{
        flexGrow: 1,
        gap: 0,
      }}
      style={{
        backgroundColor: "#1a1b26",
        border: true,
        borderColor: "#414868"
      }}
      {...props}
    >
      {!channel?.messages?.length ? (
        <Text style={{ fg: "#666666", textAlign: "center" }}>
          No messages yet. Start typing to join the conversation!
        </Text>
      ) : (
        channel.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))
      )}
    </ScrollBox>
  )
}
```

#### 3. Message Item Component

**File**: `src/components/MessageItem.tsx`
**Changes**: Individual message display with IRC-specific formatting

```tsx
import React from 'react'
import { Box, Text } from '@opentui/react'
import { Message } from '../types'
import { useMessageStream } from '../hooks/useMessageStream'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
}

export function MessageItem({ message, isStreaming = false }: MessageItemProps) {
  const { streamedContent, isComplete } = useMessageStream(isStreaming ? message : null)

  const timeString = React.useMemo(() =>
    message.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }), [message.timestamp])

  const messageColor = React.useMemo(() => {
    switch (message.type) {
      case 'join': return '#00ff00'
      case 'part': case 'quit': return '#ff6666'
      case 'action': return '#ff00ff'
      case 'system': return '#ffff00'
      default: return '#ffffff'
    }
  }, [message.type])

  const displayContent = isStreaming && !isComplete ? streamedContent : message.content

  return (
    <Box
      paddingLeft={1}
      paddingRight={1}
      style={{
        backgroundColor: message.type === 'system' ? '#001122' : 'transparent'
      }}
    >
      <Box flexDirection="row">
        <Text style={{ fg: "#666666", width: 8 }}>[{timeString}]</Text>
        <Text style={{ fg: messageColor, width: 15 }}>
          &lt;{message.nick}&gt;
        </Text>
        <Text style={{ fg: messageColor }}>{displayContent}</Text>
      </Box>
    </Box>
  )
}
```

#### 4. Channel Tabs Component

**File**: `src/components/ChannelTabs.tsx`
**Changes**: Tab navigation for channels

```tsx
import React from 'react'
import { TabSelect } from '@opentui/react'
import { Channel } from '../types'

interface ChannelTabsProps {
  channels: Channel[]
  activeIndex: number
  onChannelChange: (index: number) => void
}

export function ChannelTabs({ channels, activeIndex, onChannelChange }: ChannelTabsProps) {
  const tabOptions = React.useMemo(() =>
    channels.map((channel, index) => ({
      name: channel.name,
      value: index,
      description: `${channel.users.size} users`
    })), [channels])

  return (
    <TabSelect
      height={2}
      width="100%"
      options={tabOptions}
      selectedValue={activeIndex}
      onChange={onChannelChange}
      showDescription={true}
      style={{
        backgroundColor: "#24283b",
        focusedBackgroundColor: "#2d3748",
        selectedBackgroundColor: "#7aa2f7",
        selectedTextColor: "#ffffff"
      }}
    />
  )
}
```

#### 5. Message Input Component

**File**: `src/components/MessageInput.tsx`
**Changes**: Input field with command parsing and validation

```tsx
import React from 'react'
import { Box, Input } from '@opentui/react'
import { useIrc } from '../hooks/IrcContext'
import { IrcParser } from '../lib/IrcParser'

export function MessageInput() {
  const { activeChannel, sendMessage } = useIrc()
  const [inputValue, setInputValue] = React.useState('')

  const handleSubmit = React.useCallback((value: string) => {
    if (!value.trim() || !activeChannel) return

    if (IrcParser.isCommand(value)) {
      const { command, args } = IrcParser.parseCommand(value)
      // Handle command processing here
      console.log(`Command: ${command}, Args:`, args)
    } else {
      sendMessage(activeChannel, value)
    }

    setInputValue('')
  }, [activeChannel, sendMessage])

  return (
    <Box
      height={3}
      border={true}
      borderColor="#414868"
      padding={1}
      style={{ backgroundColor: "#1f2335" }}
    >
      <Input
        focused
        value={inputValue}
        onInput={setInputValue}
        onSubmit={handleSubmit}
        placeholder="Type a message or /command..."
        style={{
          backgroundColor: "#16161e",
          focusedBackgroundColor: "#1a1b26"
        }}
      />
    </Box>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Components render without errors: `npm run build`
- [ ] React hooks integration works: `npm run test`
- [ ] TypeScript types are correct: `npm run typecheck`
- [ ] ESLint passes for all components: `npm run lint`

#### Manual Verification:

- [ ] Main layout displays correctly with proper proportions
- [ ] Message area shows placeholder text when no messages
- [ ] Channel tabs render and respond to selection
- [ ] Input field accepts text and handles Enter key
- [ ] Focus management works between components (Tab navigation)
- [ ] Visual styling matches IRC client conventions

---

## Phase 4: IRC Integration and Real-time Messaging

### Overview

Connect UI components to IRC protocol implementation, enable real-time message streaming, and implement core IRC commands.

### Changes Required:

#### 1. Enhanced IRC Client Hook

**File**: `src/hooks/useIrcClient.ts`
**Changes**: Add comprehensive IRC event handling

```typescript
export function useIrcClient() {
  // ... previous implementation ...

  useEffect(() => {
    const handleJoin = (channel: string, nick: string) => {
      setChannels(prev => ({
        ...prev,
        [channel]: {
          name: channel,
          users: new Map(),
          messages: [],
          ...(prev[channel] || {})
        }
      }))
    }

    const handlePart = (channel: string, nick: string) => {
      if (nick === currentNick) {
        setChannels(prev => {
          const newChannels = { ...prev }
          delete newChannels[channel]
          return newChannels
        })
      }
    }

    const handleUserList = (channel: string, users: string[]) => {
      setChannels(prev => ({
        ...prev,
        [channel]: {
          ...prev[channel],
          users: new Map(users.map(user => [user, { nick: user, modes: [] }]))
        }
      }))
    }

    client.on("join", handleJoin)
    client.on("part", handlePart)
    client.on("userlist", handleUserList)

    return () => {
      client.off("join", handleJoin)
      client.off("part", handlePart)
      client.off("userlist", handleUserList)
    }
  }, [client, currentNick])

  // ... rest of implementation ...
}
```

#### 2. Command Processing

**File**: `src/lib/CommandProcessor.ts`
**Changes**: Handle IRC commands and user input

```typescript
export class CommandProcessor {
  constructor(
    private ircClient: IrcClient,
    private setActiveChannel: (channel: string | null) => void
  ) {}

  processCommand(command: string, args: string[], currentChannel?: string): boolean {
    switch (command.toLowerCase()) {
      case "join":
        if (args[0]) {
          const channel = args[0].startsWith("#") ? args[0] : `#${args[0]}`
          this.ircClient.join(channel)
          this.setActiveChannel(channel)
          return true
        }
        break

      case "part":
      case "leave":
        const channel = args[0] || currentChannel
        if (channel) {
          this.ircClient.part(channel, args.slice(1).join(" "))
          return true
        }
        break

      case "msg":
      case "privmsg":
        if (args[0] && args[1]) {
          const target = args[0]
          const message = args.slice(1).join(" ")
          this.ircClient.privmsg(target, message)
          return true
        }
        break

      case "nick":
        if (args[0]) {
          this.ircClient.nick(args[0])
          return true
        }
        break

      case "quit":
        const reason = args.join(" ") || "Leaving"
        this.ircClient.quit(reason)
        return true

      default:
        return false // Unknown command
    }
    return false
  }
}
```

#### 3. Enhanced Message Input with Commands

**File**: `src/components/MessageInput.tsx`
**Changes**: Add command processing integration

```tsx
import React from 'react'
import { Box, Input } from '@opentui/react'
import { useIrc } from '../hooks/IrcContext'
import { IrcParser } from '../lib/IrcParser'
import { CommandProcessor } from '../lib/CommandProcessor'

export function MessageInput() {
  const { activeChannel, sendMessage, setActiveChannel } = useIrc()
  const [inputValue, setInputValue] = React.useState('')
  const [messageHistory, setMessageHistory] = React.useState<string[]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)

  const commandProcessor = React.useMemo(() =>
    new CommandProcessor(client, setActiveChannel),
    [client, setActiveChannel]
  )

  const handleSubmit = React.useCallback((value: string) => {
    if (!value.trim()) return

    // Add to history
    setMessageHistory(prev => [...prev, value].slice(-50)) // Keep last 50
    setHistoryIndex(-1)

    if (IrcParser.isCommand(value)) {
      const { command, args } = IrcParser.parseCommand(value)
      commandProcessor.processCommand(command, args, activeChannel || undefined)
    } else if (activeChannel) {
      sendMessage(activeChannel, value)
    }

    setInputValue('')
  }, [activeChannel, sendMessage, commandProcessor])

  // Handle arrow key navigation for message history
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        if (historyIndex < messageHistory.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setInputValue(messageHistory[messageHistory.length - 1 - newIndex])
        }
        event.preventDefault()
        break

      case 'ArrowDown':
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setInputValue(messageHistory[messageHistory.length - 1 - newIndex])
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setInputValue('')
        }
        event.preventDefault()
        break
    }
  }, [historyIndex, messageHistory])

  return (
    <Box
      height={3}
      border={true}
      borderColor="#414868"
      padding={1}
      style={{ backgroundColor: "#1f2335" }}
    >
      <Input
        focused
        value={inputValue}
        onInput={setInputValue}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or /command..."
        style={{
          backgroundColor: "#16161e",
          focusedBackgroundColor: "#1a1b26"
        }}
      />
    </Box>
  )
}
```

#### 4. Connection Dialog

**File**: `src/components/ConnectionDialog.tsx`
**Changes**: Initial connection setup dialog

```tsx
import React from 'react'
import { Box, Input, Button, Text } from '@opentui/react'
import { useIrc } from '../hooks/IrcContext'

interface ConnectionDialogProps {
  onConnect: () => void
  isConnecting: boolean
}

export function ConnectionDialog({ onConnect, isConnecting }: ConnectionDialogProps) {
  const { connect } = useIrc()
  const [server, setServer] = React.useState('irc.libera.chat')
  const [port, setPort] = React.useState(6667)
  const [nick, setNick] = React.useState('')
  const [focusedField, setFocusedField] = React.useState(0)

  const handleConnect = React.useCallback(async () => {
    if (nick.trim()) {
      await connect(server, port, nick.trim())
      onConnect()
    }
  }, [server, port, nick, connect, onConnect])

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <Box
        flexDirection="column"
        width={50}
        height={15}
        border={true}
        padding={2}
        style={{ backgroundColor: "#1f2335" }}
      >
        <Text style={{ textAlign: "center", marginBottom: 2 }}>
          Connect to IRC Server
        </Text>

        <Text>Server:</Text>
        <Input
          value={server}
          onInput={setServer}
          focused={focusedField === 0}
          marginBottom={1}
        />

        <Text>Nickname:</Text>
        <Input
          value={nick}
          onInput={setNick}
          onSubmit={handleConnect}
          focused={focusedField === 1}
          marginBottom={2}
        />

        <Box flexDirection="row" justifyContent="center">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !nick.trim()}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] IRC client connects to test server: Integration test suite
- [ ] Message parsing handles IRC protocol correctly: Unit tests
- [ ] React hooks update UI in real-time: Component tests
- [ ] Command processing validates all IRC commands: Unit tests
- [ ] Type checking passes with IRC integration: `npm run typecheck`

#### Manual Verification:

- [ ] Can connect to Libera.Chat or other IRC server
- [ ] Join and part channels successfully using /join and /part commands
- [ ] Send and receive messages in real-time with streaming animation
- [ ] Channel tabs update when joining/parting channels
- [ ] User list displays correctly for channels
- [ ] Connection status updates appropriately (connecting, connected, error)
- [ ] Commands like /nick and /quit work correctly

---

## Phase 5: Advanced Features and Polish

### Overview

Add keyboard shortcuts, error handling, reconnection logic, and visual enhancements to create a polished IRC client experience.

### Changes Required:

#### 1. Status Bar Component

**File**: `src/components/StatusBar.tsx`
**Changes**: Display connection status and current channel info

```tsx
import React from 'react'
import { Box, Text } from '@opentui/react'
import { ConnectionState, Channel } from '../types'

interface StatusBarProps {
  connectionState: ConnectionState
  currentChannel?: Channel
  currentNick?: string
}

export function StatusBar({ connectionState, currentChannel, currentNick }: StatusBarProps) {
  const statusColor = React.useMemo(() => {
    switch (connectionState) {
      case 'connected': return '#00ff00'
      case 'connecting': return '#ffff00'
      case 'reconnecting': return '#ff8800'
      case 'error': return '#ff0000'
      default: return '#666666'
    }
  }, [connectionState])

  const statusText = React.useMemo(() => {
    switch (connectionState) {
      case 'connected': return '● Connected'
      case 'connecting': return '○ Connecting...'
      case 'reconnecting': return '◐ Reconnecting...'
      case 'error': return '● Connection Error'
      default: return '○ Disconnected'
    }
  }, [connectionState])

  return (
    <Box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#24283b" }}
    >
      <Text style={{ fg: statusColor }}>
        {statusText}
      </Text>

      {currentNick && (
        <Text style={{ fg: "#7aa2f7", marginLeft: 2 }}>
          {currentNick}
        </Text>
      )}

      <Box flexGrow={1} />

      {currentChannel && (
        <Text style={{ fg: "#bb9af7" }}>
          {currentChannel.name} ({currentChannel.users.size})
        </Text>
      )}
    </Box>
  )
}
```

#### 2. Help Bar Component

**File**: `src/components/HelpBar.tsx`
**Changes**: Bottom help bar with keyboard shortcuts

```tsx
import React from 'react'
import { Box, Text } from '@opentui/react'

export function HelpBar() {
  return (
    <Box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#1f2335", fg: "#666666" }}
    >
      <Text>F1:Help</Text>
      <Text marginLeft={2}>F2:Reconnect</Text>
      <Text marginLeft={2}>Tab:Next Channel</Text>
      <Text marginLeft={2}>Esc:Focus Input</Text>

      <Box flexGrow={1} />

      <Text>Ctrl+C:Quit</Text>
    </Box>
  )
}
```

#### 3. Enhanced Error Handling

**File**: `src/lib/IrcClient.ts`
**Changes**: Add robust error handling and auto-reconnection

```typescript
export class IrcClient extends EventEmitter {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000
  private pingInterval?: NodeJS.Timer
  private lastPingTime = 0

  async connect(server: string, port: number, nick: string): Promise<void> {
    try {
      this.socket = new net.Socket()
      this.socket.setTimeout(30000) // 30 second timeout

      await new Promise((resolve, reject) => {
        this.socket!.connect(port, server, resolve)
        this.socket!.on("error", reject)
        this.socket!.on("timeout", () => reject(new Error("Connection timeout")))
      })

      this.setupSocketHandlers()
      this.authenticate(nick)
      this.startPingTimer()

      this.reconnectAttempts = 0
      this.emit("connected")
    } catch (error) {
      this.emit("error", error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      this.emit("reconnecting", this.reconnectAttempts)

      setTimeout(() => {
        this.connect(this.server, this.port, this.nick)
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      this.emit("reconnect_failed")
    }
  }

  private startPingTimer(): void {
    this.pingInterval = setInterval(() => {
      if (Date.now() - this.lastPingTime > 180000) {
        // 3 minutes
        this.send("PING", [`:${this.server}`])
        this.lastPingTime = Date.now()
      }
    }, 60000) // Check every minute
  }

  private handlePong(): void {
    this.lastPingTime = Date.now()
  }
}
```

#### 4. Enhanced Main App with Keyboard Shortcuts

**File**: `src/components/IRCApp.tsx`
**Changes**: Add comprehensive keyboard navigation

```tsx
function IRCAppContent() {
  const { connectionState, channels, activeChannel, setActiveChannel, connect } = useIrc()
  const [showConnectionDialog, setShowConnectionDialog] = React.useState(true)

  const channelList = Object.values(channels)
  const activeChannelIndex = channelList.findIndex(ch => ch.name === activeChannel)

  const handleReconnect = React.useCallback(() => {
    if (connectionState === 'disconnected') {
      // Attempt to reconnect with last known settings
      // This would need to be stored in context
    }
  }, [connectionState])

  useKeyboard(React.useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'F1':
        // Toggle help dialog
        break

      case 'F2':
        handleReconnect()
        break

      case 'Escape':
        // Focus message input
        document.querySelector('input')?.focus()
        break

      case 'Tab':
        // Cycle through channels
        if (event.shiftKey) {
          // Previous channel
          const prevIndex = activeChannelIndex > 0 ? activeChannelIndex - 1 : channelList.length - 1
          setActiveChannel(channelList[prevIndex]?.name || null)
        } else {
          // Next channel
          const nextIndex = activeChannelIndex < channelList.length - 1 ? activeChannelIndex + 1 : 0
          setActiveChannel(channelList[nextIndex]?.name || null)
        }
        event.preventDefault()
        break

      case '`':
        // Toggle debug console (if available)
        break
    }

    // Handle Ctrl+C for graceful disconnect
    if (event.ctrlKey && event.key === 'c') {
      // Graceful shutdown
      process.exit(0)
    }
  }, [activeChannelIndex, channelList, setActiveChannel, handleReconnect]))

  if (showConnectionDialog && connectionState === 'disconnected') {
    return (
      <ConnectionDialog
        onConnect={() => setShowConnectionDialog(false)}
        isConnecting={connectionState === 'connecting'}
      />
    )
  }

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <StatusBar
        connectionState={connectionState}
        currentChannel={activeChannel ? channels[activeChannel] : undefined}
      />
      <ChannelTabs
        channels={channelList}
        activeIndex={activeChannelIndex}
        onChannelChange={(index) => setActiveChannel(channelList[index]?.name || null)}
      />
      <MessageArea
        channel={activeChannel ? channels[activeChannel] : undefined}
        flexGrow={1}
      />
      <MessageInput />
      <HelpBar />
    </Box>
  )
}
```

### Success Criteria:

#### Automated Verification:

- [ ] All components render without console errors: `npm run build`
- [ ] Keyboard shortcuts trigger correct actions: Integration tests
- [ ] Reconnection logic works with simulated network failures: Unit tests
- [ ] Command autocomplete filters correctly: Unit tests
- [ ] Error handling prevents crashes: Error boundary tests

#### Manual Verification:

- [ ] F1 shows help dialog with available commands
- [ ] F2 reconnects successfully after disconnection
- [ ] Tab navigation cycles through channels smoothly
- [ ] Escape key focuses message input from anywhere
- [ ] Up/Down arrows navigate message history in input
- [ ] Tab key autocompletes IRC commands
- [ ] Status bar shows accurate connection state and channel info
- [ ] Graceful disconnect on Ctrl+C saves state
- [ ] Auto-reconnection works when network drops
- [ ] Error messages are user-friendly and actionable

---

## Testing Strategy

### Unit Tests:

- **IRC Parser**: Message parsing, command detection, format validation
- **Command Processor**: All IRC commands and argument handling
- **Connection Management**: Connect/disconnect/reconnect scenarios
- **Message Streaming**: Character-by-character streaming logic
- **React Hooks**: State management and effect handling

### Integration Tests:

- **Complete IRC flow**: Connect → Join → Send/Receive → Disconnect
- **Multi-channel operations**: Switching channels, managing multiple conversations
- **Error scenarios**: Network failures, invalid commands, server errors
- **Keyboard navigation**: All shortcuts and focus management
- **Real server testing**: Connect to actual IRC servers (Libera.Chat test channels)

### Manual Testing Steps:

1. **Connection Testing**:
   - Connect to irc.libera.chat:6667
   - Test invalid server/port combinations
   - Verify nickname registration and conflicts
   - Test connection timeout scenarios

2. **Channel Operations**:
   - Join channels: `/join #test`, `/join ##overflow`
   - Part channels: `/part #test`, `/part` (current channel)
   - Switch between channels using Tab navigation
   - Verify user list updates correctly

3. **Message Handling**:
   - Send regular messages in channels
   - Send private messages: `/msg nickname hello`
   - Test message streaming animation
   - Verify timestamp display and formatting

4. **Command Testing**:
   - Test all IRC commands: `/nick`, `/quit`, `/whois`, `/topic`
   - Verify command autocomplete with Tab key
   - Test invalid commands show appropriate errors
   - Check message history navigation with arrows

5. **Error Recovery**:
   - Simulate network disconnection
   - Verify auto-reconnection attempts
   - Test graceful handling of server kicks/bans
   - Check error message display and user feedback

6. **UI/UX Testing**:
   - Verify all keyboard shortcuts work correctly
   - Test focus management between components
   - Check visual feedback for connection states
   - Test scrolling behavior with many messages
   - Verify terminal resize handling

## Performance Considerations

### Message History Management:

- Limit channel message history to 1000 messages per channel
- Implement virtual scrolling for channels with many messages
- Use React.memo and useMemo to minimize re-renders
- Debounce message streaming to prevent excessive updates

### Memory Usage:

- Clean up disconnected channels from memory
- Implement message pruning for long-running sessions
- Use WeakMap for temporary UI state storage
- Monitor and limit total memory footprint

### Network Optimization:

- Implement IRC message batching for bulk operations
- Use keepalive pings to maintain connection
- Handle rate limiting for message sending
- Optimize reconnection backoff strategy

## Migration Notes

Since this is a new package implementation, no data migration is required. However:

### Configuration Management:

- Server connection settings stored in user config directory
- Channel auto-join preferences saved locally
- Keyboard shortcut customization support
- Theme/color scheme persistence

### Integration with OpenTUI:

- Follows OpenTUI component patterns and naming conventions
- Uses existing React reconciler and rendering pipeline
- Leverages OpenTUI's keyboard handling and focus management
- Maintains compatibility with OpenTUI development tools

## References

- Original SolidJS plan: `thoughts/shared/plans/irc-client-solidjs-implementation.md`
- Input handling patterns: `packages/core/src/renderables/Input.ts:26-351`
- ScrollBox implementation: `packages/core/src/renderables/ScrollBox.ts`
- Keyboard management: `packages/core/src/lib/KeyHandler.ts:9-37`
- Layout patterns: `packages/core/src/renderables/Box.ts:40-273`
- Tab selection: `packages/core/src/examples/tab-select-demo.ts:95-115`