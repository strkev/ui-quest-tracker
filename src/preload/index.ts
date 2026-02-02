import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Funktion zum Öffnen des Datei-Dialogs
  selectPdf: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  
  // Funktion zum Parsen der PDF
  parsePdf: (filePath: string): Promise<{ success: boolean; text?: string; error?: string }> => 
    ipcRenderer.invoke('pdf:parse', filePath)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}