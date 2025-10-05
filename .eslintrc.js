module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    '@react-native-community',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks', 
    'react-native',
  ],
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  globals: {
    __DEV__: 'readonly',
    React: 'readonly',
    JSX: 'readonly',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // === TYPESCRIPT RULES ===
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // === REACT RULES ===
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // === REACT NATIVE RULES ===
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error', 
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',
    'react-native/no-single-element-style-arrays': 'warn',
    
    // === GENERAL RULES ===
    'no-unused-vars': 'off',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-console': 'off',
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn',
    
    // === EXPO SPECIFIC ===
    'no-restricted-imports': ['error', {
      patterns: ['expo/build/*'],
      paths: [{
        name: 'expo',
        importNames: ['DangerZone'],
        message: 'DangerZone is deprecated'
      }]
    }],
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    'ios/',
    'android/',
    '*.config.js',
    'metro.config.js',
  ],
};