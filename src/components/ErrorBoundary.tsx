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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('IRC Client Error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="100%"
          style={{ backgroundColor: "#ff0000" }}
        >
          <text style={{ fg: "#ffffff" }}>IRC Client Error</text>
          <text style={{ fg: "#ffffff" }}>{this.state.error?.message}</text>
          <text style={{ fg: "#ffffff" }}>Check console for details</text>
        </box>
      )
    }

    return this.props.children
  }
}