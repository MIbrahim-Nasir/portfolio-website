import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// eslint-config-next 16 ships flat configs; the old FlatCompat wrapper crashed ESLint
// ("Converting circular structure to JSON"), which also broke the pre-commit hook.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Compiler rules. The compiler isn't enabled here, and the r3f scenes mutate
    // uniforms, refs and three objects inside useFrame by design.
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/use-memo': 'off',
    },
  },
  globalIgnores([
    // defaults of eslint-config-next
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // legacy components no route uses any more
    'src/app/page-new.tsx',
    'src/components/sections/**',
    'src/components/reel/**',
    'src/components/Navigation.tsx',
    'src/components/FloatingDock.tsx',
    'src/components/CircularNavigation.tsx',
    'src/components/theme-toggle.tsx',
    'src/components/theme-provider.tsx',
    'src/data/portfolio-data.ts',
  ]),
]);

export default eslintConfig;
