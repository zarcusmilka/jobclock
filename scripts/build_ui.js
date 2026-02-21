const { execSync } = require('child_process');
const path = require('path');

const frontendPath = path.join(__dirname, '..', 'custom_components', 'jobclock', 'frontend');

console.log('Building JobClock UI using Vite & Tailwind v4...');

try {
    // Run vite build via NPM
    execSync('npm run build', {
        cwd: frontendPath,
        stdio: 'inherit'
    });

    console.log('\\n✓ Successfully built jobclock-card.js to the www folder.');

} catch (error) {
    console.error('Error during build:', error.message);
    process.exit(1);
}
