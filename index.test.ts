import log from '.'

describe('lesslog', () => {
  const datetime = '2038-01-19T03:14:08.000Z'
  const timestamp = 2147483648000

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(timestamp)
    jest.spyOn(process.stderr, 'write').mockImplementation()
    jest.spyOn(process.stdout, 'write').mockImplementation()
  })

  afterAll(() => {
    ;(Date.now as jest.Mock).mockRestore()
    ;(process.stderr.write as jest.Mock).mockRestore()
    ;(process.stdout.write as jest.Mock).mockRestore()
  })

  afterEach(() => {
    ;(Date.now as jest.Mock).mockClear()
    ;(process.stderr.write as jest.Mock).mockClear()
    ;(process.stdout.write as jest.Mock).mockClear()

    log.clear()
  })

  it('creates a custom logging function for a given log level', () => {
    const label = 'MONITORING'
    const monitor = log(label)
    const message = 'Random log message for monitoring'
    const context = { key: 'value' }

    expect(monitor(message, context)).toBeUndefined()

    expect(process.stderr.write).not.toHaveBeenCalled()

    expect(process.stdout.write).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith(
      `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`
    )
  })

  it('creates a custom logging function with custom formatting', () => {
    const label = 'MONITORING'
    const string = 'Random formatted log message for monitoring'
    const format = jest.fn(() => string)
    const monitor = log(label, format)
    const message = 'Random log message for monitoring'
    const context = { key: 'value' }

    expect(monitor(message, context)).toBeUndefined()

    expect(format).toHaveBeenCalledTimes(1)
    expect(format).toHaveBeenCalledWith(timestamp, label, message, context)

    expect(process.stderr.write).not.toHaveBeenCalled()

    expect(process.stdout.write).toHaveBeenCalledTimes(1)
    expect(process.stdout.write).toHaveBeenCalledWith(`${string}\n`)
  })

  describe('clear', () => {
    it('returns any debug logs clearing them from the buffer', () => {
      const label = 'DEBUG'
      const messages = ['Random log message', 'Another log message']

      log.debug(messages[0])
      log.debug(messages[1])
      expect(log.clear()).toStrictEqual(
        Buffer.from(
          `${datetime}\t${label}\t${messages[0]}\n` +
            `${datetime}\t${label}\t${messages[1]}\n`,
          'utf8'
        )
      )
    })

    it('returns `undefined` on empty buffer', () => {
      expect(log.clear()).toBeUndefined()
    })
  })

  describe('debug', () => {
    it('writes a debug log to the buffer formatting any given context', () => {
      const label = 'DEBUG'
      const message = 'Random debug log message'
      const context = { key: 'value' }

      log.debug(message, context)

      expect(process.stderr.write).not.toHaveBeenCalled()
      expect(process.stdout.write).not.toHaveBeenCalled()

      expect(log.clear()).toStrictEqual(
        Buffer.from(
          `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`,
          'utf8'
        )
      )
    })

    it.each(['1', 'on', 'true', 'yes'])(
      "writes a debug log directly if `DEBUG` is '%s'",
      debug => {
        const label = 'DEBUG'
        const message = 'Random debug log message'
        const context = { key: 'value' }

        process.env.DEBUG = debug

        log.debug(message, context)

        delete process.env.DEBUG

        expect(process.stderr.write).not.toHaveBeenCalled()

        expect(process.stdout.write).toHaveBeenCalledTimes(1)
        expect(process.stdout.write).toHaveBeenCalledWith(
          `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`
        )
      }
    )
  })

  describe('info', () => {
    it('writes an info log formatting any given context', () => {
      const label = 'INFO'
      const message = 'Random info log message'
      const context = { key: 'value' }

      log.info(message, context)

      expect(process.stderr.write).not.toHaveBeenCalled()

      expect(process.stdout.write).toHaveBeenCalledTimes(1)
      expect(process.stdout.write).toHaveBeenCalledWith(
        `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`
      )
    })
  })

  describe('warn', () => {
    it('writes a warning log formatting any given context', () => {
      const label = 'WARN'
      const message = 'Random warning log message'
      const context = { key: 'value' }

      log.warn(message, context)

      expect(process.stderr.write).toHaveBeenCalledTimes(1)
      expect(process.stderr.write).toHaveBeenCalledWith(
        `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`
      )

      expect(process.stdout.write).not.toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('writes an error log formatting any given context', () => {
      const label = 'ERROR'
      const message = 'Random error log message'
      const context = { key: 'value' }

      log.error(message, context)

      expect(process.stderr.write).toHaveBeenCalledTimes(1)
      expect(process.stderr.write).toHaveBeenCalledWith(
        `${datetime}\t${label}\t${message}\t${JSON.stringify(context)}\n`
      )

      expect(process.stdout.write).not.toHaveBeenCalled()
    })

    it('writes any buffered logs before the actual error log', () => {
      const labels = ['DEBUG', 'DEBUG', 'ERROR']
      const messages = [
        'Random debug log message',
        'Another debug log message',
        'Random error log message',
      ]

      log.debug(messages[0])
      log.debug(messages[1])
      log.error(messages[2])

      expect(process.stdout.write).toHaveBeenCalledTimes(1)
      expect(process.stdout.write).toHaveBeenCalledWith(
        Buffer.from(
          `${datetime}\t${labels[0]}\t${messages[0]}\n` +
            `${datetime}\t${labels[1]}\t${messages[1]}\n`,
          'utf8'
        )
      )

      expect(process.stderr.write).toHaveBeenCalledTimes(1)
      expect(process.stderr.write).toHaveBeenCalledWith(
        `${datetime}\t${labels[2]}\t${messages[2]}\n`
      )
    })
  })
})
