#!/usr/bin/env bun
import { render } from "@opentui/solid"
import { IRCApp } from "../src/index"

if (import.meta.main) {
  render(IRCApp)
}
