import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

// PDF Parser Import (funktioniert mit v1.1.1)
const pdfParse = require('pdf-parse');

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.uniquest.tracker')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // --- IPC HANDLER ---

  // 1. Datei Dialog
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDFs', extensions: ['pdf'] }]
    })
    if (canceled) return null
    return filePaths[0]
  })

  // 2. PDF Parsing
  ipcMain.handle('pdf:parse', async (_, filePath: string) => {
    try {
      console.log('Processing PDF:', filePath);
      const dataBuffer = fs.readFileSync(filePath)
      
      const data = await pdfParse(dataBuffer) 
      const cleanText = data.text.replace(/\s+/g, ' ').trim()
      
      console.log('Success! Text length:', cleanText.length);
      return { success: true, text: cleanText }
    } catch (error) {
      console.error('Error parsing PDF:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // 3. AI Request Handler (NEU: Umgeht CORS)
  ipcMain.handle('ai:request', async (_, { model, prompt }) => {
    console.log('Sending request to Ollama via Main Process...');
    
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: model, 
          prompt: prompt, 
          stream: false, 
          format: "json" 
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama Error: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      console.error("AI Error:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown AI error' };
    }
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})