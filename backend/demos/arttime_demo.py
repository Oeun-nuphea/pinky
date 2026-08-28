#!/usr/bin/env python3
import sys
import time
import os
import random

def clear():
    print("\033[H\033[J", end="")

def hide_cursor():
    print("\033[?25l", end="")

def show_cursor():
    print("\033[?25h", end="")

def print_art(color_code):
    now = time.strftime("%H:%M:%S | %A, %B %d, %Y")
    reset = "\033[0m"
    bold = "\033[1m"
    color = f"\033[{color_code}m"
    dim = "\033[2m"
    pink = "\033[38;5;206m"
    cyan = "\033[38;5;51m"
    yellow = "\033[38;5;226m"

    art = f"""
{color}{bold}
               ▄▄▄▄▄▄▄             ▄▄▄▄▄▄▄
             ██       ██         ██       ██
            ██   ███   ██       ██   ███   ██
            ██   ███   ██       ██   ███   ██
            ██         ██       ██         ██
             ███████████         ███████████
{reset}
{pink}{bold}   ┌─────────────────────────────────────────────────────────────┐
   │ {cyan}arttime v2.4.0{pink} - {yellow}Terminal Art & Live Clock Utility{pink}     │
   └─────────────────────────────────────────────────────────────┘{reset}

      {color} ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ {reset}
      {color} █   {pink}TIME:{reset} {bold}{now}{reset} {color}  █ {reset}
      {color} █   {cyan}HOST:{reset} pinky-sandbox-node-01                        {color}  █ {reset}
      {color} █   {yellow}MODE:{reset} Interactive PTY Live Preview                 {color}  █ {reset}
      {color} ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ {reset}

{dim}   [Hotkeys] Press 'c' to cycle color | 'r' to refresh | 'q' to exit demo{reset}
"""
    print(art)

def main():
    hide_cursor()
    colors = ["36", "35", "32", "33", "34", "31"]
    c_idx = 0
    try:
        clear()
        for i in range(120): # Run for 2 minutes max
            clear()
            print_art(colors[c_idx])
            time.sleep(1)
            # Cycle colors gently
            if i % 5 == 0:
                c_idx = (c_idx + 1) % len(colors)
    except KeyboardInterrupt:
        pass
    finally:
        show_cursor()
        print("\n\033[32m[arttime] Execution finished. Thank you for using Pinky Sandbox!\033[0m\n")

if __name__ == "__main__":
    main()
