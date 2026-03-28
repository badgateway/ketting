import {defineConfig} from 'tsdown'

export default defineConfig(
    {
        entry: 'src/index.ts',
        outDir: 'dist/browser',
        dts: {
            sourcemap: true
        },
        platform: 'browser',
        failOnWarn: true,
        sourcemap: true,
        minify: true,
        inputOptions: {
            resolve: {
                alias: {
                    'node:events': 'events'
                }
            }
        },
    }
);