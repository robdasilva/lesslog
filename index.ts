import { PassThrough } from 'stream'

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

interface ILogFormatFunction {
  (timestamp: number, label: string, message: string, context?: any): string
}

interface ILogFunction {
  (message: string, context?: any): void
}

const logStream = new PassThrough()

function bufferLog() {
  return logStream.readable && logStream.readableLength
}

function clearLog() {
  if (bufferLog()) {
    return logStream.read(logStream.readableLength)
  }
}

function formatLog(
  timestamp: number,
  label: string,
  message: string,
  context?: any
) {
  return [new Date(timestamp).toISOString(), label, message.trim()]
    .concat(context ? JSON.stringify(context) : [])
    .join('\t')
}

function log(
  level: LogLevel | string,
  format: ILogFormatFunction = formatLog
): ILogFunction {
  return (message: string, context?: any) => {
    const label = typeof level === 'string' ? level : LogLevel[level]
    const entry = `${format(Date.now(), label, message, context)}\n`

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

export = log
