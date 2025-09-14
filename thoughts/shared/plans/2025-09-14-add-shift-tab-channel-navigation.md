# Add Shift+Tab Channel Navigation Implementation Plan

## Overview

Add backward channel cycling functionality using Shift+Tab while preserving existing forward cycling with Tab. This enhances user experience by allowing bidirectional navigation through IRC channels in the terminal UI.

## Current State Analysis

The IRC TUI currently supports forward channel cycling with the Tab key. When pressed, it advances to the next channel in the list with wraparound behavior (last channel → first channel).

### Key Discoveries:
- Tab key detection implemented in `src/components/MessageInput.tsx:69-73`
- Channel switching logic in `src/components/IRCApp.tsx:90-94` using `(prev + 1) % channels.length`
- OpenTUI keyboard system supports `key.shift` property for shift key detection
- Help text in `src/components/HelpBar.tsx:20` shows "Tab: Switch channels"
- SolidJS implementation plan already includes this pattern: `if (key.shift) { previousChannel() } else { nextChannel() }`

## Desired End State

After implementation, users can navigate channels bidirectionally:
- **Tab**: Cycles forward through channels (existing behavior preserved)
- **Shift+Tab**: Cycles backward through channels (new feature)
- Both directions support wraparound (first ↔ last)
- Help bar displays both shortcuts
- No regressions in existing functionality

## What We're NOT Doing

- Changing existing Tab forward cycling behavior
- Adding configuration options for keybindings
- Modifying mouse click navigation on channel tabs
- Adding visual indicators for navigation direction
- Supporting other modifier keys (Ctrl+Tab, Alt+Tab, etc.)

## Implementation Approach

Extend the existing keyboard handling pattern by adding shift+tab detection and backward cycling logic. Follow the established callback pattern from MessageInput to IRCApp components.

## Phase 1: Add Backward Channel Switching

### Overview
Implement shift+tab detection in MessageInput and add backward cycling logic in IRCApp.

### Changes Required:

#### 1. MessageInput.tsx - Update props interface
**File**: `src/components/MessageInput.tsx`
**Changes**: Add onChannelSwitchBackward prop to the MessageInputProps interface.

```typescript
interface MessageInputProps {
  onMessage: (message: string) => void
  onCommand: (command: string, args: string[]) => void
  onChannelSwitch?: () => void
  onChannelSwitchBackward?: () => void
}
```

#### 2. MessageInput.tsx - Add shift+tab detection
**File**: `src/components/MessageInput.tsx`
**Changes**: Modify tab key handling to check for shift key and call appropriate callback.

```typescript
if (key.name === 'tab') {
  // Handle tab for channel switching
  if (key.shift) {
    // Shift+Tab: cycle backward
    if (onChannelSwitchBackward) {
      onChannelSwitchBackward()
    }
  } else {
    // Tab: cycle forward
    if (onChannelSwitch) {
      onChannelSwitch()
    }
  }
}
```

#### 3. IRCApp.tsx - Add backward switching function
**File**: `src/components/IRCApp.tsx`
**Changes**: Add handleChannelSwitchBackward function with backward cycling logic.

```typescript
const handleChannelSwitchBackward = useCallback(() => {
  if (channels.length > 0) {
    setActiveChannelIndex((prev) => (prev - 1 + channels.length) % channels.length)
  }
}, [channels.length])
```

#### 4. IRCApp.tsx - Pass backward callback to MessageInput
**File**: `src/components/IRCApp.tsx`
**Changes**: Add onChannelSwitchBackward prop to MessageInput component.

```typescript
<MessageInput
  onMessage={handleMessage}
  onCommand={handleCommand}
  onChannelSwitch={handleChannelSwitch}
  onChannelSwitchBackward={handleChannelSwitchBackward}
/>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run typecheck`
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [x] Tab key cycles forward through channels
- [x] Shift+Tab cycles backward through channels
- [x] Cycling wraps around in both directions (first ↔ last)
- [x] No regressions in existing tab functionality

---

## Phase 2: Update Help Documentation

### Overview
Update the help bar to show both tab navigation shortcuts.

### Changes Required:

#### 1. HelpBar.tsx - Add shift+tab to help text
**File**: `src/components/HelpBar.tsx`
**Changes**: Update keyboard shortcuts text to include shift+tab navigation.

```typescript
<text style={{ fg: "#565f89" }}>
  ↑/↓ History | Tab: Next channel | Shift+Tab: Previous channel
</text>
```

### Success Criteria:

#### Manual Verification:
- [x] Help bar displays both Tab and Shift+Tab shortcuts
- [x] Text fits within the help bar width
- [x] Consistent styling with other help text

---

## Testing Strategy

### Unit Tests:
- Test MessageInput keyboard handler with tab and shift+tab events
- Test IRCApp channel switching functions with various channel counts
- Test wraparound behavior (first → last, last → first)

### Integration Tests:
- End-to-end channel navigation workflow
- Keyboard event propagation from MessageInput to IRCApp
- State synchronization between activeChannelIndex and UI

### Manual Testing Steps:
1. Connect to IRC server and join multiple channels
2. Press Tab repeatedly to verify forward cycling through all channels
3. Press Shift+Tab repeatedly to verify backward cycling through all channels
4. Verify wraparound behavior in both directions
5. Test with single channel (should have no effect)
6. Test with empty channel list (should have no effect)

## Performance Considerations

- No performance impact expected as this adds minimal computational overhead
- Keyboard event handling remains synchronous and lightweight
- No additional re-renders or state updates beyond existing channel switching

## Migration Notes

- No data migration required
- Existing user behavior with Tab key unchanged
- New Shift+Tab functionality is additive only

## References

- Current tab implementation: `src/components/MessageInput.tsx:69-73`
- Channel switching logic: `src/components/IRCApp.tsx:90-94`
- OpenTUI shift key pattern: `thoughts/shared/plans/irc-client-solidjs-implementation.md:730`