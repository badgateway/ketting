import {defineConfig} from 'vitest/config'
import {playwright} from '@vitest/browser-playwright'

export default defineConfig({
    test: {
        globalSetup: ['test/vitest.global-setup.ts'],
        projects: [
            {
                test: {
                    name: 'node',
                    environment: 'node'
                }
            },
            {
                test: {
                    browser: {
                        provider: playwright(),
                        enabled: true,
                        // at least one instance is required
                        instances: [
                            {browser: 'chromium'},
                        ],
                    }
                }
            }
        ]
    },
});