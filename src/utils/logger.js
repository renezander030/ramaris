const {
    createLogger,
    format,
    transports
} = require('winston');
const {
    combine,
    printf
} = format;
const moment = require('moment');
const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();
const myFormat = printf(({
    level,
    message,
}) => {
    return `${tsFormat()} ${level}: ${message}`;
});
const logger = createLogger({
    level: 'debug',
    format: format.json(),
    // defaultMeta: {
    //   service: 'ramaris blockchain component'
    // },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({
            filename: 'error.log',
            level: 'error'
        }),
        new transports.File({
            filename: 'combined.log'
        }),
        new transports.Console({
            timestamp: tsFormat,
            colorize: true,
            json: false,
            format: combine(
                format.colorize(),
                myFormat
            ),
        })
    ],
});

export default logger;