import { SNSHandler, type SNSPublishOptions } from '../../src/'

describe('SNS Handler', () => {
  let handler: SNSHandler

  beforeEach(() => {
    handler = new SNSHandler({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      },
      endpoint: 'http://localhost:4566'
    })
  })

  it('should be defined', () => {
    expect(handler).toBeDefined()
  })

  describe('publish', () => {
    it('should call publish method with correct params', async () => {
      handler.client.send = jest.fn()

      const options: SNSPublishOptions = {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:topic',
        message: {
          default: 'test'
        }
      }

      await handler.publish(options)

      expect(handler.client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: options.topicArn,
            Message: JSON.stringify(options.message)
          })
        })
      )
    })
  })

  describe('bulk publish', () => {
    it('should call publish method with correct params', async () => {
      handler.client.send = jest.fn()

      const options: SNSPublishOptions = {
        topicArn: 'arn:aws:sns:us-east-1:000000000000:topic',
        message: {
          default: 'test'
        }
      }

      await handler.bulkPublish(options.topicArn, [
        {
          message: options.message
        }
      ])

      expect(handler.client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: options.topicArn,
            PublishBatchRequestEntries: [
              expect.objectContaining({
                Message: JSON.stringify(options.message)
              })
            ]
          })
        })
      )
    })
  })
})
