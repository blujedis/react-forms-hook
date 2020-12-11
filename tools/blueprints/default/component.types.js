module.exports = (componentName) => ({
  content: `export interface I${componentName}Props {
  foo: string;
}
`,
  extension: `.types.ts`
});
