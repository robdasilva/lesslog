import { inspect } from "util";
import lesslog, { Log, LogFormatFunction, LogLevel } from "./index.ts";

describe("lesslog", () => {
  const datetime = "2038-01-19T03:14:08.000Z";
  const timestamp = 2147483648000;

  beforeAll(() => {
    jest.spyOn(process.stderr, "write").mockImplementation();
    jest.spyOn(process.stdout, "write").mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(timestamp);
  });

  describe("constructor", () => {
    it("creates a new instance of `Log` with the default format function", () => {
      const log = new Log();

      expect(log).toBeInstanceOf(Log);
    });

    it("creates a new instance of `Log` with a custom format function", () => {
      const defaultContext = { defaultKey: "defaultValue" };
      const label = "Random log label";

      const message = "Random debug log message";
      const context = { key: "value" };

      const entry = "Formatted log entry";
      const format = jest.fn().mockReturnValueOnce(entry);

      const log = new Log(format);
      log.context = defaultContext;
      log.label = label;

      expect(log.info(message, context)).toBeUndefined();

      expect(format).toHaveBeenCalledTimes(1);
      expect(format).toHaveBeenCalledWith({
        context: { defaultKey: "defaultValue", key: "value" },
        label,
        level: LogLevel.INFO,
        message,
        timestamp,
      });

      expect(process.stderr.write).not.toHaveBeenCalled();

      expect(process.stdout.write).toHaveBeenCalledTimes(1);
      expect(process.stdout.write).toHaveBeenCalledWith(`${entry}\n`);
    });

    it("throws type error if `format` is not a function", () => {
      expect(() => new Log("format" as unknown as LogFormatFunction)).toThrow(
        "Expected `format` to be a function",
      );
    });
  });

  describe.each(["default", "custom"])(`using %s logger`, (useLogger) => {
    const log = useLogger === "custom" ? new Log() : lesslog;

    describe("clear", () => {
      it("removes any buffered debug logs", () => {
        const messages = ["Random log message", "Another log message"];

        expect(log.debug(messages[0])).toBeUndefined();
        expect(log.debug(messages[1])).toBeUndefined();

        expect(log.clear()).toBeUndefined();

        expect(log.flush()).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();
        expect(process.stdout.write).not.toHaveBeenCalled();
      });

      it("returns `undefined` on empty buffer", () => {
        expect(log.clear()).toBeUndefined();

        expect(log.flush()).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();
        expect(process.stdout.write).not.toHaveBeenCalled();
      });
    });

    describe("flush", () => {
      it("writes any buffered debug logs to stdout", () => {
        const level = LogLevel[LogLevel.DEBUG];
        const messages = ["Random log message", "Another log message"];

        expect(log.debug(messages[0])).toBeUndefined();
        expect(log.debug(messages[1])).toBeUndefined();

        expect(log.flush()).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          Buffer.from(
            `${datetime}\t${level}\t${messages[0]}\n` +
              `${datetime}\t${level}\t${messages[1]}\n`,
            "utf8",
          ),
        );
      });

      it("does not write to stdout if there are no buffered debug logs", () => {
        expect(log.flush()).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();
        expect(process.stdout.write).not.toHaveBeenCalled();
      });
    });

    describe("debug", () => {
      it("writes a debug log to the buffer formatting any given context", () => {
        const level = LogLevel[LogLevel.DEBUG];
        const message = "Random debug log message";
        const context = { key: "value" };

        expect(log.debug(message, context)).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();
        expect(process.stdout.write).not.toHaveBeenCalled();

        expect(log.flush()).toBeUndefined();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          Buffer.from(
            `${datetime}\t${level}\t${message}\t${JSON.stringify(context)}\n`,
            "utf8",
          ),
        );
      });

      it.each(["1", "on", "true", "yes"])(
        "writes a debug log to stdout if `DEBUG` is '%s'",
        (debug) => {
          const level = LogLevel[LogLevel.DEBUG];
          const message = "Random debug log message";
          const context = { key: "value" };

          process.env.DEBUG = debug;

          expect(log.debug(message, context)).toBeUndefined();

          delete process.env.DEBUG;

          expect(process.stderr.write).not.toHaveBeenCalled();

          expect(process.stdout.write).toHaveBeenCalledTimes(1);
          expect(process.stdout.write).toHaveBeenCalledWith(
            `${datetime}\t${level}\t${message}\t${JSON.stringify(context)}\n`,
          );
        },
      );

      it("falls back to using `util.inspect` if log context cannot be stringified", () => {
        const level = LogLevel[LogLevel.DEBUG];
        const message = "Random debug log message";
        const context: Record<string, unknown> = { key: "value" };

        Object.assign(context, { self: context });

        context.additionalInformation = 42;
        expect(log.debug(message, context)).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();
        expect(process.stdout.write).not.toHaveBeenCalled();

        expect(log.flush()).toBeUndefined();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          Buffer.from(
            `${datetime}\t${level}\t${message}\t${inspect(
              {
                additionalInformation: 42,
                ...context,
              },
              { compact: 1, sorted: true },
            )}\n`,
            "utf8",
          ),
        );
      });

      it("throws type error if `message` is not a string", () => {
        expect(() => log.debug(null as unknown as string)).toThrow(
          "Expected `message` to be a string",
        );
      });
    });

    describe("info", () => {
      it("writes an info log to stdout formatting any given context", () => {
        const level = LogLevel[LogLevel.INFO];
        const message = "Random info log message";
        const context = { key: "value" };

        expect(log.info(message, context)).toBeUndefined();

        expect(process.stderr.write).not.toHaveBeenCalled();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          `${datetime}\t${level}\t${message}\t${JSON.stringify(context)}\n`,
        );
      });

      it("throws type error if `message` is not a string", () => {
        expect(() => log.info(null as unknown as string)).toThrow(
          "Expected `message` to be a string",
        );
      });
    });

    describe("warn", () => {
      it("writes a warning log to stderr formatting any given context", () => {
        const level = LogLevel[LogLevel.WARN];
        const message = "Random warning log message";
        const context = { key: "value" };

        expect(log.warn(message, context)).toBeUndefined();

        expect(process.stderr.write).toHaveBeenCalledTimes(1);
        expect(process.stderr.write).toHaveBeenCalledWith(
          `${datetime}\t${level}\t${message}\t${JSON.stringify(context)}\n`,
        );

        expect(process.stdout.write).not.toHaveBeenCalled();
      });

      it("throws type error if `message` is not a string", () => {
        expect(() => log.warn(null as unknown as string)).toThrow(
          "Expected `message` to be a string",
        );
      });
    });

    describe("error", () => {
      it("writes an error log to stderr formatting any given context", () => {
        const level = LogLevel[LogLevel.ERROR];
        const message = "Random error log message";
        const context = { key: "value" };

        expect(log.error(message, context)).toBeUndefined();

        expect(process.stderr.write).toHaveBeenCalledTimes(1);
        expect(process.stderr.write).toHaveBeenCalledWith(
          `${datetime}\t${level}\t${message}\t${JSON.stringify(context)}\n`,
        );

        expect(process.stdout.write).not.toHaveBeenCalled();
      });

      it("writes any buffered logs to stdout before the actual error log", () => {
        const levels = [
          LogLevel[LogLevel.DEBUG],
          LogLevel[LogLevel.DEBUG],
          LogLevel[LogLevel.ERROR],
        ];

        const messages = [
          "Random debug log message",
          "Another debug log message",
          "Random error log message",
        ];

        expect(log.debug(messages[0])).toBeUndefined();
        expect(log.debug(messages[1])).toBeUndefined();
        expect(log.error(messages[2])).toBeUndefined();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          Buffer.from(
            `${datetime}\t${levels[0]}\t${messages[0]}\n` +
              `${datetime}\t${levels[1]}\t${messages[1]}\n`,
            "utf8",
          ),
        );

        expect(process.stderr.write).toHaveBeenCalledTimes(1);
        expect(process.stderr.write).toHaveBeenCalledWith(
          `${datetime}\t${levels[2]}\t${messages[2]}\n`,
        );
      });

      it("throws type error if `message` is not a string", () => {
        expect(() => log.error(null as unknown as string)).toThrow(
          "Expected `message` to be a string",
        );
      });
    });

    describe("context", () => {
      it("sets the default log context", () => {
        const defaultContext = { defaultKey: "defaultValue" };

        log.context = defaultContext;

        const level = LogLevel[LogLevel.INFO];
        const message = "Random log message";

        expect(log.info(message)).toBeUndefined();
        expect(log.context).toEqual(defaultContext);

        expect(process.stderr.write).not.toHaveBeenCalled();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          `${datetime}\t${level}\t${message}\t${JSON.stringify(defaultContext)}\n`,
        );
      });

      it("gets merged with message-level context which takes precedence", () => {
        const defaultContext = {
          defaultKey: "defaultValue",
          overriddenKey: "overriddenValue",
        };

        log.context = defaultContext;

        const level = LogLevel[LogLevel.INFO];
        const message = "Random log message";
        const context = { key: "value", overriddenKey: "newValue" };

        expect(log.info(message, context)).toBeUndefined();
        expect(log.context).toEqual(defaultContext);

        expect(process.stderr.write).not.toHaveBeenCalled();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          `${datetime}\t${level}\t${message}\t${JSON.stringify({ ...defaultContext, ...context })}\n`,
        );

        log.context = null;
      });

      it("throws type error if `context` is not an object", () => {
        expect(() => {
          log.context = "null" as unknown as null;
        }).toThrow("Expected `context` to be an object");
      });
    });

    describe("label", () => {
      it("sets the log label", () => {
        const label = "Random log label";

        log.label = label;

        const level = LogLevel[LogLevel.INFO];
        const message = "Random log message";

        expect(log.info(message)).toBeUndefined();
        expect(log.label).toEqual(label);

        expect(process.stderr.write).not.toHaveBeenCalled();

        expect(process.stdout.write).toHaveBeenCalledTimes(1);
        expect(process.stdout.write).toHaveBeenCalledWith(
          `${datetime}\t${label}\t${level}\t${message}\n`,
        );
      });

      it("throws type error if `label` is not a string", () => {
        expect(() => {
          log.label = null as unknown as string;
        }).toThrow("Expected `label` to be a string");
      });
    });
  });
});
