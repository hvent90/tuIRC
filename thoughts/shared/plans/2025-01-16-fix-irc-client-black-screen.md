# IRC Client Black Screen Fix Implementation Plan

## Overview

Fix the IRC TUI client black screen issue caused by using invalid OpenTUI JSX elements (`<form>`, `<textinput>`, `<button>`) that prevent the application from rendering. The current implementation incorrectly uses HTML elements instead of proper OpenTUI React components, causing the entire component tree to fail silently during rendering.

## Current State Analysis

Based on my analysis of the codebase and comparison with the comprehensive implementation plan:

### Key Discoveries:
- **Invalid JSX Elements**: `ConnectionDialog.tsx:41,45,55,65,74` uses `<form>`, `<textinput>`, and `<button>` elements that don't exist in OpenTUI
- **Component Naming Issues**: Using `<textinput>` instead of the correct `<input>` component name
- **Missing React Keys**: `MessageArea.tsx:63-69` maps over messages without providing `key` props
- **Event Handler Incompatibility**: HTML form submission patterns won't work with OpenTUI components
- **Proper Structure Exists**: All required components and hooks are implemented, just using wrong JSX elements

### Current Working Components:
- `<box>` elements - Properly used throughout all files
- `<text>` elements - Properly used for display text
- `<scrollbox>` in MessageArea - Correctly implemented
- Project structure matches the comprehensive plan

## Desired End State

A fully functional IRC client that displays the connection dialog instead of a black screen, with:
- **Proper OpenTUI component usage** throughout all components
- **Working connection dialog** with functional input fields and submit capability
- **Correct event handling** using OpenTUI patterns
- **Focus management** for keyboard navigation between inputs
- **React best practices** with proper keys for mapped elements

### Success Verification:
- Application starts and shows connection dialog (no black screen)
- Input fields accept text and respond to keyboard input
- Enter key submits the connection form properly
- Tab navigation works between input fields
- After connection, main IRC interface renders correctly

## What We're NOT Doing

**Explicitly out-of-scope**:
- Implementing actual IRC protocol connection (keeping existing IrcClient)
- Adding new features beyond fixing the black screen
- Changing the overall architecture or component structure
- Modifying the comprehensive implementation plan design
- Adding new dependencies or changing build configuration

## Implementation Approach

**Strategy**: Replace invalid HTML JSX elements with correct OpenTUI React components while maintaining the existing component structure and functionality. Focus on minimal changes that restore rendering capability without architectural changes.

**Technology Stack** (unchanged):
- **Frontend**: React with OpenTUI components
- **Backend**: Node.js with existing IrcClient implementation
- **State Management**: Existing React hooks pattern
- **Build System**: Existing Bun configuration

---

## Phase 1: Fix ConnectionDialog Component

### Overview

Replace invalid HTML elements in ConnectionDialog with proper OpenTUI components to restore basic rendering capability.

### Changes Required:

#### 1. Replace HTML Elements with OpenTUI Components

**File**: `src/components/ConnectionDialog.tsx`
**Changes**: Replace all invalid HTML elements with OpenTUI equivalents

