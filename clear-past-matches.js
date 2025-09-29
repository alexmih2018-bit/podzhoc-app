// Скрипт для очистки прошедших матчей из базы данных
const Database = require('./database.js');

async function clearPastMatches() {
    console.log('🧹 Начинаем очистку прошедших матчей...');
    
    try {
        const db = new Database();
        await db.init();
        
        // Получаем текущее время
        const now = new Date();
        const nowTimestamp = now.getTime();
        
        console.log(`⏰ Текущее время: ${now.toLocaleString('ru-RU', {timeZone: 'Europe/Moscow'})}`);
        console.log(`📅 Timestamp: ${nowTimestamp}`);
        
        // Удаляем матчи, которые уже прошли
        const deleteResult = await new Promise((resolve, reject) => {
            db.db.run(
                'DELETE FROM matches WHERE startTime < ?',
                [nowTimestamp],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
        
        console.log(`🗑️ Удалено прошедших матчей: ${deleteResult}`);
        
        // Также удаляем связанные ставки
        const deleteBetsResult = await new Promise((resolve, reject) => {
            db.db.run(
                `DELETE FROM bets WHERE matchId NOT IN (SELECT id FROM matches)`,
                [],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
        
        console.log(`🗑️ Удалено ставок на несуществующие матчи: ${deleteBetsResult}`);
        
        // Проверяем, сколько матчей осталось
        const remainingMatches = await new Promise((resolve, reject) => {
            db.db.get('SELECT COUNT(*) as count FROM matches', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`📊 Осталось матчей в базе: ${remainingMatches}`);
        
        // Показываем ближайшие матчи
        const upcomingMatches = await new Promise((resolve, reject) => {
            db.db.all(
                'SELECT * FROM matches ORDER BY startTime LIMIT 5',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        console.log('\n📅 Ближайшие матчи:');
        upcomingMatches.forEach((match, index) => {
            const matchTime = new Date(match.startTime).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Moscow'
            });
            console.log(`${index + 1}. ${match.teamHome} vs ${match.teamAway} - ${matchTime}`);
        });
        
        console.log('\n✅ Очистка завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка при очистке:', error);
    }
}

clearPastMatches();
