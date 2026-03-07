import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        titleBarStyle: 'hidden', // hides the default title bar for a modern look
        titleBarOverlay: {
            color: '#0f1115',
            symbolColor: '#f0f2f5',
            height: 30
        },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // We will use window.require in the frontend
        },
    });

    // Handle Folder Selection natively
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory']
        });
        if (result.canceled) return null;
        return result.filePaths[0]; // Returns absolute path
    });

    // Handle File Writing natively (CSV / Image Buffers)
    ipcMain.handle('save-file', async (event, { filePath, data, isBuffer }) => {
        try {
            if (isBuffer) {
                // If the payload is an ArrayBuffer from fetch
                const buffer = Buffer.from(data);
                fs.writeFileSync(filePath, buffer);
            } else {
                // If it's pure text (CSV)
                fs.appendFileSync(filePath, data);
            }
            return { success: true };
        } catch (err) {
            console.error(err);
            return { success: false, error: err.message };
        }
    });

    // Handle File reading natively
    ipcMain.handle('read-file', async (event, filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8');
            }
            return null;
        } catch (err) {
            return null;
        }
    });

    // Load the Vite dev server URL in development, or the local index.html in production
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
