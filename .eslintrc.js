module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  extends: [
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended' // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Vscode default
    '@typescript-eslint/naming-convention': 'warn',
    '@typescript-eslint/semi': 'warn',
    curly: 'warn',
    eqeqeq: 'warn',
    'no-throw-literal': 'warn',
    semi: 'off',

    // My settings
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto' // Fixes mismatching windows/unix file end of lines
      }
    ]
  }
};
