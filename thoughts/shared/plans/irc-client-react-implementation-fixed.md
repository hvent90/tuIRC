# IRC Client Implementation Plan - React OpenTUI (Fixed)

## Overview

Implement a terminal-based IRC (Internet Relay Chat) client using the React implementation of OpenTUI. This plan addresses the JSX runtime issues encountered in the previous SolidJS attempt by leveraging the proven working React configuration patterns found in the `src/` directory.

## Previous Attempt Analysis

### Root Cause of Previous Failure

The previous SolidJS implementation (`previous-attempt/`) failed due to **JSX compilation configuration issues**:

**Critical Configuration Error** (`previous-attempt/tsconfig.json:3-4`):
```json
{
  "jsx": "preserve",
  "jsxImportSource": "@opentui/solid"
}
```

**The Problem:**
- `"jsx": "preserve"` tells TypeScript to leave JSX untransformed
- SolidJS components like `<Show>`, `<For>`, and OpenTUI elements remained as raw JSX
- The runtime expected transformed function calls but received untransformed JSX
- This caused "jsxDEV not found" errors because JSX wasn't being converted to proper function calls

**Missing Dependencies:**
- SolidJS requires specific JSX transformation that wasn't configured
- The build system expected babel transformation but TypeScript was preserving JSX

### Working React Solution

**Current Working Configuration** (`tsconfig.json:8-9`):
```json
{
  "jsx": "react-jsx",
  "jsxImportSource": "@opentui/react"
}
```

**Why This Works:**
- `"jsx": "react-jsx"` properly transforms JSX into `React.createElement()` calls
- React runtime can handle the transformed function calls
- All dependencies are correctly configured and available

## New Implementation Strategy

**Strategy**: Convert the SolidJS implementation to React using proven OpenTUI React patterns. Leverage the working build configuration and component extension patterns from `src/index.tsx`.

**Technology Stack**:
- **Frontend**: React with OpenTUI React renderer
- **Backend**: Node.js with native net module for TCP sockets
- **Protocol**: Raw IRC protocol implementation (reuse from previous attempt)
- **State Management**: React hooks and context
- **Build System**: Working OpenTUI React configuration

## Phase 1: Project Setup and React Migration

### Overview

Migrate the SolidJS components to React equivalents using the proven working configuration.

### Changes Required:

#### 1. Update Build Configuration

**File**: `package.json`
**Changes**: Update dependencies to match working React setup

```json
{
  "name": "irc-tui",
  "module": "src/index.tsx",
  "type": "module",
  "private": true,
  "dependencies": {
    "@opentui/core": "^0.1.23",
    "@opentui/react": "^0.1.23",
    "react": "^19.1.1"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

**File**: `tsconfig.json`
**Changes**: Use working React JSX configuration

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

#### 2. IRC Protocol Implementation (Reusable)

**File**: `src/lib/IrcClient.ts`
**Changes**: Copy working IRC client from previous attempt (no changes needed)

```typescript
// Copy from previous-attempt/src/lib/IrcClient.ts
// This component doesn't use JSX and works as-is
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

**File**: `src/lib/IrcParser.ts`
**Changes**: Copy working parser from previous attempt (no changes needed)

```typescript
// Copy from previous-attempt/src/lib/IrcParser.ts
// Pure TypeScript logic, no JSX dependencies
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

#### 3. Type Definitions (Reusable)

**File**: `src/types/index.ts`
**Changes**: Copy types from previous attempt (no changes needed)

```typescript
// Copy from previous-attempt/src/types/index.ts
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
  isComplete?: boolean
}

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error"
```

### Success Criteria:

#### Automated Verification:
- [ ] Project builds successfully: `bun run build`
- [ ] TypeScript compilation passes: `tsc --noEmit`
- [ ] No JSX runtime errors during compilation
- [ ] IRC client logic functions correctly: unit tests

#### Manual Verification:
- [ ] Can import React components without errors
- [ ] JSX transforms correctly to React function calls
- [ ] IRC client can establish TCP connections
- [ ] Message parsing handles IRC protocol correctly

---

## Phase 2: React Component Migration

### Overview

Convert SolidJS components to React equivalents using React hooks and patterns.

### SolidJS to React Conversion Patterns

#### Hook Equivalents:
- `createSignal()` → `useState()`
- `createStore()` → `useReducer()` or `useState()` with objects
- `createEffect()` → `useEffect()`
- `onMount()` → `useEffect(() => {}, [])`
- `onCleanup()` → `useEffect(() => { return cleanup }, [])`

#### Component Equivalents:
- `<Show when={condition} fallback={fallback}>` → `{condition ? children : fallback}`
- `<For each={array}>` → `{array.map()}`

### Changes Required:

#### 1. IRC Client Hook (React Version)

**File**: `src/hooks/useIrcClient.ts`
**Changes**: Convert SolidJS store and signals to React state

```typescript
import { useState, useEffect, useCallback } from "react"
import { IrcClient } from "../lib/IrcClient"
import type { Channel, ConnectionState } from "../types"

