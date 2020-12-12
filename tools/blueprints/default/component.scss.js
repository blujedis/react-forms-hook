module.exports = (componentName) => ({
  content: `@import '../variables.scss';
@import '../typography.scss';

.${componentName} {
  @include font-defaults;
  color: $blue;
}
`,
  extension: `.scss`
});
