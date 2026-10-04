const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /password|passwd|token|secret|authorization|api[-_]?key|cookie/i;
const RESERVED = ['time', 'level', 'msg'];
const MAX_DEPTH = 5;
const MAX_STRING = 500;

const serializeError = (err) => {
  const out = { name: err.name, message: String(err.message).slice(0, MAX_STRING) };
  const code = err.statusCode || err.status || err.code;
  if (code !== undefined) out.code = code;
  if (err.stack) out.stack = err.stack;
  return out;
};

// Log me jaane se pehle: secrets hatao, lambe strings kaato, Error aur ObjectId ko saaf karo
const sanitize = (value, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) return serializeError(value);
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'function') return undefined;
  if (typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (typeof value.toJSON === 'function') return sanitize(value.toJSON(), depth + 1);
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : sanitize(v, depth + 1);
  }
  return out;
};

const formatPretty = (entry) => {
  const { time, level, msg, ...rest } = entry;

  let stack;
  if (rest.err && rest.err.stack) {
    stack = rest.err.stack;
    rest.err = { ...rest.err, stack: undefined };
  }

  const fields = Object.entries(rest)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(' ');

  const head = `${time.slice(11, 19)} ${level.toUpperCase().padEnd(5)} ${msg}`;
  return [fields ? `${head} ${fields}` : head, stack].filter(Boolean).join('\n');
};

const defaults = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    level: (process.env.LOG_LEVEL || (isProd ? 'info' : 'debug')).toLowerCase(),
    pretty: process.env.LOG_FORMAT ? process.env.LOG_FORMAT === 'pretty' : !isProd,
    stream: null,
    bindings: {},
  };
};

const createLogger = (options = {}) => {
  const config = { ...defaults(), ...options };
  const threshold = LEVELS[config.level] ?? LEVELS.info;

  const write = (level, msg, fields) => {
    if (LEVELS[level] < threshold) return;

    const extra = { ...sanitize(config.bindings), ...sanitize(fields) };
    for (const key of RESERVED) delete extra[key];

    const entry = { time: new Date().toISOString(), level, msg, ...extra };
    const line = config.pretty ? formatPretty(entry) : JSON.stringify(entry);
    const stream = config.stream || (level === 'error' ? process.stderr : process.stdout);
    stream.write(`${line}\n`);
  };

  return {
    debug: (msg, fields) => write('debug', msg, fields),
    info: (msg, fields) => write('info', msg, fields),
    warn: (msg, fields) => write('warn', msg, fields),
    error: (msg, fields) => write('error', msg, fields),
    child: (bindings) =>
      createLogger({ ...config, bindings: { ...config.bindings, ...bindings } }),
  };
};

const logger = createLogger();
logger.createLogger = createLogger;

module.exports = logger;