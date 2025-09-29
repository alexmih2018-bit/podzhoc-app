const data = require('./khl-full-calendar.js');
console.log('Матчей в файле:', data.length);

// Проверим дубликаты
const seen = new Set();
const duplicates = [];

data.forEach((match, index) => {
    const key = `${match.date}-${match.time}-${match.home}-${match.away}`;
    if (seen.has(key)) {
        duplicates.push({ index, match });
    } else {
        seen.add(key);
    }
});

console.log('Дубликатов найдено:', duplicates.length);
if (duplicates.length > 0) {
    console.log('Дубликаты:');
    duplicates.forEach(dup => {
        console.log(`- ${dup.match.date} ${dup.match.time} - ${dup.match.home} vs ${dup.match.away} (индекс ${dup.index})`);
    });
}