export function useIrcClient() {
  const [client] = useState(() => new IrcClient())
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected")
  const [channels, setChannels] = useState<Record<string, Channel>>({})
  const [currentNick, setCurrentNick] = useState("")

  useEffect(() => {
    const handleConnected = () => setConnectionState("connected")
    const handleDisconnected = () => setConnectionState("disconnected")
    const handleError = (error: Error) => {
      console.error("IRC Error:", error)
      setConnectionState("error")
    }

    const handleMessage = (message: any) => {
      setChannels(prev => ({
        ...prev,
        [message.target]: {
          ...prev[message.target],
          messages: [...(prev[message.target]?.messages || []), message],
          latestMessage: message
        }
      }))
    }

    const handleJoin = (nick: string, channelName: string) => {
      setChannels(prev => {
        const channel = prev[channelName] || {
          name: channelName,
          users: new Map(),
          messages: []
        }

        const newUsers = new Map(channel.users)
        if (!newUsers.has(nick)) {
          newUsers.set(nick, { nick, modes: [] })
        }

        return {
          ...prev,
          [channelName]: { ...channel, users: newUsers }
        }
      })
    }

    // Add other event handlers...

    client.on("connected", handleConnected)
    client.on("disconnected", handleDisconnected)
    client.on("error", handleError)
    client.on("message", handleMessage)
    client.on("join", handleJoin)

    return () => {
      client.off("connected", handleConnected)
      client.off("disconnected", handleDisconnected)
      client.off("error", handleError)
      client.off("message", handleMessage)
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

  return {
    connectionState,
    channels: Object.values(channels),
    currentNick,
    connect,
    disconnect: () => client.disconnect(),
    join: (channel: string) => client.join(channel),
    part: (channel: string) => client.part(channel),
    sendMessage: (target: string, message: string) => client.privmsg(target, message),
    sendCommand: useCallback((command: string, args: string[]) => {
      // Command processing logic...
    }, [client])
  }
}
```

#### 2. Main Application Component (React Version)

**File**: `src/components/IRCApp.tsx`
**Changes**: Convert SolidJS component to React

```typescript
import React, { useState } from "react"
import { useIrcClient } from "../hooks/useIrcClient"
import { ConnectionDialog } from "./ConnectionDialog"
import { MessageArea } from "./MessageArea"
import { ChannelTabs } from "./ChannelTabs"
import { MessageInput } from "./MessageInput"
import { StatusBar } from "./StatusBar"
import { HelpBar } from "./HelpBar"

export function IRCApp() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(true)
  const [activeChannelIndex, setActiveChannelIndex] = useState(0)

  const {
    connectionState,
    channels,
    currentNick,
    connect,
    disconnect,
    sendMessage,
    sendCommand
  } = useIrcClient()

  const handleConnect = async (server: string, port: number, nick: string) => {
    try {
      await connect(server, port, nick)
      setShowConnectionDialog(false)
    } catch (error) {
      console.error("Failed to connect:", error)
    }
  }

  const handleMessage = (message: string) => {
    const activeChannel = channels[activeChannelIndex]
    if (activeChannel) {
      sendMessage(activeChannel.name, message)
    }
  }

  const handleCommand = (command: string, args: string[]) => {
    sendCommand(command, args)
  }

  const activeChannel = channels[activeChannelIndex]

  // Global keyboard shortcuts using OpenTUI patterns
  // (Will be implemented in Phase 3)

  return showConnectionDialog ? (
    <ConnectionDialog
      onConnect={handleConnect}
      isConnecting={connectionState === "connecting"}
    />
  ) : (
    <box flexDirection="column" width="100%" height="100%">
      <StatusBar
        connectionState={connectionState}
        currentChannel={activeChannel?.name}
        currentNick={currentNick}
        userCount={activeChannel?.users.size}
      />

      <ChannelTabs
        channels={channels}
        activeIndex={activeChannelIndex}
        onChannelChange={setActiveChannelIndex}
      />

      <box flexGrow={1}>
        <MessageArea channel={activeChannel} />
      </box>

      <MessageInput onMessage={handleMessage} onCommand={handleCommand} />

      <HelpBar />
    </box>
  )
}
```

#### 3. Message Area Component (React Version)

**File**: `src/components/MessageArea.tsx`
**Changes**: Convert SolidJS For/Show to React patterns

```typescript
import React, { useState, useEffect } from "react"
import type { Channel } from "../types"
import { MessageItem } from "./MessageItem"

export interface MessageAreaProps {
  channel?: Channel
}

export function MessageArea({ channel }: MessageAreaProps) {
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string
    content: string
    fullContent: string
    isComplete: boolean
  } | null>(null)

  useEffect(() => {
    if (channel?.latestMessage && !channel.latestMessage.isComplete) {
      startMessageStream(channel.latestMessage)
    }
  }, [channel?.latestMessage])

  const startMessageStream = (message: any) => {
    const chunkSize = Math.floor(Math.random() * 3) + 1
    let currentIndex = 0

    const interval = setInterval(() => {
      currentIndex += chunkSize
      const content = message.content.slice(0, currentIndex)

      setStreamingMessage({
        id: message.id,
        content,
        fullContent: message.content,
        isComplete: currentIndex >= message.content.length,
      })

      if (currentIndex >= message.content.length) {
        clearInterval(interval)
        setStreamingMessage(null)
      }
    }, 32)
  }

  return (
    <scrollbox
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
        borderColor: "#414868",
      }}
    >
      {channel?.messages?.length ? (
        channel.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={streamingMessage?.id === message.id}
            streamContent={streamingMessage?.content}
          />
        ))
      ) : (
        <box justifyContent="center" alignItems="center" padding={2}>
          <text style={{ fg: "#666666" }}>
            No messages yet. Start typing to join the conversation!
          </text>
        </box>
      )}
    </scrollbox>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] All React components compile without errors: `bun run build`
