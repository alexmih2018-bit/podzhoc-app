const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 Тестируем подключение к базе данных...');

const dbPath = path.join(__dirname, 'podzhoc.db');
console.log('📁 Путь к БД:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Подключение к базе данных SQLite установлено');
        
        // Проверяем таблицы
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
            if (err) {
                console.error('❌ Ошибка получения списка таблиц:', err.message);
            } else {
                console.log('📋 Найденные таблицы:');
                rows.forEach(row => {
                    console.log('  -', row.name);
                });
                
                // Проверяем таблицу users
                db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                    if (err) {
                        console.error('❌ Ошибка проверки таблицы users:', err.message);
                    } else {
                        console.log('✅ Таблица users доступна, записей:', row.count);
                    }
                    
                    // Проверяем таблицу bets
                    db.get('SELECT COUNT(*) as count FROM bets', (err, row) => {
                        if (err) {
                            console.error('❌ Ошибка проверки таблицы bets:', err.message);
                        } else {
                            console.log('✅ Таблица bets доступна, записей:', row.count);
                        }
                        
                        db.close();
                        console.log('🔚 Тест завершен');
                    });
                });
            }
        });
    }
});
