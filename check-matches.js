const Database = require('./database');

async function checkMatches() {
    try {
        const db = new Database();
        const matches = await db.getMatches();
        
        console.log(`📊 Всего матчей в базе: ${matches.length}`);
        console.log('\n📅 Последние 10 матчей:');
        
        matches.slice(-10).forEach(match => {
            const date = new Date(match.startTime);
            console.log(`ID: ${match.id} | ${match.teamHome} vs ${match.teamAway} | ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU')} | Статус: ${match.status}`);
        });
        
        // Проверим старые матчи
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        
        const oldMatches = matches.filter(match => match.startTime < todayStart && match.status !== 'finished');
        console.log(`\n🗑️ Старых матчей (до сегодня): ${oldMatches.length}`);
        
        if (oldMatches.length > 0) {
            console.log('Старые матчи:');
            oldMatches.forEach(match => {
                const date = new Date(match.startTime);
                console.log(`ID: ${match.id} | ${match.teamHome} vs ${match.teamAway} | ${date.toLocaleDateString('ru-RU')} | Статус: ${match.status}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

checkMatches();
