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

  needToConvert(messageAttributes: Record<string, any>) {
    if (typeof messageAttributes !== 'object') return true

    const hasAnyInvalidAttributes = Object.values(messageAttributes).some(
      (attr) => {
        console.log(attr)
        if (typeof attr !== 'object') return true

        const type = attr.DataType
        const strValue = attr.StringValue
        const binaryValue = attr.BinaryValue

        const isMissingAnyKey =
          type === undefined ||
          (strValue === undefined && binaryValue === undefined)

        if (isMissingAnyKey) return true

        const isAnyKeyInvalid =
          typeof type !== 'string' ||
          (typeof strValue !== 'string' &&
            !(binaryValue instanceof ArrayBuffer))

        if (isAnyKeyInvalid) {
          throw new Error('Invalid message attributes')
        }

        return false
      }
    )

    return hasAnyInvalidAttributes
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
    if (value instanceof ArrayBuffer) return 'BinaryValue'

    return 'StringValue'
  }

  addaptValue(value: any) {
    const type = typeof value

    if (value instanceof ArrayBuffer) return value
    if (type === 'object') return JSON.stringify(value)

    return value.toString()
  }

  prepareMessageAttributes(messageAttributes: Record<string, any>) {
    if (Object.keys(messageAttributes).length === 0) return undefined
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
    if (!this.needToConvert(messageAttributes)) return messageAttributes

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
