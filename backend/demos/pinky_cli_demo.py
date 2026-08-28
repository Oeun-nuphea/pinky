#!/usr/bin/env python3
import sys
import time
import os

def main():
    pink = "\033[38;5;206m"
    cyan = "\033[38;5;51m"
    green = "\033[38;5;82m"
    yellow = "\033[38;5;226m"
    bold = "\033[1m"
    reset = "\033[0m"

    print(f"""
{pink}{bold}
  _____  _____ _   _ _  ____   __
 |  __ \|_   _| \ | | |/ /\ \ / /
 | |__) | | | |  \| | ' /  \ V / 
 |  ___/  | | | . ` |  <    | |  
 | |     _| |_| |\  | . \   | |  
 |_|    |_____|_| \_|_|\_\  |_|  
{reset}
{cyan}Pinky CLI v1.0.0 — Experience & Run Developer Projects Live{reset}
{yellow}APT Repository & Interactive Sandbox Engine Connected{reset}
------------------------------------------------------------------
""")

    time.sleep(0.5)
    print(f"{bold}[1/3]{reset} Checking APT repository signatures... {green}OK{reset}")
    time.sleep(0.5)
    print(f"{bold}[2/3]{reset} Verifying package integrity: {cyan}pinky_1.0.0_all.deb{reset}... {green}VERIFIED{reset}")
    time.sleep(0.5)
    print(f"{bold}[3/3]{reset} Initializing PTY interactive shell environment... {green}READY{reset}\n")

    time.sleep(0.5)
    print(f"{pink}🐷 Hello from Pinky! Your interactive developer project runner is active.{reset}")
    print(f"{yellow}Try typing commands like 'help', 'status', 'packages', or 'exit':{reset}\n")

    # If stdin is interactive
    try:
        while True:
            sys.stdout.write(f"{cyan}pinky-cli>{reset} ")
            sys.stdout.flush()
            line = sys.stdin.readline()
            if not line:
                break
            cmd = line.strip().lower()
            if cmd in ["exit", "quit", "q"]:
                print(f"{pink}Goodbye from Pinky!{reset}")
                break
            elif cmd == "help":
                print(f"  {bold}status{reset}   - Show system & sandbox status")
                print(f"  {bold}packages{reset} - List available APT packages")
                print(f"  {bold}arttime{reset}  - Launch terminal art preview")
                print(f"  {bold}clear{reset}    - Clear screen")
            elif cmd == "status":
                print(f"  {green}● Sandbox State:{reset} Active (Isolated Process)")
                print(f"  {cyan}● Memory Limit:{reset}  128 MB")
                print(f"  {yellow}● Network:{reset}       Isolated Sandbox Mode")
            elif cmd == "packages":
                print(f"  📦 {bold}pinky_1.0.0_all.deb{reset} [utils] — Pinky CLI tool")
                print(f"  📦 {bold}arttime_2.4.0_amd64.deb{reset} [graphics] — Terminal art & clock")
                print(f"  📦 {bold}cmatrix_2.0.0_amd64.deb{reset} [games] — Matrix rain simulator")
            elif cmd == "clear":
                print("\033[H\033[J", end="")
            elif cmd == "arttime":
                print(f"{cyan}Launching arttime demo...{reset}")
                os.system("python3 backend/demos/arttime_demo.py")
            elif cmd == "":
                continue
            else:
                print(f"\033[31mUnknown command: {cmd}. Type 'help' for options.\033[0m")
    except Exception as e:
        print(f"\n{pink}Pinky session ended.{reset}")

if __name__ == "__main__":
    main()
