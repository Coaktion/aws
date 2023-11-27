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

  describe('buildMessageAttributes', () => {
    it.each([
      ['test', 'String'],
      [1, 'Number'],
      [1.2, 'Number'],
      [true, 'String'],
      [{}, 'String'],
      [[], 'String.Array'],
      [new ArrayBuffer(1), 'Binary']
    ])('should identify data type of %s as %s', (value, expected) => {
      expect(handler.identifyDataType(value)).toBe(expected)
    })

    it.each([
      ['test', 'StringValue'],
      [1, 'StringValue'],
      [1.2, 'StringValue'],
      [true, 'StringValue'],
      [{}, 'StringValue'],
      [[], 'StringValue'],
      [new ArrayBuffer(1), 'BinaryValue']
    ])('should adapt value of %s as %s', (value, expected) => {
      expect(handler.identifyValue(value)).toBe(expected)
    })

    it.each([
      [
        { test: 'test' },
        '"StringValue": "test"',
        { test: { DataType: 'String', StringValue: 'test' } }
      ],
      [
        { test: 1 },
        '"StringValue": "1"',
        { test: { DataType: 'Number', StringValue: '1' } }
      ],
      [
        { test: 1.2 },
        '"StringValue": "1.2"',
        { test: { DataType: 'Number', StringValue: '1.2' } }
      ],
      [
        { test: true },
        '"StringValue": "true"',
        { test: { DataType: 'String', StringValue: 'true' } }
      ],
      [
        { test: {} },
        '"StringValue": "{}"',
        { test: { DataType: 'String', StringValue: '{}' } }
      ],
      [
        { test: [] },
        '"StringValue": "[]"',
        { test: { DataType: 'String.Array', StringValue: '[]' } }
      ],
      [
        { test: new ArrayBuffer(1) },
        '"BinaryValue": "<some binary>"',
        { test: { DataType: 'Binary', BinaryValue: new ArrayBuffer(1) } }
      ]
    ])(
      'should prepare message attributes of %s as %s',
      (value, _, expected) => {
        expect(handler.prepareMessageAttributes(value)).toEqual(expected)
      }
    )

    it('should early return empty object if message attributes is empty', () => {
      const spyIdentifyDataType = jest.spyOn(handler, 'identifyDataType')
      const spyIdentifyValue = jest.spyOn(handler, 'identifyValue')
      const spyAddaptValue = jest.spyOn(handler, 'addaptValue')

      const result = handler.prepareMessageAttributes({})

      expect(result).toBeUndefined()
      expect(spyIdentifyDataType).not.toHaveBeenCalled()
      expect(spyIdentifyValue).not.toHaveBeenCalled()
      expect(spyAddaptValue).not.toHaveBeenCalled()
    })

    it('should build the message attributes with success', () => {
      const attributes = {
        string: 'test',
        number: 1,
        flaot: 1.2,
        boolean: true,
        object: {},
        array: [],
        binary: new ArrayBuffer(1)
      }

      const result = handler.buildMessageAttributes(attributes)

      console.log(result)

      expect(result).toEqual({
        string: {
          DataType: 'String',
          StringValue: attributes.string
        },
        number: {
          DataType: 'Number',
          StringValue: attributes.number.toString()
        },
        flaot: {
          DataType: 'Number',
          StringValue: attributes.flaot.toString()
        },
        boolean: {
          DataType: 'String',
          StringValue: attributes.boolean.toString()
        },
        object: {
          DataType: 'String',
          StringValue: JSON.stringify(attributes.object)
        },
        array: {
          DataType: 'String.Array',
          StringValue: JSON.stringify(attributes.array)
        },
        binary: {
          DataType: 'Binary',
          BinaryValue: new ArrayBuffer(1)
        }
      })
    })

    it('should return empty object if message attributes is undefined', () => {
      expect(handler.buildMessageAttributes()).toEqual({})
    })
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

    it('should split bulk publish into batches of 10', async () => {
      handler.client.send = jest.fn()
      const data = {
        message: 'test'
      }

      const messages = Array.from({ length: 15 }, () => data)

      await handler.bulkPublish(
        'arn:aws:sns:us-east-1:000000000000:topic',
        messages
      )

      expect(handler.client.send).toHaveBeenCalledTimes(2)
    })
  })
})
