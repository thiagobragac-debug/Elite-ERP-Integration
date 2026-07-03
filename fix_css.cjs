const fs = require('fs');
let file = 'c:/Saas/src/pages/LandingPage/LandingPage.css';
let content = fs.readFileSync(file, 'utf8');

let newContent = content.replace(/color:\s*rgb\(var\(--landing-text-main\)\)(\s*(?:\r?\n|border-radius|transform))/g, 'color: rgb(var(--landing-text-main));');

if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed css semicolons.');
}
