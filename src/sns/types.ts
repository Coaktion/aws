import { type ClientOptions } from '../common/client-options'

export interface SNSClientOptions extends ClientOptions {
  endpoint?: string
}

export interface SNSPublishOptions {
  topicArn: string
  message: any
  phoneNumber?: string
  targetArn?: string
  subject?: string
  messageStructure?: string
  messageAttributes?: any
  messageGroupId?: string
}

export interface SNSBulkEntry {
  subject?: string
  message: any
  messageStructure?: string
  messageAttributes?: any
  messageGroupId?: string
}

export interface SNSBulkPublishOptions {
  topicArn: string
  entries: SNSPublishOptions[]
}
