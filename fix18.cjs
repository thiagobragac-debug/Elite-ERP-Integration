const fs = require('fs');

const cssFile = 'c:/Saas/src/components/DataTable/ModernTable.css';
if (fs.existsSync(cssFile)) {
  let content = fs.readFileSync(cssFile, 'utf8').replace(/\r\n/g, '\n');

  // Enhance alignment classes to handle inner flex containers perfectly
  content = content.replace(
    `.align-left {
  text-align: left !important;
}`,
    `.align-left {
  text-align: left !important;
}
.align-left > div {
  justify-content: flex-start !important;
}`
  );

  content = content.replace(
    `.align-center {
  text-align: center !important;
}`,
    `.align-center {
  text-align: center !important;
}
.align-center > div {
  justify-content: center !important;
}`
  );

  content = content.replace(
    `.align-right {
  text-align: right !important;
}`,
    `.align-right {
  text-align: right !important;
}
.align-right > div {
  justify-content: flex-end !important;
}`
  );

  content = content.split('\n').join('\r\n');
  fs.writeFileSync(cssFile, content, 'utf8');
  console.log('Patched ModernTable.css alignment rules');
}
