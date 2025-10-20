const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let sorterProcess = null;
let selectedFolder = null;
let tray = null;
let mainWindow = null;

const configPath = path.join(app.getPath('userData'), 'config.json'); // emplacement sûr pour macOS

function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            selectedFolder = data.selectedFolder || null;
        }
    } catch (err) {
        console.error('Erreur de lecture config:', err);
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(configPath, JSON.stringify({ selectedFolder }, null, 2));
    } catch (err) {
        console.error('Erreur d’écriture config:', err);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 350,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon-16.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Ouvrir DownloadSorter',
            click: () => mainWindow.show()
        },
        {
            label: 'Quitter',
            click: () => {
                if (sorterProcess && sorterProcess.stopWatcher) {
                    sorterProcess.stopWatcher();
                }
                app.quit();
                app.exit();
            }
        }
    ]);

    tray.setToolTip('Download Sorter');
    tray.setContextMenu(contextMenu);
}

ipcMain.handle('choose-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        selectedFolder = result.filePaths[0];
        saveConfig(); // <-- sauvegarde immédiate
        return selectedFolder;
    }
    return null;
});

ipcMain.on('get-saved-folder', (event) => {
    event.returnValue = selectedFolder;
});

ipcMain.on('toggle-sorter', (event, start) => {
    if (!selectedFolder) {
        event.reply('status-update', 'Aucun dossier sélectionné');
        return;
    }

    if (start) {
        if (!sorterProcess) {
            const sendLog = (message) => {
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('log-message', message);
                }
                console.log('[Sorter]', message);
            };
            sorterProcess = require('./downloadSorter.js')(selectedFolder, sendLog);
            event.reply('status-update', 'activated');
        }
    } else {
        if (sorterProcess && sorterProcess.stopWatcher) {
            sorterProcess.stopWatcher();
            sorterProcess = null;
            event.reply('status-update', 'deactivated');
        }
    }
});

ipcMain.on('status-toggle-sorter', (event) => {
    event.reply('status-update', sorterProcess ? 'activated' : 'deactivated');
});

app.whenReady().then(() => {
    loadConfig();
    createWindow();
    createTray();

    app.on('before-quit', () => {
        app.exit()
    });
});
