namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    EMAIL_SERVER: string
    EMAIL_FROM: string
    GOOGLE_ID: string
    GOOGLE_SECRET: string
    DATABASE_URL: string
  }
}
