import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'src/app/page-new.tsx',
      'src/components/sections/**',
      'src/components/reel/**',
      'src/components/Navigation.tsx',
      'src/components/FloatingDock.tsx',
      'src/components/CircularNavigation.tsx',
      'src/components/theme-toggle.tsx',
      'src/components/theme-provider.tsx',
      'src/data/portfolio-data.ts',
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
