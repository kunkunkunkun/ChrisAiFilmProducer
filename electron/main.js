import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, getLegacyProjects, addProject, updateProject, deleteProject, getTasks, addTask, updateTask, deleteTask, getStats } from './db.js';

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

    // Handle Image Download to Buffer (to bypass 403/CORS)
    ipcMain.handle('download-image', async (event, url) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (HTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': 'https://pollinations.ai/'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            return { success: true, data: Buffer.from(arrayBuffer) };
        } catch (err) {
            console.error("Download failed:", err);
            return { success: false, error: err.message };
        }
    });

    // Handle File Writing natively (CSV / Image Buffers)
    ipcMain.handle('save-file', async (event, { filePath, data, isBuffer }) => {
        try {
            if (isBuffer) {
                const buffer = Buffer.from(data);
                fs.writeFileSync(filePath, buffer);
            } else {
                fs.appendFileSync(filePath, data);
            }
            return { success: true };
        } catch (err) {
            console.error("Save error:", err);
            let userMessage = err.message;
            if (err.code === 'EBUSY') {
                userMessage = "File is busy or locked. Please close the CSV file (e.g. in Excel) and try again.";
            }
            return { success: false, error: userMessage, code: err.code };
        }
    });

    // Handle File Overwriting (for CRUD)
    ipcMain.handle('write-file', async (event, { filePath, data }) => {
        try {
            fs.writeFileSync(filePath, data, 'utf-8');
            return { success: true };
        } catch (err) {
            console.error("Write error:", err);
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

    // Database Handlers
    ipcMain.handle('db-get-projects', () => getLegacyProjects());
    ipcMain.handle('db-add-project', (event, project) => addProject(project));
    ipcMain.handle('db-update-project', (event, id, project) => updateProject(id, project));
    ipcMain.handle('db-delete-project', (event, id) => deleteProject(id));
    
    ipcMain.handle('db-get-tasks', (event, projectId) => getTasks(projectId));
    ipcMain.handle('db-add-task', (event, task) => addTask(task));
    ipcMain.handle('db-update-task', (event, id, updates) => updateTask(id, updates));
    ipcMain.handle('db-delete-task', (event, id) => deleteTask(id));
    
    ipcMain.handle('db-get-stats', () => getStats());

    // Load the Vite dev server URL in development, or the local index.html in production
    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    try {
        initDb();
    } catch (err) {
        console.error("Failed to init sqlite db", err);
    }
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
