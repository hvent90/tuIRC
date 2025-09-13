import { BoxRenderable, OptimizedBuffer, RGBA, type BoxOptions, type RenderContext } from "@opentui/core"
import { extend, render } from "@opentui/react"

// Create custom component class
class ButtonRenderable extends BoxRenderable {
    private _label: string = "Button"

    constructor(ctx: RenderContext, options: BoxOptions & { label?: string }) {
        super(ctx, {
            border: true,
            borderStyle: "single",
            minHeight: 3,
            ...options,
        })

        if (options.label) {
            this._label = options.label
        }
    }

    protected renderSelf(buffer: OptimizedBuffer): void {
        super.renderSelf(buffer)

        const centerX = this.x + Math.floor(this.width / 2 - this._label.length / 2)
        const centerY = this.y + Math.floor(this.height / 2)

        buffer.drawText(this._label, centerX, centerY, RGBA.fromInts(255, 255, 255, 255))
    }

    set label(value: string) {
        this._label = value
        this.requestRender()
    }
}

// Add TypeScript support
declare module "@opentui/react" {
    interface OpenTUIComponents {
        consoleButton: typeof ButtonRenderable
    }
}

// Register the component
extend({ consoleButton: ButtonRenderable })

// Use in JSX
function App() {
    return (
        <box>
            <consoleButton label="Click me!" style={{ backgroundColor: "blue" }} />
            <consoleButton label="Another button" style={{ backgroundColor: "green" }} />
        </box>
    )
}

render(<App />)