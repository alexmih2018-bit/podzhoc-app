const Database = require('./database');

async function testUserBets() {
    try {
        const db = new Database();
        const bets = await db.getUserBets('5307839647.0');
        
        console.log('Ставки пользователя:', bets);
        console.log('Количество ставок:', bets.length);
        
        process.exit(0);
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

testUserBets();
