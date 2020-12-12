const { mkdirSync, writeFileSync, existsSync, rmdirSync, readFileSync } = require('fs');

const log = require('./log');
const { join } = require('path');
const { EOL } = require('os');

module.exports = ({ component, blueprint, components, blueprints, commands, flags }) => {

  if (!blueprints.includes(blueprint)) {
    component = blueprint;
    blueprint = undefined;
  }

  blueprint = require('./blueprints/' + blueprint);

  if (!component) {
    log.error('Required component name not provided.');
    process.exit(1);
  }

  const componentDir = `./src/${component}`;

  log.info(`Generating ${component} at ${componentDir}.`);

  if (existsSync(componentDir)) {
    if (argv.includes('-f') || argv.includes('--force')) {
      log.info(`Removing component path ${componentDir}`);
      rmdirSync(componentDir, { recursive: true })
    }
    else {
      log.warn(`Component ${component} exists, use -f or --force to overwrite.`);
      process.exit(1);
    }
  }

  mkdirSync(componentDir);

  const templates = blueprint.map((template) => template(component));

  templates.forEach((template) => {
    writeFileSync(
      `${componentDir}/${template.filename || component}${template.extension}`,
      template.content
    );
  });

  // Create the import.
  log.info(`Adding ${component} import/export statements.`);

  const indexPath = join(process.cwd(), 'src/index.ts');
  const index = readFileSync(indexPath).toString();

  let foundEmptyLine;
  const lines = index.split(EOL).reduce((a, c) => {
    let tmp = c.trim();
    // is empty line.
    if (!foundEmptyLine && /^\s*$/.test(tmp)) {
      foundEmptyLine = true;
      a = [...a, `import ${component} from './${component}';`, c];
    }
    else if (/^export/.test(tmp)) {
      tmp = tmp.replace(/[^\S\r\n]+/g, '').replace(/([{};]|export)/g, '').trim();
      const segments = tmp.split(',')
      segments.push(component);
      tmp = `export { ${segments.join(', ')} };`
      a = [...a, tmp];
    }
    else {
      a = [...a, c];
    }
    return a;
  }, []);


  writeFileSync(indexPath, lines.join(EOL));

  log.info('done!');


};