```tsx
import React, { useState } from "react"

interface ConnectionDialogProps {
  onConnect: (server: string, port: number, nick: string) => void
  isConnecting: boolean
}

export function ConnectionDialog({ onConnect, isConnecting }: ConnectionDialogProps) {
  const [server, setServer] = useState("irc.libera.chat")
  const [port, setPort] = useState(6667)
  const [nick, setNick] = useState("")
  const [focusedField, setFocusedField] = useState<"server" | "port" | "nick">("server")

  const handleSubmit = () => {
    if (server && port && nick) {
      onConnect(server, port, nick)
    }
  }

  return (
    <box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      width="100%"
      height="100%"
      padding={2}
    >
      <box
        flexDirection="column"
        width={60}
        height={18}
        border={true}
        borderStyle="single"
        padding={2}
        style={{ backgroundColor: "#1a1b26", gap: 1 }}
      >
        <text style={{ fg: "#bb9af7", textAlign: "center" }}>
          IRC Client Connection
        </text>

        {/* Server Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Server:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={server}
              onInput={setServer}
              onSubmit={handleSubmit}
              focused={focusedField === "server"}
              placeholder="irc.libera.chat"
              style={{
                backgroundColor: "transparent",
                border: false,
                fg: "#c0caf5"
              }}
            />
          </box>
        </box>

        {/* Port Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Port:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={port.toString()}
              onInput={(value: string) => setPort(parseInt(value) || 6667)}
              onSubmit={handleSubmit}
              focused={focusedField === "port"}
              placeholder="6667"
              style={{
                backgroundColor: "transparent",
                border: false,
                fg: "#c0caf5"
              }}
            />
          </box>
        </box>

        {/* Nickname Input */}
        <box flexDirection="column">
          <text style={{ fg: "#7aa2f7" }}>Nickname:</text>
          <box style={{ border: true, borderColor: "#414868", height: 3 }}>
            <input
              value={nick}
              onInput={setNick}
              onSubmit={handleSubmit}
              focused={focusedField === "nick"}
              placeholder="Enter your nickname"
              style={{
                backgroundColor: "transparent",
                border: false,
                fg: "#c0caf5"
              }}
            />
          </box>
        </box>

        {/* Submit Button Alternative - Using Select */}
        <box marginTop={1}>
          <select
            options={[{
              name: isConnecting ? "Connecting..." : "Connect",
              value: "connect",
              description: isConnecting ? "Please wait..." : "Connect to IRC server"
            }]}
            focused={focusedField === "submit"}
            onChange={(index, option) => {
              if (option?.value === "connect" && !isConnecting) {
                handleSubmit()
              }
            }}
            style={{
              height: 3,
              backgroundColor: isConnecting ? "#414868" : "#9ece6a",
              focusedBackgroundColor: isConnecting ? "#565f89" : "#b3f95c"
            }}
          />
        </box>

        {isConnecting && (
          <text style={{ fg: "#e0af68", textAlign: "center" }}>
            Connecting to {server}:{port}...
          </text>
        )}
      </box>
    </box>
  )
}
```

#### 2. Add Tab Navigation Support

**File**: `src/components/ConnectionDialog.tsx`
**Changes**: Add keyboard handler for focus management

```tsx
import { useKeyboard } from "@opentui/react"

// Add inside component:
useKeyboard((key) => {
  if (key.name === "tab") {
    setFocusedField(prev => {
      switch (prev) {
        case "server": return "port"
        case "port": return "nick"
        case "nick": return "submit"
        case "submit": return "server"
        default: return "server"
      }
    })
  }
  if (key.name === "enter" || key.name === "return") {
    handleSubmit()
  }
})
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] Component renders without errors: `npm run build`
- [ ] No invalid JSX element errors in console: `npm run dev`

#### Manual Verification:
- [ ] Application starts and shows connection dialog (no black screen)
- [ ] Server input field accepts text input
- [ ] Port input field accepts numeric input
- [ ] Nickname input field accepts text input
- [ ] Tab key cycles between input fields
- [ ] Enter key submits the form when all fields are filled
- [ ] Connect button shows proper state (enabled/disabled/connecting)

---

## Phase 2: Fix MessageInput Component

### Overview

Replace invalid HTML elements in MessageInput to ensure the main interface renders properly after connection.

### Changes Required:

#### 1. Replace Form Elements with OpenTUI Components

**File**: `src/components/MessageInput.tsx`
**Changes**: Remove HTML form wrapper and fix input component

```tsx
import React, { useState } from "react"

interface MessageInputProps {
  onMessage: (message: string) => void
  onCommand: (command: string, args: string[]) => void
}

