const sparkline = [250,300,340,370,395,412,425].map((v,i) => ({ value: v, label: `${v}%` }));
console.log(JSON.stringify(sparkline));