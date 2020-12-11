const { format } = require('util');
const { redBright, blueBright, yellowBright } = require('ansi-colors');

function log(type, message, ...args) {

  if (!['error', 'warn', 'info'].includes(type)) {
    if (typeof message !== 'undefined')
      args.unshift(message)
    message = type;
    type = undefined;
  }

  const logger = console[type] || console.log;
  message = format(message, ...args);

  if (type === 'error')
    type = redBright(type);
  else if (type === 'warn')
    type = yellowBright(type);
  else if (type === 'info')
    type = blueBright(type);

  if (type)
    message = type + ': ' + message;

  logger(message);

}

log.error = (message, ...args) => log('error', message, ...args);
log.warn = (message, ...args) => log('warn', message, ...args);
log.info = (message, ...args) => log('info', message, ...args);

module.exports = log;