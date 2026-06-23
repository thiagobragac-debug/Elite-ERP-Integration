/**
 * Accessibility and SEO Checker Script
 * Checks for common issues in the codebase
 * Part of Task 26.2 - Fix Lighthouse recommendations
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const issues = {
  missingAlt: [],
  buttonWithoutLabel: [],
  inputWithoutLabel: [],
  lowContrastWarnings: [],
  missingLang: [],
  missingAriaLabels: [],
};

function checkFileForIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for img without alt
    if (/<img[^>]*>/i.test(line) && !/ alt=/i.test(line)) {
      issues.missingAlt.push({ file: filePath, line: lineNum, code: line.trim() });
    }
    
    // Check for button with only icon (potential missing aria-label)
    if (/<button[^>]*>[\s]*<[A-Z]/.test(line) && !/aria-label=/i.test(line) && !/>[\s]*\w/.test(line)) {
      issues.buttonWithoutLabel.push({ file: filePath, line: lineNum, code: line.trim() });
    }
    
    // Check for input without label or aria-label
    if (/<input[^>]*>/i.test(line) && !/aria-label=/i.test(line) && !/<label/i.test(line)) {
      issues.inputWithoutLabel.push({ file: filePath, line: lineNum, code: line.trim() });
    }
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
      checkFileForIssues(fullPath);
    }
  }
}

function main() {
  console.log('🔍 Scanning for accessibility issues...\n');
  
  scanDirectory(srcDir);
  
  let hasIssues = false;
  
  if (issues.missingAlt.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Found ${issues.missingAlt.length} image(s) without alt attribute:`);
    issues.missingAlt.slice(0, 5).forEach(issue => {
      console.log(`   ${path.relative(srcDir, issue.file)}:${issue.line}`);
    });
    if (issues.missingAlt.length > 5) {
      console.log(`   ... and ${issues.missingAlt.length - 5} more`);
    }
    console.log();
  }
  
  if (issues.buttonWithoutLabel.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Found ${issues.buttonWithoutLabel.length} button(s) that may need aria-label:`);
    issues.buttonWithoutLabel.slice(0, 5).forEach(issue => {
      console.log(`   ${path.relative(srcDir, issue.file)}:${issue.line}`);
    });
    if (issues.buttonWithoutLabel.length > 5) {
      console.log(`   ... and ${issues.buttonWithoutLabel.length - 5} more`);
    }
    console.log();
  }
  
  if (issues.inputWithoutLabel.length > 0) {
    hasIssues = true;
    console.log(`⚠️  Found ${issues.inputWithoutLabel.length} input(s) that may need labels:`);
    issues.inputWithoutLabel.slice(0, 5).forEach(issue => {
      console.log(`   ${path.relative(srcDir, issue.file)}:${issue.line}`);
    });
    if (issues.inputWithoutLabel.length > 5) {
      console.log(`   ... and ${issues.inputWithoutLabel.length - 5} more`);
    }
    console.log();
  }
  
  if (!hasIssues) {
    console.log('✅ No major accessibility issues found!');
  } else {
    console.log('💡 Tip: These are potential issues. Review them manually.');
  }
  
  console.log('\n📝 Recommendations:');
  console.log('   • Add alt="" for decorative images');
  console.log('   • Add aria-label for icon-only buttons');
  console.log('   • Ensure all form inputs have associated labels');
  console.log('   • Test with screen readers for complete validation');
}

main();
