const { mkdirSync, writeFileSync, existsSync, rmdirSync, readFileSync } = require('fs');
const fglob = require('fast-glob');
const log = require('./log');
const { join } = require('path');
const { EOL } = require('os');
const blueprints = fglob.sync('**', { onlyDirectories: true, cwd: __dirname + '/blueprints' });

const argv = process.argv.slice(2);
let blueprint = argv[0];
let componentName = argv[1];

if (!blueprints.includes(blueprint)) {
  componentName = blueprint;
  blueprint = undefined;
}

blueprint = blueprint || 'default';

componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

console.log(blueprint);

blueprint = require('./blueprints/' + blueprint);

if (!componentName) {
  log.error('Required component name not provided.');
  process.exit(1);
}

const componentDir = `./src/${componentName}`;

log.info(`Generating ${componentName} at ${componentDir}.`);

if (existsSync(componentDir)) {
  if (argv.includes('-f') || argv.includes('--force')) {
    log.info(`Removing component path ${componentDir}`);
    rmdirSync(componentDir, { recursive: true })
  }
  else {
    log.warn(`Component ${componentName} exists, use -f or --force to overwrite.`);
    process.exit(1);
  }
}

mkdirSync(componentDir);

const templates = blueprint.map((template) => template(componentName));

templates.forEach((template) => {
  writeFileSync(
    `${componentDir}/${template.filename || componentName}${template.extension}`,
    template.content
  );
});

// Create the import.
log.info(`Adding ${componentName} import/export statements.`);

const indexPath = join(process.cwd(), 'src/index.ts');
const index = readFileSync(indexPath).toString();

let foundEmptyLine;
const lines = index.split(EOL).reduce((a, c) => {
  let tmp = c.trim();
  // is empty line.
  if (!foundEmptyLine && /^\s*$/.test(tmp)) {
    foundEmptyLine = true;
    a = [...a, `import ${componentName} from './${componentName}';`, c];
  }
  else if (/^export/.test(tmp)) {
    tmp = tmp.replace(/[^\S\r\n]+/g, '').replace(/([{};]|export)/g, '');
    console.log(tmp);
    const comps = tmp.split(',');
    comps.push(componentName);
    tmp = `export { ${comps.join(', ')} };`
    a = [...a, tmp];
  }
  else {
    a = [...a, c];
  }
  return a;
}, []);


writeFileSync(indexPath, lines.join(EOL));

log.info('done!');
