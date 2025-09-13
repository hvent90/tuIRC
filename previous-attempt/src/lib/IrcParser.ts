import type { IrcMessage } from "../types"

export class IrcParser {
  static parse(line: string): IrcMessage {
    const raw = line.trim()
    if (!raw) {
      throw new Error("Empty IRC message")
    }

    const message: IrcMessage = {
      command: "",
      params: [],
      raw,
    }

    let remaining = raw

    // Parse prefix (optional)
    if (remaining.startsWith(":")) {
      const prefixEnd = remaining.indexOf(" ")
      if (prefixEnd === -1) {
        throw new Error("Invalid IRC message: missing space after prefix")
      }
      message.prefix = remaining.substring(1, prefixEnd)
      remaining = remaining.substring(prefixEnd + 1)
    }

    // Parse command
    const commandEnd = remaining.indexOf(" ")
    if (commandEnd === -1) {
      message.command = remaining
    } else {
      message.command = remaining.substring(0, commandEnd)
      remaining = remaining.substring(commandEnd + 1)
    }

    // Parse parameters
    while (remaining) {
      if (remaining.startsWith(":")) {
        // Last parameter (can contain spaces)
        message.params.push(remaining.substring(1))
        break
      } else {
        const paramEnd = remaining.indexOf(" ")
        if (paramEnd === -1) {
          message.params.push(remaining)
          break
        } else {
          message.params.push(remaining.substring(0, paramEnd))
          remaining = remaining.substring(paramEnd + 1)
        }
      }
    }

    return message
  }

  static format(command: string, params: string[]): string {
    let result = command

    for (let i = 0; i < params.length; i++) {
      const param = params[i]
      if (param) {
        if (i === params.length - 1 && (param.includes(" ") || param.includes(":"))) {
          // Last parameter with spaces gets prefixed with :
          result += ` :${param}`
        } else {
          result += ` ${param}`
        }
      }
    }

    return result
  }

  static isCommand(message: string): boolean {
    return message.trim().startsWith("/")
  }

  static parseCommand(message: string): { command: string; args: string[] } {
    const trimmed = message.trim()
    if (!trimmed.startsWith("/")) {
      throw new Error("Not a command")
    }

    const parts = trimmed.substring(1).split(" ")
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    return { command, args }
  }

  static extractNickFromPrefix(prefix?: string): string {
    if (!prefix) return "system"
    const nickEnd = prefix.indexOf("!")
    return nickEnd === -1 ? prefix : prefix.substring(0, nickEnd)
  }

  static isChannelName(name: string): boolean {
    return name.startsWith("#") || name.startsWith("&")
  }
}
