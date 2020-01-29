# lesslog

**_Logging for the serverless age_**

Zero-dependency, teeny-tiny and serverless-ready logging utility for Node.js.

In most serverless environments log ingestion comes at a cost. And more often than not, those logs are not even looked at for most of the times. Until something goes bad and crucial debugging information is not available, as it was filtered to save on log ingestions.

Using `lesslog` debug information is not logged immediately, but buffered internally. Once an error is logged any buffered logs will be emitted, preserving their original timestamp and context. No debug information is lost, while still maintaining clutter-free logs the rest of the time.

## AWS Lambda & CloudWatch

`lesslog` was created with AWS Lambda in mind and its default log formatting is optimized for Amazon CloudWatch. As Lambda functions are reused as much as possible, `clear` must be called at the end of each Lambda execution to prevent the internal buffers to bloat and carry over log messages from previous executions.

## Installation

```shell
$ npm install lesslog
```

## Usage

```javascript
import { debug, info, warn, error, clear } from 'lesslog'

debug('Debug message', { with: 'additional', information: true })
info('Uncritical exceptional information', ['maybe', 'an', 'array', '?'])
warn('Potentially critical warning', { tokenExpired: true, user: { id: 42 } })
error('‾\\_(ツ)_/‾', { error: { message: error.message }, user: { id: 42 } })

debug('Yet another debug message')
clear()
```

Running the above code, will result in the following log messages:

```shell
2038-01-19T03:14:07.998Z  INFO  Uncritical exceptional information ["maybe","an","array","?"]
2038-01-19T03:14:07.999Z  WARN  Potentially critical warning {"tokenExpired":true,"user":{"id":42}}
2038-01-19T03:14:07.997Z  DEBUG  Debug message {"with":"additional","information":true}
2038-01-19T03:14:08.000Z  ERROR  ‾\_(ツ)_/‾ {"error":{"message":"Original error message"},"user":{"id":42}}
```

_Note the last debug log is not emitted as `error` is not called afterwards._

### API

#### `clear() => Buffer`

Clears and returns the entire internal buffer.

_Must be called whenever `error` **is not** invoked and the previous debug messages can be discarded to prevent the internal buffers to bloat._

#### `debug(message: string, context?: any) => void`

Stores a log message in the internal buffers.

_If the `DEBUG` environment variable is set to either `'1'`, `'on'`, `'true'`, or `'yes'`, the log message will not be stored and instead written to `process.env.stdout` directly._

#### `info(message: string, context?: any) => void`

Writes a log message to `process.env.stdout`.

#### `warn(message: string, context?: any) => void`

Writes a log message to `process.env.stderr`.

#### `error(message: string, context?: any) => void`

Writes a log message to `process.env.stderr` **after** triggering any internally buffered logs to be written to `process.env.stdout`.

### Advanced Usage

```javascript
import log from 'lesslog'

const label = 'MONITORING'

function format(timestamp, label, message, context) {
  const metrics = [message, ...context].join('|')
  return `${new Date(timestamp).toISOString()}\t${label}\t${metrics}`
}

const logMetrics = log(label, format)

logMetrics('DBQueryMetrics', [42, 0.618, 'readreplica'])
```

Running the above code, will result in the following log messages:

```shell
2038-01-19T03:14:08.000Z  MONITORING  DBQueryMetrics|42|0.618|readreplica
```

#### `log(label: string, format?: Function) => (message: string, context?: any)`

Creates and returns a custom log function to write log message directly to `process.env.stdout`.

A custom formatting function can be passed as a second argument, which will always be invoked with the following arguments:

| Argument    | Type   | Description                                        |
| ----------- | ------ | -------------------------------------------------- |
| `timestamp` | number | Milliseconds since 1970-01-01T00:00:00.000Z        |
| `label`     | string | The lable used to create the custom log function   |
| `message`   | string | Log message passed to the custom log function      |
| `label`     | any    | Optional context passed to the custom log function |
