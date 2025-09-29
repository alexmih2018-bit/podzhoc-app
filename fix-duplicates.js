const fs = require('fs');

// Читаем файл с матчами
const fileContent = fs.readFileSync('./khl-full-calendar.js', 'utf8');

// Извлекаем массив матчей из файла
const matchArrayStart = fileContent.indexOf('[');
const matchArrayEnd = fileContent.lastIndexOf(']') + 1;
const matchesJson = fileContent.substring(matchArrayStart, matchArrayEnd);
const matches = JSON.parse(matchesJson);

console.log('🔍 Ищем дубликаты матчей...');

// Создаем Map для отслеживания уникальных матчей
const uniqueMatches = new Map();
const duplicates = [];

// Обрабатываем каждый матч
matches.forEach((match, index) => {
    // Создаем уникальный ключ: дата + время + команды
    const key = `${match.date}_${match.time}_${match.home}_${match.away}`;
    
    if (uniqueMatches.has(key)) {
        // Найден дубликат
        duplicates.push({
            index: index,
            match: match,
            originalIndex: uniqueMatches.get(key)
        });
        console.log(`❌ Дубликат найден на позиции ${index}:`, match);
    } else {
        uniqueMatches.set(key, index);
    }
});

console.log(`\n📊 Статистика:`);
console.log(`Всего матчей: ${matches.length}`);
console.log(`Уникальных матчей: ${uniqueMatches.size}`);
console.log(`Дубликатов: ${duplicates.length}`);

if (duplicates.length > 0) {
    console.log('\n🧹 Удаляем дубликаты...');
    
    // Создаем новый массив без дубликатов
    const cleanMatches = matches.filter((match, index) => {
        return !duplicates.some(dup => dup.index === index);
    });
    
    console.log(`✅ Очищено матчей: ${cleanMatches.length}`);
    
    // Создаем новый файл
    const newFileContent = `// Полный календарь КХЛ 2025-2026 (${cleanMatches.length} матчей)
const KHL_FULL_CALENDAR_2025_2026 = ${JSON.stringify(cleanMatches, null, 4)};

module.exports = { KHL_FULL_CALENDAR_2025_2026 };`;
    
    fs.writeFileSync('khl-full-calendar-clean.js', newFileContent);
    console.log('✅ Создан файл khl-full-calendar-clean.js без дубликатов');
} else {
    console.log('✅ Дубликатов не найдено!');
}
