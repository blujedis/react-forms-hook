const log = require('./log');
const { blueBright, yellowBright } = require('ansi-colors');
const { generate, remove, blueprints, components } = require('./init');

const argv = process.argv.slice(2);
const flags = argv.filter(v => v.startsWith('-'));
const commands = argv.filter(v => !flags.includes(v));
const component = commands[1];
const blueprint = (commands[2] || 'default').toLowerCase();

const hasArg = (...args) => argv.some(v => args.includes(v));

if (hasArg('-h', '--help')) {

  const help = `
  ${blueBright('React Component Library')}

  ${yellowBright('Consistently build React Components as Library')}

  ${blueBright('Commands')}:
    yarn do generate <name> [blueprint]   Gen component w/ opt blueprint.   ${yellowBright('alias')}: gen
    yarn do remove <name>                 Removes a component.              ${yellowBright('alias')}: rm

  ${yellowBright('Flags')}:
    -f, --force       When present component will be overwritten.
    -h, --help        Shows help menu.
  `;

  console.log(help);

  process.exit();

}

if (hasArg('generate', 'gen')) {

  if (!component) {
    log.error(`Cannot generate component using name of undefined.`);
    process.exit();
  }

  generate({ component, components, blueprints, blueprint, commands, flags });

}

if (hasArg('remove', 'rm')) {

  if (!component) {
    log.error(`Cannot remove component using name of undefined.`);
    process.exit();
  }

  remove({ component, components, commands, flags });

}