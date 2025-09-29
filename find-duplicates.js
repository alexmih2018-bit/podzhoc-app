const fs = require('fs');

// Загружаем календарь
const calendar = require('./khl-full-calendar.js');

console.log(`📅 Всего матчей в календаре: ${calendar.length}`);

// Создаем уникальный ключ для каждого матча
const matches = calendar.map((match, index) => ({
    ...match,
    originalIndex: index,
    key: `${match.date}_${match.time}_${match.home}_${match.away}`
}));

// Находим дубликаты
const duplicates = [];
const seen = new Set();

matches.forEach(match => {
    if (seen.has(match.key)) {
        duplicates.push(match);
    } else {
        seen.add(match.key);
    }
});

console.log(`🔍 Найдено дубликатов: ${duplicates.length}`);

if (duplicates.length > 0) {
    console.log('\n📋 Дубликаты:');
    duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. Строка ${dup.originalIndex + 1}: ${dup.date} ${dup.time} - ${dup.home} vs ${dup.away}`);
    });
    
    // Создаем файл с дубликатами для удобного удаления
    const duplicatesInfo = duplicates.map(dup => ({
        line: dup.originalIndex + 1,
        match: `${dup.date} ${dup.time} - ${dup.home} vs ${dup.away}`
    }));
    
    fs.writeFileSync('duplicates.json', JSON.stringify(duplicatesInfo, null, 2));
    console.log('\n💾 Информация о дубликатах сохранена в duplicates.json');
}

// Проверяем уникальные матчи
const uniqueMatches = matches.filter(match => !seen.has(match.key) || matches.indexOf(match) === matches.findIndex(m => m.key === match.key));
console.log(`✅ Уникальных матчей: ${uniqueMatches.length}`);
