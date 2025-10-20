const { ipcRenderer } = require('electron');

let running = false;
let folderPath = null;

const toggleButton = document.getElementById('toggleButton');
const chooseFolderButton = document.getElementById('chooseFolderButton');
const status = document.getElementById('status');
const selectedFolder = document.getElementById('selected-folder');
const logContainer = document.getElementById('log');

// Charger le dossier sauvegardé
window.addEventListener('DOMContentLoaded', () => {
    folderPath = ipcRenderer.sendSync('get-saved-folder');
    if (folderPath) {
        selectedFolder.textContent = folderPath;
    } else {
        selectedFolder.textContent = 'Aucun dossier enregistré';
    }
});

// Choisir un nouveau dossier
chooseFolderButton.addEventListener('click', async () => {
    folderPath = await ipcRenderer.invoke('choose-folder');
    if (folderPath) {
        selectedFolder.textContent = folderPath;
    } else {
        selectedFolder.textContent = 'Aucun dossier enregistré';
    }
});

// Activer/désactiver le tri
toggleButton.addEventListener('click', () => {
    if (!folderPath) {
        status.textContent = 'Veuillez sélectionner un dossier d’abord';
        return;
    }

    running = !running;
    ipcRenderer.send('toggle-sorter', running);
    toggleButton.textContent = running ? 'Désactiver le tri' : 'Activer le tri';
});

ipcRenderer.on('status-update', (event, message) => {
    running = message === 'activated';
    status.textContent = running ? 'activé' : 'désactivé';
    status.style.color = running ? 'green' : 'red';
});

ipcRenderer.on('log-message', (event, message) => {
    addLog(message);
});

function addLog(message) {
    const logEntry = document.createElement('div');
    const date = new Date();
    const timestamp = date.toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] : ${message}`;
    logContainer.prepend(logEntry);
}