export function MessageInput({ onMessage, onCommand }: MessageInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [messageHistory, setMessageHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const handleSubmit = (value: string) => {
    if (!value.trim()) return

    // Add to history
    setMessageHistory(prev => [...prev, value].slice(-50))
    setHistoryIndex(-1)

    if (value.startsWith('/')) {
      // Parse command
      const parts = value.slice(1).split(' ')
      const command = parts[0]
      const args = parts.slice(1)
      onCommand(command, args)
    } else {
      onMessage(value)
    }

    setInputValue('')
  }

  const handleKeyboard = (key: any) => {
    if (key.name === 'up') {
      if (historyIndex < messageHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex])
      }
    } else if (key.name === 'down') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInputValue('')
      }
    }
  }

  return (
    <box
      height={3}
      border={true}
      borderStyle="single"
      borderColor="#414868"
      style={{ backgroundColor: "#1f2335" }}
    >
      <input
        value={inputValue}
        onInput={setInputValue}
        onSubmit={handleSubmit}
        focused={true}
        placeholder="Type a message or /command..."
        style={{
          backgroundColor: "transparent",
          border: false,
          fg: "#c0caf5",
          flexGrow: 1,
          margin: 1
        }}
      />
    </box>
  )
}
```

#### 2. Add Keyboard Hook Integration

**File**: `src/components/MessageInput.tsx`
**Changes**: Add useKeyboard hook for message history navigation

```tsx
import { useKeyboard } from "@opentui/react"

// Add inside component after state declarations:
useKeyboard(handleKeyboard)
```

### Success Criteria:

#### Automated Verification:
- [ ] Component compiles without TypeScript errors: `npm run typecheck`
- [ ] No invalid JSX elements in MessageInput: Static analysis
- [ ] Component renders in main IRC interface: Integration test

#### Manual Verification:
- [ ] Message input field accepts text input
- [ ] Enter key sends messages properly
- [ ] Commands starting with '/' are parsed correctly
- [ ] Up/Down arrows navigate through message history
- [ ] Input field maintains focus and cursor position

---

## Phase 3: Fix MessageArea and Add React Keys

### Overview

Add missing React keys to prevent rendering warnings and ensure stable component updates.

### Changes Required:

#### 1. Add Missing React Keys

**File**: `src/components/MessageArea.tsx`
**Changes**: Add key prop to mapped MessageItem components

```tsx
// Replace lines 63-69:
{channel?.messages?.length ? (
  channel.messages.map((message) => (
    <MessageItem
      key={message.id}  // Add this line
      message={message}
      isStreaming={streamingMessage?.id === message.id}
      streamContent={streamingMessage?.content}
    />
  ))
) : (
  <text style={{ fg: "#666666", textAlign: "center" }}>
    No messages yet. Start typing to join the conversation!
  </text>
)}
```

#### 2. Verify ScrollBox Configuration

**File**: `src/components/MessageArea.tsx`
**Changes**: Ensure scrollbox configuration is correct for OpenTUI

```tsx
<scrollbox
  focused={false}  // Don't steal focus from input
  stickyScroll={true}
  stickyStart="bottom"
  scrollbarOptions={{
    visible: true,
    trackOptions: {
      foregroundColor: "#7aa2f7",
      backgroundColor: "#414868",
    }
  }}
  style={{
    backgroundColor: "#1a1b26",
    border: true,
    borderColor: "#414868",
    flexGrow: 1
  }}
