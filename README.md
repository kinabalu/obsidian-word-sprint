## Word Sprint for Obsidian
Word Sprint for Obsidian is a plugin which helps an obsidian user who does any writing tasks
with achieving that flow state that we are looking for. It offers you the ability to create
sprints of time (by default 25 minutes) and times and gives you guidance along the way to
keep you writing and not checking Twitter.

The plugin was inspired by discussion on Discord in the NANOWRIMO 2021 thread of creative.

Reference: https://www.wikiwrimo.org/wiki/Word_war

### Features
- A pomodoro-style timer for tracking writing (default sprint is 25 minutes but configurable)
- Goals that can be configured from settings
- Nudges if you stop writing for 10 or 60 seconds to keep the flow going (also configurable)
- A wealth of stats including sprint length, total words written, average words per minute, longest stretch not writing, total time not writing, total words added, total words deleted, and total net words
- The ability to start fresh and reset daily stats or all stats

### Coming Soon
- Online sprints to challenge and do sprints with friends


### Installation
The Word Sprint Plugin is available in the Obsidian Community Plugins area.

1. Turn off restricted mode if it's on
2. Click 'Browse' under Community pllugins and search for "Word Sprint"
3. Install and enable the plugin
4. Have fun!

### Manual Installation
Two methods and the first one is easier:

#### Method 1
- Enable community plugins and install [Obsidian42 - BRAT](https://github.com/TfTHacker/obsidian42-brat)
- Go to settings and under Beta Plugin List click "Add Beta plugin" and type `kinabalu/obsidian-word-sprint`

#### Method 2
- Create an `obsidian-word-sprint` folder under `.obsidian/plugins` in your vault. Add the
`main.js`, `manifest.json`, and the `styles.css` files from the
[latest release](https://github.com/kinabalu/obsidian-word-sprint/releases) to the folder.

## Usage
After successfully installing the plugin (using BRAT for now). A ribbon icon of a running man can be clicked
to show the right-hand leaf view containing the majority of functions for the tool.

The leaf contains Start, Stop, allows you to see your Stats, and your Goals (all can be setup in settings)

If you click on the timer you can change the Sprint Time temporarily for the next sprint to a new value.

There are several commands available to be used with the command palette (Ctrl-P or ⌘-P) or map a hotkey.

- Start Word Sprint (`start-word-sprint`)
- Stop Word Sprint (`stop-word-sprint`)
- Change Word Sprint Length (`change-word-sprint-length`)
- Show Word Sprint Leaf (`show-word-sprint-leaf)
- Insert Last Word Sprint Stats (`insert-last-word-sprint-stats`)
- Insert Average Word Sprint Stats (`insert-average-word-sprint-stats`)

### NanoWriMo Integration
If you have a regular account you've signed up with through [nanowrimo.org](https://nanowrimo.org) you can
login using the plugin settings, select a project and the challenge to enable auto-updating progress in nanowrimo
from the sprinting tool.

For those of you logged in with Google or Facebook it's a little more challenging. My suggestion is to install a plugin
named [Live HTTP Headers](https://chrome.google.com/webstore/detail/live-http-headers/ianhploojoffmpcpilhgpacbeaifanid).

After installing this, you can activate it, hit Settings and turn off everything in Capture but `XMLHttpRequests` and 
I always like choosing Formatted View headers. 

After running this and ensuring Capture is turned on. Open up NaNoWriMo in a new browser tab and make
sure you're logged in and viewing a project. Find one of the requests near the top that starts with
`https://api.nanowrimo.org...` and select it. You should see on the right a Request Header named "Authorization".
Copy that to your clipboard.

Once you have your Authorization key, close Obsidian, open `data.json` inside of the plugin directory
`<uour vault>/.obsidian/plugins/obsidian-word-sprint` and add a key `nanowrimoAuthToken` with the
token as value.

## Say Thanks 🙏

If you like this plugin and would like to buy me a coffee, you can!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/andrewlombardi)
