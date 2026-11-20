# GitMon Chrome Extension

A Pokémon-themed Chrome extension that visualizes your GitHub contribution graph using Pokémon sprites.

## Features
- Automatic detection of contribution graphs on GitHub profiles and repositories.
- Real‑time overlay of Pokémon sprites based on contribution count:
  - 0 contributions – original GitHub square (no overlay)
  - 1 contribution – *Charmander*
  - 2‑3 contributions – *Charmeleon*
  - 4‑6 contributions – *Charizard*
  - 7‑9 contributions – *Mega Charizard X*
  - 10+ contributions – *Mega Charizard Y*
- Settings UI in the popup to enable/disable the extension and toggle original colors.
- Supports GitHub's SPA navigation and year‑switch detection.

## Installation
1. Clone this repository.
2. Open Chrome → Extensions (`chrome://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `C:\\GitMon` folder.
5. Pin the extension to your toolbar and enjoy!

## Usage
- Visit any GitHub profile page (e.g., `https://github.com/username`).
- The contribution graph will be enhanced with the appropriate Pokémon overlay.
- Use the popup to toggle the extension or switch to the original GitHub colors.

## Screenshots
| Contributions | Pokémon | Screenshot |
|---------------|---------|------------|
| 0 | Original square | ![0 contributions](docs/screenshots/github.com_torvalds_count-0.png) |
| 1 | Charmander | ![1 contribution](docs/screenshots/github.com_torvalds_count-1.png) |
| 2 | Charmeleon | ![2 contributions](docs/screenshots/github.com_torvalds_count-2.png) |
| 3 | Charmeleon | ![3 contributions](docs/screenshots/github.com_torvalds_count-3.png) |
| 4 | Charizard | ![4 contributions](docs/screenshots/github.com_torvalds_count-4.png) |
| 6 | Charizard | ![6 contributions](docs/screenshots/github.com_torvalds_count-6.png) |
| 7 | Mega Charizard X | ![7 contributions](docs/screenshots/github.com_torvalds_count-7.png) |
| 9 | Mega Charizard X | ![9 contributions](docs/screenshots/github.com_torvalds_count-9.png) |
| 10 | Mega Charizard Y | ![10 contributions](docs/screenshots/github.com_torvalds_count-10.png) |

## Privacy
GitMon runs entirely locally in the browser. No data is transmitted to external servers. The extension only reads the public GitHub contribution graph and stores settings in `chrome.storage.local`.

## Technologies Used
- JavaScript (ES6)
- Chrome Extension APIs (`chrome.storage`, `chrome.runtime`, `chrome.tabs`)
- MutationObserver for DOM changes
- Puppeteer scripts for automated QA (excluded from the repo)

## Intellectual Property Notice
The Pokémon artwork is fan‑created and used **solely for demonstration purposes**. This repository does **not** claim ownership of any Pokémon images. If you have concerns about copyrighted material, please remove the `assets/` directory before redistribution.

---
*Created for the Chrome Web Store release.*

https://github.com/user-attachments/assets/a94a612c-d443-4b7e-b26b-734422aef4e9
