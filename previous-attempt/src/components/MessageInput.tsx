import { createSignal, createMemo, For, Show, onMount } from "solid-js"
import { useKeyboard } from "@opentui/solid"
import { IrcParser } from "../lib/IrcParser"

export interface MessageInputProps {
  onMessage: (message: string) => void
  onCommand: (command: string, args: string[]) => void
  channels?: string[]
}

export function MessageInput(props: MessageInputProps) {
  const [inputValue, setInputValue] = createSignal("")
  const [messageHistory, setMessageHistory] = createSignal<string[]>([])
  const [historyIndex, setHistoryIndex] = createSignal(-1)
  const [showAutocomplete, setShowAutocomplete] = createSignal(false)
  const [autocompleteIndex, setAutocompleteIndex] = createSignal(0)

  const commands = [
    "/join",
    "/part",
    "/quit",
    "/nick",
    "/msg",
    "/privmsg",
    "/whois",
    "/who",
    "/topic",
    "/mode",
    "/kick",
    "/ban",
  ]

  const autocompleteOptions = createMemo(() => {
    const value = inputValue()
    if (value.startsWith("/")) {
      return commands.filter((cmd) => cmd.toLowerCase().startsWith(value.toLowerCase()))
    }
    return []
  })

  const handleSubmit = (value: string) => {
    if (!value.trim()) return

    // Add to history
    setMessageHistory((prev) => [value, ...prev.slice(0, 49)]) // Keep last 50 messages
    setHistoryIndex(-1)

    if (IrcParser.isCommand(value)) {
      const { command, args } = IrcParser.parseCommand(value)
      props.onCommand(command, args)
    } else {
      props.onMessage(value)
    }

    setInputValue("")
    setShowAutocomplete(false)
  }

  const navigateHistory = (direction: "up" | "down") => {
    const history = messageHistory()
    if (history.length === 0) return

    let newIndex = historyIndex()
    if (direction === "up") {
      newIndex = Math.min(newIndex + 1, history.length - 1)
    } else {
      newIndex = Math.max(newIndex - 1, -1)
    }

    setHistoryIndex(newIndex)
    if (newIndex === -1) {
      setInputValue("")
    } else {
      setInputValue(history[history.length - 1 - newIndex])
    }
  }

  const selectAutocomplete = (index: number) => {
    const options = autocompleteOptions()
    if (options[index]) {
      setInputValue(options[index] + " ")
      setShowAutocomplete(false)
      setAutocompleteIndex(0)
    }
  }

  useKeyboard((key) => {
    switch (key.name) {
      case "up":
        if (showAutocomplete()) {
          // Navigate autocomplete
          const options = autocompleteOptions()
          const newIndex = Math.max(autocompleteIndex() - 1, 0)
          setAutocompleteIndex(newIndex)
        } else {
          // Navigate history
          navigateHistory("up")
        }
        break

      case "down":
        if (showAutocomplete()) {
          // Navigate autocomplete
          const options = autocompleteOptions()
          const newIndex = Math.min(autocompleteIndex() + 1, options.length - 1)
          setAutocompleteIndex(newIndex)
        } else {
          // Navigate history
          navigateHistory("down")
        }
        break

      case "tab":
        if (showAutocomplete()) {
          selectAutocomplete(autocompleteIndex())
        } else {
          const options = autocompleteOptions()
          if (options.length === 1) {
            selectAutocomplete(0)
          } else if (options.length > 1) {
            setShowAutocomplete(true)
          }
        }
        break

      case "escape":
        setShowAutocomplete(false)
        setAutocompleteIndex(0)
        break
    }
  })

  return (
    <box flexDirection="column">
      <Show when={showAutocomplete() && autocompleteOptions().length > 0}>
        <box height={Math.min(autocompleteOptions().length, 5)} border={true} style={{ backgroundColor: "#2d3748" }}>
          <For each={autocompleteOptions().slice(0, 5)}>
            {(command, index) => (
              <text
                style={{
                  fg: index() === autocompleteIndex() ? "#ffffff" : "#7aa2f7",
                  backgroundColor: index() === autocompleteIndex() ? "#4a5568" : "transparent",
                  paddingLeft: 1,
                }}
              >
                {command}
              </text>
            )}
          </For>
        </box>
      </Show>

      <box height={3} border={true} borderColor="#414868" padding={1} style={{ backgroundColor: "#1f2335" }}>
        <input
          focused
          value={inputValue()}
          onInput={(value) => {
            setInputValue(value)
            setShowAutocomplete(value.startsWith("/") && value.length > 1)
            setAutocompleteIndex(0)
          }}
          onSubmit={handleSubmit}
          placeholder="Type a message or /command..."
          style={{
            backgroundColor: "#16161e",
            focusedBackgroundColor: "#1a1b26",
          }}
        />
      </box>
    </box>
  )
}
