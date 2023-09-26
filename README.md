# Coaktion AWS

Module to wrap AWS services implementations.

Currently, supporting:
- SNS publish

## Installation
`npm install @coaktion/aws`

## Usage

```typescript
const handler = new SNSHandler({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

handler.publish({
  topicArn: 'arn:aws:sns:us-east-1:123456789012:my-topic',
  message: 'Hello World!'
})
```

## License
Coaktion AWS is [MIT](./LICENSE)

## Authors

- **Gustavo Inácio** - _Initial work_ - [gustavo inacio](https://github.com/inaciogu)
