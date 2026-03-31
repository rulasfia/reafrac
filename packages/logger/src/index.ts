import pino, { type Logger, type LoggerOptions } from 'pino';

export type { Logger } from 'pino';

export interface CreateLoggerOptions {
	name: string;
	level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
	pretty?: boolean;
	context?: Record<string, unknown>;
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_ENV = 'LOG_LEVEL';
const LOG_FORMAT_ENV = 'LOG_FORMAT';
const NODE_ENV_ENV = 'NODE_ENV';

function getEnvOrDefault<T>(key: string, defaultValue: T, parser?: (v: string) => T): T {
	const value = process.env[key];
	if (!value) return defaultValue;
	if (parser) {
		try {
			return parser(value);
		} catch {
			return defaultValue;
		}
	}
	return value as T;
}

function isProduction(): boolean {
	const nodeEnv = process.env[NODE_ENV_ENV]?.toLowerCase();
	return nodeEnv === 'production';
}

function resolveLogLevel(explicit?: LogLevel): LogLevel {
	if (explicit) return explicit;
	return getEnvOrDefault<LogLevel>(LOG_LEVEL_ENV, isProduction() ? 'info' : 'debug');
}

function resolvePrettyPrint(explicit?: boolean): boolean {
	if (explicit !== undefined) return explicit;
	const format = process.env[LOG_FORMAT_ENV]?.toLowerCase();
	if (format === 'json') return false;
	if (format === 'pretty') return true;
	return !isProduction();
}

function createPinoOptions(options: CreateLoggerOptions): LoggerOptions {
	const level = resolveLogLevel(options.level);
	const pretty = resolvePrettyPrint(options.pretty);

	const pinoOptions: LoggerOptions = {
		level,
		name: options.name,
		timestamp: pino.stdTimeFunctions.isoTime,
		formatters: {
			level: (label) => ({ level: label })
		}
	};

	if (pretty) {
		try {
			pinoOptions.transport = {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'SYS:standard',
					ignore: 'pid,hostname',
					singleLine: false
				}
			};
		} catch {
			// pino-pretty not available (compiled binary), use JSON output
		}
	}

	return pinoOptions;
}

export function createLogger(options: CreateLoggerOptions): Logger {
	const pinoOptions = createPinoOptions(options);
	const baseLogger = pino(pinoOptions);

	if (options.context) {
		return baseLogger.child(options.context);
	}

	return baseLogger;
}

export const logLevels = {
	trace: 10,
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	fatal: 60
} as const;

export { pino };
