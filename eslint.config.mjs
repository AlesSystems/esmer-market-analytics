import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['dist/**', 'release/**', 'node_modules/**', 'work/**', 'test-results/**'] }, ...tseslint.configs.recommended);
