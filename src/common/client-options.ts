export interface ClientOptions {
  region?: string
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
  }
  logger?: any
}
