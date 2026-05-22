const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');
const dashboardOverview = content.split('export const dashboardOverview')[1].split('export const')[0];
console.log(dashboardOverview.substring(dashboardOverview.indexOf('return {'), dashboardOverview.indexOf('return {') + 1500));