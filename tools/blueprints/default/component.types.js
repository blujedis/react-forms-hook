module.exports = (componentName) => ({
  content: `export interface I${componentName}Props {
  label: string;
}
`,
  extension: `.types.ts`
});
