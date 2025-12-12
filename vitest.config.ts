/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'features'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/components/ui/**', // shadcn/ui vendor components
        'src/hooks/use-toast.ts', // shadcn boilerplate
        'src/lib/telemetry.ts', // Application Insights init (tested via integration)
        'src/types/**', // Type definitions only
        'src/App.tsx', // entry point
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/index.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