- [ ] No SolidJS dependencies remain in package.json
- [ ] TypeScript types resolve correctly for React components
- [ ] JSX transforms to proper React function calls

#### Manual Verification:
- [ ] Components render without runtime errors
- [ ] React state updates trigger UI re-renders correctly
- [ ] Message streaming animation works in React
- [ ] Event handlers respond to user interactions

---

## Phase 3: Advanced Features and Integration

### Overview

Add keyboard shortcuts, error handling, and polish using React patterns and OpenTUI's event system.

### Changes Required:

#### 1. Custom OpenTUI Components (Following src/index.tsx Pattern)

**File**: `src/components/IRCComponents.tsx`
**Changes**: Create IRC-specific OpenTUI components using the extension pattern

```typescript
import { BoxRenderable, OptimizedBuffer, RGBA, type BoxOptions, type RenderContext } from "@opentui/core"
import { extend } from "@opentui/react"

class StatusBarRenderable extends BoxRenderable {
  private _status: string = "Disconnected"
  private _statusColor: RGBA = RGBA.fromInts(128, 128, 128, 255)

  constructor(ctx: RenderContext, options: BoxOptions & {
    status?: string
    statusColor?: string
  }) {
    super(ctx, {
      height: 1,
      border: false,
      ...options,
    })

    if (options.status) this._status = options.status
    if (options.statusColor) {
      // Parse color string to RGBA
      this._statusColor = this.parseColor(options.statusColor)
    }
  }

  protected renderSelf(buffer: OptimizedBuffer): void {
    super.renderSelf(buffer)

    const text = `● ${this._status}`
    buffer.drawText(text, this.x + 1, this.y, this._statusColor)
  }

  private parseColor(color: string): RGBA {
    // Simple color parsing - could be enhanced
    switch (color) {
      case "green": return RGBA.fromInts(0, 255, 0, 255)
      case "red": return RGBA.fromInts(255, 0, 0, 255)
      case "yellow": return RGBA.fromInts(255, 255, 0, 255)
      default: return RGBA.fromInts(128, 128, 128, 255)
    }
  }

  set status(value: string) {
    this._status = value
    this.requestRender()
  }

  set statusColor(value: string) {
    this._statusColor = this.parseColor(value)
    this.requestRender()
  }
}

// Add TypeScript support
declare module "@opentui/react" {
  interface OpenTUIComponents {
    statusBar: typeof StatusBarRenderable
  }
}

// Register the component
extend({ statusBar: StatusBarRenderable })
```

#### 2. Main Entry Point

**File**: `src/index.tsx`
**Changes**: Create main entry point using working render pattern

```typescript
import { render } from "@opentui/react"
import { IRCApp } from "./components/IRCApp"
import "./components/IRCComponents" // Register custom components

// Use the working render pattern from src/index.tsx
render(<IRCApp />)
```

#### 3. Enhanced Components with OpenTUI Integration

**File**: `src/components/StatusBar.tsx`
**Changes**: Use custom OpenTUI component

