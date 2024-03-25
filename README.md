# lesslog

### _Zero-dependency, teeny-tiny and serverless-ready logging utility for Node.js._

In most serverless environments log ingestion comes at a cost. And more often than not, those logs are not even looked at for most of the times. Until something goes bad and crucial debugging information is not available, as it was filtered to save on log ingestions.

Using `lesslog`, debug information is not logged immediately, but buffered internally. Once an error is logged any buffered logs will be emitted, preserving their original timestamp and context. No debug information is lost, while still maintaining clutter-free logs the rest of the time.

## AWS Lambda & CloudWatch

`lesslog` was created with AWS Lambda in mind and its default logging format is optimized for Amazon CloudWatch. As Lambda functions are reused as much as possible, `clear` must be called at the end of each Lambda execution to prevent the internal buffers to bloat and carry over log messages from previous executions. To resemble Lambda's default log message format, `tag` must be used at the very beginning of each execution, to add the `awsRequestId` to the logs.

Note: _If you use Middy, check out [`middy-lesslog`](https://github.com/robdasilva/middy-lesslog/#readme) as well!_

## Installation

```shell
$ npm install lesslog
```

## Usage

```javascript
import log from "lesslog";

log.label = "70e505ba-ad84-4816-82ec-f2a1ed4303ca";

log.debug("Debug message", { with: "additional", information: true });
log.info("Uncritical exceptional information", ["maybe", "an", "array", "?"]);
log.warn("Potentially critical warning", {
  tokenExpired: true,
  user: { id: 42 },
});
log.error("‾\\_(ツ)_/‾", {
  error: { message: error.message },
  user: { id: 42 },
});

log.debug("Yet another debug message");
log.clear();
```

Running the above code, will result in the following log messages:

```shell
2038-01-19T03:14:07.998Z  70e505ba-ad84-4816-82ec-f2a1ed4303ca  INFO  Uncritical exceptional information ["maybe","an","array","?"]
2038-01-19T03:14:07.999Z  70e505ba-ad84-4816-82ec-f2a1ed4303ca  WARN  Potentially critical warning {"tokenExpired":true,"user":{"id":42}}
2038-01-19T03:14:07.997Z  70e505ba-ad84-4816-82ec-f2a1ed4303ca  DEBUG  Debug message {"with":"additional","information":true}
2038-01-19T03:14:08.000Z  70e505ba-ad84-4816-82ec-f2a1ed4303ca  ERROR  ‾\_(ツ)_/‾ {"error":{"message":"Original error message"},"user":{"id":42}}
```

_Note that the last debug log is not emitted, since `error` is not called afterwards._

### API

`lesslog` exports a default `Log` instance that exposes the following methods:

#### `.clear() => void`

Discards the entire internal buffer.

_Must be called whenever `error` **is not** invoked and the previous debug messages can be discarded to prevent the internal buffers from bloating._

#### `.flush() => void`

Flushes all internally buffered logs to `process.env.stdout`.

#### `.debug(message: string, context?: LogContext) => void`

Stores a log message in the internal buffer with a `DEBUG` log level.

_If the `DEBUG` environment variable is set to either `'1'`, `'on'`, `'true'`, or `'yes'`, the log message will not be stored and instead written to `process.env.stdout` directly._

#### `.info(message: string, context?: LogContext) => void`

Writes a log message to `process.env.stdout` with an `INFO` log level.

#### `warn(message: string, context?: LogContext) => void`

Writes a log message to `process.env.stderr` with a `WARN` log level.

#### `error(message: string, context?: LogContext) => void`

Writes a log message to `process.env.stderr` with an `ERROR` log level **after** flushing all internally buffered logs to `process.env.stdout`.

#### `.context`

Get and set the default context for the `Log` instance.

The default context will be merged with the context passed to the `Log` methods above, potentially overriding properties in the default context.

#### `.label`

Get and set the log label for the `Log` instance.

### Advanced Usage

```typescript
import { ILogEntry, Log } from "lesslog";

function format({
  context,
  label,
  level,
  message,
  timestamp,
}: ILogEntry): string {
  const isoString = new Date(timestamp).toISOString();
  const metrics = [
    message,
    context.sumQueryCount,
    context.avgQueryDuration,
    context.dbClusterInstance,
  ];

  return `${isoString}\t${label}\t${level}\t${metrics.join("|")}`;
}

const log = new Log(format);

log.label = "14968fcb-6481-46d8-a068-b97d4be47852";

log.info("DBQueryMetrics", {
  sumQueryCount: 42,
  avgQueryDuration: 0.618,
  dbClusterInstance: "readreplica",
});
```

Running the above code, will result in the following log messages:

```shell
2038-01-19T03:14:08.000Z  14968fcb-6481-46d8-a068-b97d4be47852  INFO  DBQueryMetrics|42|0.618|readreplica
```

#### `new Log(format?: LogFormatFunction) => Log`

Creates and returns a new log instance with a custom log formatting function.

The formatting function is invoked for every log entry with an object containing the following properties and is expected to return a string:

| Argument    | Type   | Description                                     |
| ----------- | ------ | ----------------------------------------------- |
| `context`   | object | The log context merged with the default context |
| `label`     | string | The log label set on the Log instance           |
| `level`     | string | The log level of the invoked log function       |
| `message`   | string | Log message passed to the log function          |
| `timestamp` | number | Milliseconds since 1970-01-01T00:00:00.000Z     |
