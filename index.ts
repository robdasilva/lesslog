import { PassThrough } from "stream";
import { inspect } from "util";

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

export type LogContext = Record<string, unknown> | null;

export interface ILogEntry {
  context: LogContext;
  label: string;
  level: LogLevel;
  message: string;
  timestamp: number;
}

export type LogFormatFunction = (input: ILogEntry) => string;

function formatLogContext(context: NonNullable<LogContext>) {
  try {
    return JSON.stringify(context);
  } catch (_) {
    return `\r${inspect(context).replaceAll("\n", "\r")}`;
  }
}

function formatLog({ context, label, level, message, timestamp }: ILogEntry) {
  return [
    new Date(timestamp).toISOString(),
    label,
    LogLevel[level],
    message.trim(),
    context && formatLogContext(context),
  ]
    .filter((item) => !!item)
    .join("\t");
}

export class Log {
  private readonly logStream = new PassThrough();
  private readonly format: LogFormatFunction;

  private _context: LogContext = null;
  private _label: string = "";

  constructor(format: LogFormatFunction = formatLog) {
    if (typeof format !== "function") {
      throw new TypeError("Expected `format` to be a function");
    }

    this.format = format;
  }

  get context() {
    return this._context;
  }

  set context(context: LogContext) {
    if (typeof context !== "object") {
      throw new TypeError("Expected `context` to be an object");
    }

    this._context = context;
  }

  get label() {
    return this._label;
  }

  set label(label: string) {
    if (typeof label !== "string") {
      throw new TypeError("Expected `label` to be a string");
    }

    this._label = label.trim();
  }

  clear() {
    this.logStream.read();
  }

  flush() {
    if (this.logStream.readable && this.logStream.readableLength > 0) {
      process.stdout.write(this.logStream.read(this.logStream.readableLength));
    }
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext) {
    if (typeof message !== "string") {
      throw new TypeError("Expected `message` to be a string");
    }

    const entry =
      this.format({
        context:
          !!context || (this._context && Object.keys(this._context).length)
            ? { ...this.context, ...context }
            : null,
        label: this._label,
        level,
        message,
        timestamp: Date.now(),
      }) + "\n";

    switch (level) {
      case LogLevel.ERROR:
        this.flush();
      // eslint-disable-next-line no-fallthrough
      case LogLevel.WARN:
        process.stderr.write(entry);
        break;
      case LogLevel.DEBUG:
        if (
          !process.env.DEBUG ||
          (process.env.DEBUG !== "1" &&
            process.env.DEBUG.toLowerCase() !== "on" &&
            process.env.DEBUG.toLowerCase() !== "true" &&
            process.env.DEBUG.toLowerCase() !== "yes")
        ) {
          this.logStream.write(entry);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        process.stdout.write(entry);
    }
  }

  debug(message: string, context?: LogContext) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.writeLog(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.writeLog(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext) {
    this.writeLog(LogLevel.ERROR, message, context);
  }
}

export default new Log();