```typescript
import React from "react"
import type { ConnectionState } from "../types"

interface StatusBarProps {
  connectionState: ConnectionState
  currentChannel?: string
  currentNick?: string
  userCount?: number
}

export function StatusBar({
  connectionState,
  currentChannel,
  currentNick,
  userCount
}: StatusBarProps) {
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'green'
      case 'connecting': return 'yellow'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  return (
    <box
      height={1}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      style={{ backgroundColor: "#24283b" }}
    >
      <statusBar
        status={getStatusText()}
        statusColor={getStatusColor()}
      />

      {currentNick && (
        <text style={{ fg: "#7aa2f7", marginLeft: 2 }}>
          {currentNick}
        </text>
      )}

      <box flexGrow={1} />

      {currentChannel && (
        <text style={{ fg: "#bb9af7" }}>
          {currentChannel} {userCount ? `(${userCount})` : ''}
        </text>
      )}
    </box>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Custom OpenTUI components compile successfully
- [ ] React render function works without errors
- [ ] All TypeScript types resolve correctly
- [ ] Build produces working executable

#### Manual Verification:
- [ ] Application launches and displays connection dialog
- [ ] Can connect to IRC servers successfully
- [ ] Custom status bar component renders correctly
- [ ] All UI interactions work as expected
- [ ] Keyboard shortcuts function properly
- [ ] Message streaming and channel switching work

---

## Testing Strategy

### Unit Tests:
- **IRC Parser**: Message parsing, command detection (reuse from previous attempt)
- **React Hooks**: useIrcClient state management and event handling
- **Component Rendering**: React component mounting and prop handling
- **OpenTUI Integration**: Custom component registration and rendering

### Integration Tests:
- **Complete IRC flow**: Connect → Join → Send/Receive → Disconnect
- **React state updates**: Verify UI updates with IRC events
- **OpenTUI rendering**: Custom components render correctly in terminal
- **Error scenarios**: Network failures, invalid commands, server errors

### Manual Testing Steps:
1. **Build Verification**: `bun run build` succeeds without JSX errors
2. **Connection Testing**: Connect to irc.libera.chat:6667
3. **Channel Operations**: Join/part channels, switch between tabs
4. **Message Handling**: Send/receive messages with streaming animation
5. **Command Testing**: All IRC commands work correctly
6. **Error Recovery**: Handle disconnections and reconnections

## Migration Notes

### From SolidJS to React:
- State management migrated from `createSignal`/`createStore` to `useState`/`useReducer`
- Effect handling migrated from `createEffect` to `useEffect`
- Component rendering migrated from SolidJS JSX to React JSX
- Event handlers converted to React callback patterns

### Reusable Components:
- IRC protocol logic (IrcClient, IrcParser) works without changes
- Type definitions remain the same
- Network communication layer is framework-agnostic

### Configuration Changes:
- `jsx: "preserve"` → `jsx: "react-jsx"`
- `@opentui/solid` → `@opentui/react`
- SolidJS peer dependency → React direct dependency

## Performance Considerations

### React-Specific Optimizations:
- Use `React.memo()` for message list items to prevent unnecessary re-renders
- Use `useCallback()` for event handlers to prevent child re-renders
- Use `useMemo()` for expensive calculations (channel user counts, etc.)
- Consider virtualization for large message lists

### Memory Management:
- Limit message history per channel (1000 messages)
- Clean up event listeners in useEffect cleanup functions
- Use AbortController for network requests
- Monitor React DevTools for memory leaks

## References

- **Failed SolidJS Implementation**: `previous-attempt/` - JSX configuration issues identified
- **Working React Setup**: `src/index.tsx` - Proven OpenTUI React patterns
- **Configuration Analysis**: Comparison of `tsconfig.json` and `package.json` between attempts
- **OpenTUI React Documentation**: `node_modules/@opentui/react/README.md`
- **Custom Component Patterns**: `src/index.tsx:5-44` - ButtonRenderable example
- **Original IRC Plan**: `thoughts/shared/plans/irc-client-solidjs-implementation.md` - Requirements and features

## Lessons Learned

### Root Cause Summary:
**The "jsxDEV not found" error was caused by `"jsx": "preserve"` in tsconfig.json**, which prevented JSX transformation. SolidJS components remained as untransformed JSX, causing runtime errors when the system expected function calls.

### Key Success Factors:
1. **Use proven working configurations** - React setup works reliably
2. **Verify JSX transformation** - Ensure `"jsx": "react-jsx"` for React
3. **Match dependency versions** - Use exact versions from working examples
4. **Test build early** - Catch configuration issues before implementing features
5. **Follow framework patterns** - Use React hooks instead of forcing SolidJS patterns