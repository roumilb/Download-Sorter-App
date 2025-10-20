const chokidar = require('chokidar');
const fs = require('fs');
const pathModule = require('path');

module.exports = function(folderWatched, logFn) {
    let watcher = chokidar.watch(folderWatched, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        depth: 0
    });

    logFn(`Surveillance démarrée sur : ${folderWatched}`);

    watcher.on('add', path => {
        const file = trimSlashes(path.replace(folderWatched, ''));
        const folderWatchedTrimmed = trimSlashesEnd(folderWatched);
        let folder = trimSlashes(pathModule.extname(file).replace('.', ''));
        if ('crdownload' === folder) return;

        const newPath = `${folderWatchedTrimmed}/${folder}/${file}`;

        if (!fs.existsSync(`${folderWatchedTrimmed}/${folder}`)) {
            fs.mkdirSync(`${folderWatchedTrimmed}/${folder}`);
        }

        fs.rename(path, newPath, function (err) {
            if (err) {
                logFn(`Erreur déplacement ${file} : ${err.message}`);
                return;
            }
            logFn(`Fichier déplacé : ${file} → ${folder}/`);
        });
    });

    function trimSlashesEnd(str) { return str.replace(/\/+$/, ''); }
    function trimSlashes(str) { return trimSlashesEnd(str.replace(/^\/+/, '')); }

    function stopWatcher() {
        if (watcher) {
            watcher.close();
            watcher = null;
            logFn('Surveillance arrêtée.');
        }
    }

    return { stopWatcher };
};
