const Database = require('./database.js');

async function checkFinished() {
    const db = new Database();
    await db.init();
    
    try {
        const finished = await db.getFinishedMatches();
        console.log('Завершенных матчей в БД:', finished.length);
        
        if (finished.length > 0) {
            console.log('Последние завершенные матчи:');
            finished.slice(0, 5).forEach(match => {
                console.log(`- ${match.teamHome} vs ${match.teamAway} (${match.scoreHome}:${match.scoreAway})`);
            });
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

checkFinished();
