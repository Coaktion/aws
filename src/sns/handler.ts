import {
  type PublishBatchCommandOutput,
  PublishCommand,
  SNSClient,
  PublishBatchCommand
} from '@aws-sdk/client-sns'
import {
  type SNSClientOptions,
  type SNSBulkEntry,
  type SNSPublishOptions
} from './types'
import { randomUUID } from 'crypto'

export class SNSHandler {
  client: SNSClient

  constructor(options: SNSClientOptions) {
    this.client = new SNSClient(options)
  }

  async publish(options: SNSPublishOptions) {
    const params = {
      Message: JSON.stringify(options.message),
      TopicArn: options.topicArn,
      MessageAttributes: options.messageAttributes,
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
      MessageAttributes: entry.messageAttributes,
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
