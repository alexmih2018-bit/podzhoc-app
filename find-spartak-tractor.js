const fs = require('fs');

// Загружаем календарь
const calendar = require('./khl-full-calendar.js');

console.log(`📅 Всего матчей в календаре: ${calendar.length}`);

// Ищем матчи Спартак vs Трактор
const spartakTractorMatches = calendar.filter(match => 
    (match.home === 'Спартак' && match.away === 'Трактор') ||
    (match.home === 'Трактор' && match.away === 'Спартак')
);

console.log(`🔍 Найдено матчей Спартак vs Трактор: ${spartakTractorMatches.length}`);

spartakTractorMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.date} ${match.time} - ${match.home} vs ${match.away}`);
});

// Ищем матчи на 30.09.2025
const matchesOn30Sept = calendar.filter(match => match.date === '30.09.2025');
console.log(`\n📅 Матчи на 30.09.2025: ${matchesOn30Sept.length}`);
matchesOn30Sept.forEach((match, index) => {
    console.log(`${index + 1}. ${match.time} - ${match.home} vs ${match.away}`);
});

// Ищем матчи в 16:30
const matchesAt1630 = calendar.filter(match => match.time === '16:30');
console.log(`\n⏰ Матчи в 16:30: ${matchesAt1630.length}`);
matchesAt1630.forEach((match, index) => {
    console.log(`${index + 1}. ${match.date} - ${match.home} vs ${match.away}`);
});
