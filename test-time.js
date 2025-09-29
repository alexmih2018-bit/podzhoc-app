console.log('Текущее время:', new Date().toLocaleString('ru-RU', {timeZone: 'Europe/Moscow'}));
console.log('Timestamp:', Date.now());
console.log('Время матча 19:30:', new Date(1759163400000).toLocaleString('ru-RU', {timeZone: 'Europe/Moscow'}));
console.log('Разница в часах:', (1759163400000 - Date.now()) / (1000 * 60 * 60));