>
```

### Success Criteria:

#### Automated Verification:
- [ ] No React key warnings in console: `npm run dev`
- [ ] MessageArea renders without errors: Component test
- [ ] ScrollBox behaves correctly: Manual scroll test

#### Manual Verification:
- [ ] Message area displays messages properly
- [ ] Scrolling works with arrow keys when focused
- [ ] New messages auto-scroll to bottom
- [ ] No flickering or rendering inconsistencies
- [ ] Focus remains on input field when typing

---

## Phase 4: Verification and Polish

### Overview

Test the complete application flow and ensure all components work together properly.

### Changes Required:

#### 1. Add Error Boundary for Better Debugging

**File**: `src/components/ErrorBoundary.tsx` (new file)
**Changes**: Create error boundary component for debugging

```tsx
import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('IRC Client Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="100%"
          style={{ backgroundColor: "#ff0000", fg: "#ffffff" }}
        >
          <text>IRC Client Error</text>
          <text>{this.state.error?.message}</text>
          <text>Check console for details</text>
        </box>
      )
    }

    return this.props.children
  }
}
```

#### 2. Wrap Application in Error Boundary

**File**: `src/index.tsx`
**Changes**: Add error boundary for better error reporting

```tsx
import { render } from "@opentui/react"
import { IRCApp } from "./components/IRCApp"
import { ErrorBoundary } from "./components/ErrorBoundary"

console.log("Starting IRC TUI application...")

try {
  render(
    <ErrorBoundary>
      <IRCApp />
    </ErrorBoundary>
  )
  console.log("Render completed successfully")
} catch (error) {
  console.error("Failed to render application:", error)
  process.exit(1)
}
```

#### 3. Enhance Console Logging

**File**: `src/components/IRCApp.tsx`
**Changes**: Add more detailed logging for debugging

```tsx
export function IRCApp() {
  console.log("IRCApp component rendering")
  console.log("Connection state:", connectionState)
  console.log("Channels:", channels.length)
  console.log("Show connection dialog:", showConnectionDialog)

  // ... rest of component
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Application builds successfully: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] All components render without errors: Integration test

#### Manual Verification:
- [ ] Application starts without black screen
- [ ] Connection dialog appears with proper styling
- [ ] All input fields are functional
- [ ] Tab navigation works between fields
- [ ] Error boundary catches and displays rendering errors
- [ ] Console shows detailed logging for debugging
- [ ] Main interface appears after "connection" (even if not functional)

---

## Testing Strategy

### Unit Tests:
- Component rendering tests for each fixed component
- Event handler tests for input components
- Error boundary functionality tests
- React key uniqueness validation

### Integration Tests:
- Complete application startup and rendering
- Connection dialog form submission flow
- Component navigation and focus management
- Error handling and recovery scenarios

### Manual Testing Steps:
1. **Application Startup**:
   - Run `npm run dev`
   - Verify connection dialog appears (not black screen)
   - Check console for any error messages

2. **Connection Dialog Testing**:
   - Test server input field accepts text
   - Test port input field accepts numbers
   - Test nickname input field accepts text
   - Verify Tab key cycles through fields
   - Test Enter key submits form when valid

3. **Focus Management**:
   - Verify proper tab order through inputs
   - Test Enter key submission from any field
   - Confirm visual focus indicators work

4. **Error Handling**:
   - Test invalid input handling
   - Verify error boundary catches component errors
   - Check error messages are displayed properly

## Performance Considerations

### Rendering Optimization:
- Use React keys properly to prevent unnecessary re-renders
- Avoid inline functions in render methods where possible
- Optimize scrollbox rendering for large message lists
- Use proper OpenTUI component props to minimize renders

### Memory Usage:
- Limit message history in MessageArea to prevent memory leaks
- Clean up event listeners properly in useEffect hooks
- Use proper component lifecycle management

## Migration Notes

Since this is fixing an existing broken implementation:

### Backup Strategy:
- Current broken code is already committed
- Keep error boundary component for future debugging
- Maintain existing component structure and props

### Rollback Plan:
- If fixes introduce new issues, can revert individual component changes
- Error boundary provides detailed error information for debugging
- Console logging helps identify specific failure points

## References

- Original comprehensive plan: `thoughts/shared/plans/irc-client-react-implementation-fixed.md`
- OpenTUI React documentation: `node_modules/@opentui/react/README.md`
- Component patterns research: Current codebase analysis
- Error analysis: Debug session findings with invalid JSX elements