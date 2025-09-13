import { describe, test, expect } from "bun:test"
import { IrcParser } from "./IrcParser"

describe("IrcParser", () => {
  test("parse simple command", () => {
    const result = IrcParser.parse("PING :server.example.com")
    expect(result.command).toBe("PING")
    expect(result.params).toEqual(["server.example.com"])
    expect(result.prefix).toBeUndefined()
  })

  test("parse command with prefix", () => {
    const result = IrcParser.parse(":nick!user@host PRIVMSG #channel :Hello world")
    expect(result.prefix).toBe("nick!user@host")
    expect(result.command).toBe("PRIVMSG")
    expect(result.params).toEqual(["#channel", "Hello world"])
  })

  test("parse command with multiple parameters", () => {
    const result = IrcParser.parse("JOIN #channel,#channel2")
    expect(result.command).toBe("JOIN")
    expect(result.params).toEqual(["#channel,#channel2"])
  })

  test("format command", () => {
    const result = IrcParser.format("PRIVMSG", ["#channel", "Hello world"])
    expect(result).toBe("PRIVMSG #channel :Hello world")
  })

  test("isCommand detects commands", () => {
    expect(IrcParser.isCommand("/join #test")).toBe(true)
    expect(IrcParser.isCommand("hello world")).toBe(false)
  })

  test("parseCommand extracts command and args", () => {
    const result = IrcParser.parseCommand("/join #test some reason")
    expect(result.command).toBe("join")
    expect(result.args).toEqual(["#test", "some", "reason"])
  })

  test("extractNickFromPrefix", () => {
    expect(IrcParser.extractNickFromPrefix("nick!user@host")).toBe("nick")
    expect(IrcParser.extractNickFromPrefix("nick")).toBe("nick")
    expect(IrcParser.extractNickFromPrefix(undefined)).toBe("system")
  })

  test("isChannelName", () => {
    expect(IrcParser.isChannelName("#channel")).toBe(true)
    expect(IrcParser.isChannelName("&channel")).toBe(true)
    expect(IrcParser.isChannelName("nick")).toBe(false)
  })
})
