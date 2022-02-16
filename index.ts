import { PassThrough } from 'stream'
import { inspect } from 'util'

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

interface ILogContext {
  [key: string]: any
}

interface ILogDefaults {
  context: ILogContext
  tag?: string
}

interface ILogFormatInput {
  context?: ILogContext
  defaults: ILogDefaults
  label: string
  message: string
  timestamp: number
}

interface ILogFormatFunction {
  (input: ILogFormatInput): string
}

interface ILogFunction {
  (message: string, context?: ILogContext): void
}

const defaults: ILogDefaults = { context: {} }

const logStream = new PassThrough()

function bufferLog() {
  return logStream.readable && logStream.readableLength
}

function clearLog() {
  if (bufferLog()) {
    return logStream.read(logStream.readableLength)
  }
}

function formatLogContext(context: ILogContext) {
  try {
    return JSON.stringify(context)
  } catch (error) {
    return inspect(context, { compact: 1 })
  }
}

function formatLog({
  context,
  defaults: { context: defaultContext, tag },
  label,
  message,
  timestamp,
}: ILogFormatInput) {
  return [new Date(timestamp).toISOString(), tag, label, message.trim()]
    .filter((item) => !!item)
    .concat(
      context || Object.keys(defaultContext).length
        ? formatLogContext({ ...defaultContext, ...context })
        : []
    )
    .join('\t')
}

function log(
  level: LogLevel | string,
  format: ILogFormatFunction = formatLog
): ILogFunction {
  return (message: string, context?: ILogContext) => {
    if (typeof message !== 'string') {
      throw new TypeError('Expected `message` to be a string')
    }

    const label = typeof level === 'string' ? level.trim() : LogLevel[level]
    const entry =
      format({ context, defaults, label, message, timestamp: Date.now() }) +
      '\n'

    switch (level) {
      case LogLevel.ERROR:
        if (bufferLog()) {
          process.stdout.write(clearLog())
        }
      // eslint-disable-next-line no-fallthrough
      case LogLevel.WARN:
        process.stderr.write(entry)
        break
      case LogLevel.DEBUG:
        if (
          !process.env.DEBUG ||
          (process.env.DEBUG !== '1' &&
            process.env.DEBUG.toLowerCase() !== 'on' &&
            process.env.DEBUG.toLowerCase() !== 'true' &&
            process.env.DEBUG.toLowerCase() !== 'yes')
        ) {
          logStream.write(entry)
          break
        }
      // eslint-disable-next-line no-fallthrough
      default:
        process.stdout.write(entry)
    }
  }
}

log.clear = clearLog
log.debug = log(LogLevel.DEBUG)
log.info = log(LogLevel.INFO)
log.warn = log(LogLevel.WARN)
log.error = log(LogLevel.ERROR)

log.reset = () => {
  defaults.context = {}
  log.untag()
}

log.set = (name: string, value: string | number | boolean | null) => {
  defaults.context[name] = value
}

log.tag = (tag: string) => {
  if (typeof tag !== 'string') {
    throw new TypeError('Expected `tag` to be a string')
  }

  defaults.tag = tag.trim()
}

log.unset = (name: string) => {
  delete defaults.context[name]
}

log.untag = () => {
  delete defaults.tag
}

export = log
