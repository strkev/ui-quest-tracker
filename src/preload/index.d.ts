import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectPdf: () => Promise<string | null>
      parsePdf: (filePath: string) => Promise<{ success: boolean; text?: string; error?: string }>
      generateAI: (model: string, prompt: string) => Promise<{ success: boolean; data?: any; error?: string }>
    }
  }
}