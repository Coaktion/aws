import {
  type PublishBatchCommandOutput,
  PublishCommand,
  SNSClient,
  PublishBatchCommand
} from '@aws-sdk/client-sns'
import {
  type SNSClientOptions,
  type SNSBulkEntry,
  type SNSPublishOptions,
  type SNSPublishMessageAttributes
} from './types'
import { randomUUID } from 'crypto'
import {
  MESSAGE_ATTRIBUTES,
  MESSAGE_ATTRIBUTES_FALLBACK,
  UNSUPPORTED_TYPES
} from '../common/message-attributes'

export class SNSHandler {
  client: SNSClient

  constructor(options: SNSClientOptions) {
    this.client = new SNSClient(options)
  }

  identifyDataType(value: any) {
    const type = typeof value

    if (value instanceof ArrayBuffer) return MESSAGE_ATTRIBUTES.binary
    if (type === 'object') {
      return Array.isArray(value)
        ? MESSAGE_ATTRIBUTES.object
        : MESSAGE_ATTRIBUTES.string
    }

    return UNSUPPORTED_TYPES.includes(type)
      ? MESSAGE_ATTRIBUTES_FALLBACK
      : MESSAGE_ATTRIBUTES[type]
  }

  identifyValue(
    value: any
  ): keyof Partial<Omit<SNSPublishMessageAttributes, 'DataType'>> {
    const type = typeof value

    if (value instanceof ArrayBuffer) return 'BinaryValue'
    if (type === 'object') {
      return Array.isArray(value) ? 'StringListValues' : 'StringValue'
    }

    const captalizedType = type[0].toUpperCase() + type.slice(1)
    return UNSUPPORTED_TYPES.includes(type)
      ? 'StringValue'
      : (`${captalizedType}Value` as any)
  }

  addaptValue(value: any) {
    const type = typeof value
    if (UNSUPPORTED_TYPES.includes(type)) return value.toString()

    return value
  }

  prepareMessageAttributes(messageAttributes: Record<string, any>) {
    if (Object.keys(messageAttributes).length === 0) return {}
    const attr: Record<string, SNSPublishMessageAttributes> = {}

    for (const [key, value] of Object.entries(messageAttributes)) {
      const DataType = this.identifyDataType(value)

      attr[key] = {
        DataType,
        [this.identifyValue(value)]: this.addaptValue(value)
      }
    }

    return attr
  }

  buildMessageAttributes(messageAttributes?: Record<string, any>) {
    if (messageAttributes === undefined) return {}

    return this.prepareMessageAttributes(messageAttributes)
  }

  async publish(options: SNSPublishOptions) {
    const params = {
      Message: JSON.stringify(options.message),
      TopicArn: options.topicArn,
      MessageAttributes: this.buildMessageAttributes(options.messageAttributes),
      MessageStructure: options.messageStructure,
      MessageGroupId: options.messageGroupId,
      Subject: options.subject,
      PhoneNumber: options.phoneNumber,
      TargetArn: options.targetArn,
      MessageDeduplicationId: options.messageDeduplicationId
    }

    const command = new PublishCommand(params)

    const response = await this.client.send(command)
    return response
  }

  async bulkPublish(topic: string, entries: SNSBulkEntry[]) {
    const params = entries.map((entry) => ({
      Id: randomUUID(),
      Message: JSON.stringify(entry.message),
      MessageAttributes: this.buildMessageAttributes(entry.messageAttributes),
      MessageStructure: entry.messageStructure,
      MessageGroupId: entry.messageGroupId,
      MessageDeduplicationId: entry.messageDeduplicationId,
      Subject: entry.subject
    }))

    const response: Array<Promise<PublishBatchCommandOutput>> = []

    while (params.length > 0) {
      const batch = params.splice(0, 10)

      const command = new PublishBatchCommand({
        PublishBatchRequestEntries: batch,
        TopicArn: topic
      })

      const batchResponse = this.client.send(command)

      response.push(batchResponse)
    }

    return await Promise.all(response)
  }
}
