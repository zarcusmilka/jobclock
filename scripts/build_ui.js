const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const wwwPath = path.join(__dirname, '..', 'custom_components', 'jobclock', 'www');
const inputCss = path.join(wwwPath, 'input.css');
const outputCss = path.join(wwwPath, 'output.css');
const cardJs = path.join(wwwPath, 'jobclock-card.js');

console.log('Building Tailwind CSS...');

try {
    // Use npx to download and run the latest tailwindcss tool directly (without needing a global installation or bulky binaries)
    execSync(`npx -y tailwindcss@lastest -i "${inputCss}" -o "${outputCss}" --minify`, {
        cwd: wwwPath,
        stdio: 'inherit'
    });

    console.log('\\nInjecting CSS into jobclock-card.js...');

    // Read the generated CSS
    let cssContent = fs.readFileSync(outputCss, 'utf8');

    // CRITICAL: Escape backslashes (\ -> \\) and backticks (` -> \`)
    // so the LitElement template literal parses them correctly.
    cssContent = cssContent.replace(/\\/g, '\\\\').replace(/\`/g, '\\`');

    // Read the js file
    let jsContent = fs.readFileSync(cardJs, 'utf8');

    // Replace the exact static get styles() block
    const pattern = /static get styles\(\) \{\n    return css`\n[\s\S]*?\n    `;\n  }/g;

    if (!pattern.test(jsContent)) {
        console.error('Could not find "static get styles()" block in jobclock-card.js to inject CSS.');
        process.exit(1);
    }

    jsContent = jsContent.replace(pattern, `static get styles() {\n    return css\`\n${cssContent}\n    \`;\n  }`);

    fs.writeFileSync(cardJs, jsContent, 'utf8');
    console.log('✓ Successfully injected compiled Tailwind CSS into jobclock-card.js');

    // Cleanup the generated temp file
    fs.unlinkSync(outputCss);
    console.log('✓ Cleaned up output.css');

} catch (error) {
    console.error('Error during build:', error.message);
    process.exit(1);
}
