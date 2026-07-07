/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_PWA_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
