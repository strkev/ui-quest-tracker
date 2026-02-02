import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectPdf: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),
  
  parsePdf: (filePath: string): Promise<{ success: boolean; text?: string; error?: string }> => 
    ipcRenderer.invoke('pdf:parse', filePath),

  // NEU: AI Bridge
  generateAI: (model: string, prompt: string): Promise<{ success: boolean; data?: any; error?: string }> =>
    ipcRenderer.invoke('ai:request', { model, prompt })
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}