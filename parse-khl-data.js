// Скрипт для парсинга данных КХЛ из текста пользователя
const fs = require('fs');

// Данные от пользователя (первая часть)
const userMatchData = `29.09.2025  17:00	
Автомобилист – Ак Барс
– : –	
29.09.2025  17:00	
Металлург Мг – Сибирь
– : –	
29.09.2025  17:30	
Барыс – Адмирал
– : –	
29.09.2025  19:30	
Динамо Мн – Локомотив
– : –	
29.09.2025  19:30	
СКА – Торпедо
– : –	
29.09.2025  19:30	
Динамо М – Нефтехимик
– : –	
30.09.2025  19:30	
Спартак – Трактор
– : –	
30.09.2025  19:30	
ХК Сочи – Лада
– : –	
01.10.2025  16:30	
Авангард – Адмирал
– : –	
01.10.2025  17:00	
Барыс – Локомотив
– : –	
01.10.2025  17:00	
Салават Юлаев – Сибирь
– : –	
01.10.2025  17:00	
Автомобилист – Амур
– : –	
01.10.2025  19:30	
СКА – Торпедо
– : –	
01.10.2025  19:30	
Динамо Мн – Северсталь
– : –	
02.10.2025  19:00	
Нефтехимик – Лада
– : –	
02.10.2025  19:30	
Динамо М – Трактор
– : –	
03.10.2025  16:30	
Авангард – Локомотив
– : –	
03.10.2025  19:00	
Торпедо – Северсталь
– : –	
03.10.2025  19:00	
Ак Барс – Амур
– : –	
03.10.2025  19:00	
Спартак – СКА
– : –	
03.10.2025  19:30	
ЦСКА – Металлург Мг
– : –	
03.10.2025  19:30	
ХК Сочи – Адмирал
– : –`;

function parseMatchData(data) {
    const lines = data.split('\n').map(line => line.trim()).filter(line => line);
    const matches = [];
    
    let currentDate = '';
    let currentTime = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Проверяем, является ли строка датой и временем
        const dateTimeMatch = line.match(/(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})/);
        if (dateTimeMatch) {
            currentDate = dateTimeMatch[1];
            currentTime = dateTimeMatch[2];
            continue;
        }
        
        // Проверяем, является ли строка командами
        const teamsMatch = line.match(/(.+?)\s*–\s*(.+)/);
        if (teamsMatch && currentDate && currentTime) {
            const home = teamsMatch[1].trim();
            const away = teamsMatch[2].trim();
            
            matches.push({
                date: currentDate,
                time: currentTime,
                home: home,
                away: away
            });
        }
    }
    
    return matches;
}

const parsedMatches = parseMatchData(userMatchData);
console.log('Parsed matches:', parsedMatches.length);
console.log('First few matches:', parsedMatches.slice(0, 5));

// Сохраняем в файл
fs.writeFileSync('parsed-matches.json', JSON.stringify(parsedMatches, null, 2));
console.log('Matches saved to parsed-matches.json');
