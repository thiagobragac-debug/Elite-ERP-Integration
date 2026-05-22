const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');
const dashboardOverview = content.split('export const dashboardOverview')[1].split('export const')[0];
const returnObj = dashboardOverview.substring(dashboardOverview.indexOf('return {'), dashboardOverview.indexOf('return {') + 1500);
console.log(returnObj);