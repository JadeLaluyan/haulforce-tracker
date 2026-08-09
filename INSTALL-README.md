# Haulforce Advanced Tracker — Offline Installer

Installs the complete app with its own private database on this computer.
No internet is needed after installation. Each computer keeps its OWN data.

## Requirements
- Windows 10/11
- Node.js 20 LTS or newer — setup installs it automatically via winget if missing

## Install
1. Copy this whole folder to the computer (e.g. C:\Haulforce).
2. Double-click **install.bat** and follow the prompts.
   You'll be asked to set the admin email and password.
3. When it finishes, "Haulforce Tracker" appears on the desktop, in the
   Start Menu, and under Settings > Apps (with its own uninstaller).

## Daily use
Double-click the **Haulforce Tracker** shortcut. It starts the database and
the app, then opens it in its own app window (no browser toolbar). Keep the
small black window open while working; close it to stop the app.

## Data & backups
All data lives in the `pgdata` folder inside the install folder.
To back up: close the app, then copy the whole install folder.
To move to a new PC: copy the folder, run install.bat once, done.

## Notes
- Internet is used only during install (to download dependencies).
- Re-running install.bat is safe: it keeps existing data and accounts.
