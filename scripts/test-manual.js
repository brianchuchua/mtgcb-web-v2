// Cross-platform launcher for the manual test suite.
// Sets RUN_MANUAL_TESTS so playwright.config.ts disables the testIgnore that
// hides tests/manual/ from the default suite.
process.env.RUN_MANUAL_TESTS = '1';
const { spawn } = require('child_process');
const args = ['playwright', 'test', 'tests/manual/', ...process.argv.slice(2)];
spawn('npx', args, { stdio: 'inherit', shell: true }).on('exit', (code) => process.exit(code ?? 0));
