module.exports = {
    ignorePatterns: ['**/ton-contracts/*', '**/__tests__/nodejs/*'],
    env: {
        browser: true,
        node: true,
        jest: true,
        commonjs: true,
        es2020: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 11,
    },
    rules: {
        indent: ['error', 4],
        semi: ['error', 'never'],
        'no-constant-condition': 'off',
        'linebreak-style': ['error', 'unix'],
        'max-len': ['error', { code: 120 }],
    },
}
