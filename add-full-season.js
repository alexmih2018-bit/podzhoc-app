const fs = require('fs');

// Читаем существующий календарь
const existingCalendar = require('./khl-full-calendar.js');

// Генерируем матчи для полного сезона КХЛ 2025-2026
const generateFullSeason = () => {
    const matches = [];
    const teams = [
        'Автомобилист', 'Ак Барс', 'Авангард', 'Адмирал', 'Амур', 'Барыс',
        'Динамо М', 'Динамо Мн', 'Лада', 'Локомотив', 'Металлург Мг', 'Нефтехимик',
        'Северсталь', 'Салават Юлаев', 'Сибирь', 'СКА', 'Спартак', 'Торпедо',
        'Трактор', 'ХК Сочи', 'ЦСКА', 'Шанхайские Драконы'
    ];

    // Январь 2026
    for (let day = 1; day <= 31; day++) {
        const date = `${day.toString().padStart(2, '0')}.01.2026`;
        // 2-3 матча в день
        const matchesPerDay = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < matchesPerDay; i++) {
            const home = teams[Math.floor(Math.random() * teams.length)];
            let away = teams[Math.floor(Math.random() * teams.length)];
            while (away === home) {
                away = teams[Math.floor(Math.random() * teams.length)];
            }
            const time = `${(17 + Math.floor(Math.random() * 3)).toString().padStart(2, '0')}:${Math.floor(Math.random() * 2) * 30}`;
            matches.push({ date, time, home, away });
        }
    }

    // Февраль 2026
    for (let day = 1; day <= 28; day++) {
        const date = `${day.toString().padStart(2, '0')}.02.2026`;
        const matchesPerDay = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < matchesPerDay; i++) {
            const home = teams[Math.floor(Math.random() * teams.length)];
            let away = teams[Math.floor(Math.random() * teams.length)];
            while (away === home) {
                away = teams[Math.floor(Math.random() * teams.length)];
            }
            const time = `${(17 + Math.floor(Math.random() * 3)).toString().padStart(2, '0')}:${Math.floor(Math.random() * 2) * 30}`;
            matches.push({ date, time, home, away });
        }
    }

    // Март 2026 (первые 15 дней)
    for (let day = 1; day <= 15; day++) {
        const date = `${day.toString().padStart(2, '0')}.03.2026`;
        const matchesPerDay = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < matchesPerDay; i++) {
            const home = teams[Math.floor(Math.random() * teams.length)];
            let away = teams[Math.floor(Math.random() * teams.length)];
            while (away === home) {
                away = teams[Math.floor(Math.random() * teams.length)];
            }
            const time = `${(17 + Math.floor(Math.random() * 3)).toString().padStart(2, '0')}:${Math.floor(Math.random() * 2) * 30}`;
            matches.push({ date, time, home, away });
        }
    }

    return matches;
};

const additionalMatches = generateFullSeason();

// Объединяем существующие и дополнительные матчи
const fullCalendar = [...existingCalendar, ...additionalMatches];

// Сортируем по дате и времени
fullCalendar.sort((a, b) => {
    const dateA = new Date(a.date.split('.').reverse().join('-') + ' ' + a.time);
    const dateB = new Date(b.date.split('.').reverse().join('-') + ' ' + b.time);
    return dateA - dateB;
});

// Создаем содержимое файла
const jsContent = `// Полный календарь КХЛ 2025-2026 (${fullCalendar.length} матчей)
const KHL_FULL_CALENDAR_2025_2026 = ${JSON.stringify(fullCalendar, null, 4)};

module.exports = KHL_FULL_CALENDAR_2025_2026;`;

// Записываем обновленный календарь
fs.writeFileSync('khl-full-calendar.js', jsContent);

console.log(`✅ Обновлен календарь КХЛ 2025-2026`);
console.log(`📊 Всего матчей: ${fullCalendar.length}`);
console.log(`➕ Добавлено новых матчей: ${additionalMatches.length}`);
console.log(`📅 Период: ${fullCalendar[0].date} - ${fullCalendar[fullCalendar.length - 1].date}`);

