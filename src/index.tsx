import { createCliRenderer, ConsolePosition } from "@opentui/core"
import { render } from "@opentui/react"
import { IRCApp } from "./components/IRCApp"

console.log("Starting IRC TUI application...")

async function main() {
  try {
    // Create renderer with console overlay support
    const renderer = await createCliRenderer({
      consoleOptions: {
        position: ConsolePosition.BOTTOM,
        sizePercent: 30,
        colorInfo: "#00FFFF",
        colorWarn: "#FFFF00",
        colorError: "#FF0000",
        startInDebugMode: false,
      },
    })

    // Renderer is now accessed via useRenderer hook

    console.log("Render starting...")
    render(<IRCApp />)
    console.log("Render completed successfully")

    console.info("Press Cmd + ` to toggle console overlay")
  } catch (error) {
    console.error("Failed to render application:", error)
    process.exit(1)
  }
}

main()