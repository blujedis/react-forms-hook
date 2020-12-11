const fglob = require('fast-glob');
const generate = require('./generate');
const remove = require('./remove');

const blueprints = fglob.sync('**', { onlyDirectories: true, cwd: __dirname + '/blueprints' }).map(v => v.toLowerCase())
const components = fglob.sync('**', { onlyDirectories: true, cwd: process.cwd() + '/src' });

module.exports = {
  generate,
  remove,
  blueprints,
  components
};