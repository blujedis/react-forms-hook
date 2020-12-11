
const { rmdirSync, readFileSync, writeFileSync } = require('fs');
const { EOL } = require('os');
const { join } = require('path');
const log = require('./log');

module.exports = ({ component, commands, flags }) => {

  const componentDir = join(process.cwd(), 'src', component);

  log.info(`Removing component path ${componentDir}`);
  rmdirSync(componentDir, { recursive: true });

  log.info(`Removing ${component} import/export statements.`);

  const indexPath = join(process.cwd(), 'src/index.ts');
  const index = readFileSync(indexPath).toString();

  const lines = index.split(EOL).reduce((a, c) => {
    let tmp = c.trim();

    // is empty line.
    if (!c.includes(component) && !/^export/.test(c.trim())) {
      a = [...a, c];
    }
    else if (/^export/.test(c.trim())) {
      let tmp = c.trim().replace(/[^\S\r\n]+/g, '').replace(/([{};]|export)/g, '');
      const comps = tmp.split(',').filter(v => v !== component);
      tmp = `export { ${comps.join(', ')} };`
      a = [...a, tmp];
    }

    return a;

  }, []);

  writeFileSync(indexPath, lines.join(EOL));

  log('done!');

};