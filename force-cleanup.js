const Database = require('./database');

async function forceCleanup() {
    try {
        const db = new Database();
        
        // Удаляем все матчи старше сегодняшнего дня
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        
        console.log(`🗑️ Удаляем матчи старше ${today.toLocaleDateString('ru-RU')}...`);
        
        const result = await new Promise((resolve, reject) => {
            db.db.run('DELETE FROM matches WHERE startTime < ?', [todayStart], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
        
        console.log(`✅ Удалено ${result.changes} старых матчей`);
        
        // Проверяем что осталось
        const remainingMatches = await db.getMatches();
        console.log(`📊 Осталось матчей: ${remainingMatches.length}`);
        
        if (remainingMatches.length > 0) {
            console.log('\n📅 Оставшиеся матчи:');
            remainingMatches.forEach(match => {
                const date = new Date(match.startTime);
                console.log(`ID: ${match.id} | ${match.teamHome} vs ${match.teamAway} | ${date.toLocaleDateString('ru-RU')} | Статус: ${match.status}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

forceCleanup();
