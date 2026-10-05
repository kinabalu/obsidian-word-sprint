## Word Sprint for Obsidian
Word Sprint is a plugin that helps anyone doing writing in Obsidian reach that flow state
we are all looking for. It lets you run timed sprints (25 minutes by default) and gives you
nudges along the way to keep you writing and not checking social media.

The plugin was inspired by a discussion in the creative channel on Discord during NaNoWriMo 2021.

Reference: https://www.wikiwrimo.org/wiki/Word_war

### Features
- A pomodoro-style timer for tracking writing (default sprint is 25 minutes but configurable)
- Daily and overall word count goals that can be configured from settings
- Nudges if you stop writing for 10 or 60 seconds to keep the flow going (also configurable)
- Optional encouragement notices each time you hit a word count milestone
- A wealth of stats including sprint length, total words written, average words per minute, longest stretch not writing, total time not writing, total words added, total words deleted, and total net words
- Export all stats to a CSV file in your vault
- The ability to start fresh and reset daily stats or all stats

### Installation
The Word Sprint plugin is available in the Obsidian Community Plugins area.

1. Turn off restricted mode if it's on
2. Click "Browse" under Community plugins and search for "Word Sprint"
3. Install and enable the plugin
4. Have fun!

### Manual Installation
Two methods, and the first one is easier:

#### Method 1
- Enable community plugins and install [Obsidian42 - BRAT](https://github.com/TfTHacker/obsidian42-brat)
- Go to settings and under Beta Plugin List click "Add Beta plugin" and type `kinabalu/obsidian-word-sprint`

#### Method 2
- Create an `obsidian-word-sprint` folder under `.obsidian/plugins` in your vault. Add the
`main.js`, `manifest.json`, and `styles.css` files from the
[latest release](https://github.com/kinabalu/obsidian-word-sprint/releases) to the folder.

## Usage
After installing the plugin, click the running man ribbon icon to show the right-hand leaf
view containing the majority of functions for the tool.

The leaf contains Start and Stop buttons, plus tabs for your Stats and your Goals (goals are set up in settings).

If you click on the timer you can change the sprint length temporarily for the next sprint.

The following commands are available from the command palette (Ctrl-P or ⌘-P), and each can be mapped to a hotkey:

- Start sprint (`start-word-sprint`)
- Stop sprint (`stop-word-sprint`)
- Toggle start/stop sprint (`toggle-word-sprint`)
- Change sprint length (`change-word-sprint-length`)
- Show sprint leaf (`show-word-sprint-leaf`)
- Insert last sprint stats (`insert-last-word-sprint-stats`)
- Insert average sprint stats (`insert-average-word-sprint-stats`)
- Insert all sprint stats table (`insert-all-word-sprint-stats-table`)

## Development
```sh
npm install
npm run dev     # rebuild main.js on change
npm run build   # type-check and produce a production main.js
npm run lint    # eslint with the Obsidian plugin ruleset
npm test        # jest unit tests
```

## Say Thanks 🙏

If you like this plugin and would like to buy me a coffee, you can!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/andrewlombardi)
