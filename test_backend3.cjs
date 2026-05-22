const fs = require('fs');
let content = fs.readFileSync('C:/Saas/src/hooks/report-handlers/pecuaria.ts', 'utf8');

// Find the dynamic return block
const startIdx = content.indexOf('return {', content.indexOf('export const dashboardOverview'));
const endIdx = content.indexOf('};', startIdx);
const block = content.substring(startIdx, endIdx);

// Print the line containing "Estoque Bi"
const lines = block.split('\n');
const line = lines.find(l => l.includes('Estoque Bi'));
console.log('Dynamic block match:', line);

// Also check the mock block
const mockStart = content.indexOf('const mockData', content.indexOf('export const dashboardOverview'));
const mockEnd = content.indexOf('};', mockStart);
const mockBlock = content.substring(mockStart, mockEnd);
const mockLine = mockBlock.split('\n').find(l => l.includes('Estoque Bi'));
console.log('Mock block match:', mockLine);
