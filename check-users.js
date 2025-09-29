const Database = require('./database.js');

async function checkUsers() {
    try {
        const db = new Database();
        await db.init();
        
        console.log('🔍 Проверяем пользователей в базе данных...');
        
        // Проверяем конкретного пользователя
        const testUserId = '1759162823434.0';
        console.log(`🔍 Ищем пользователя: ${testUserId}`);
        
        const user = await db.getUser(testUserId);
        if (user) {
            console.log('✅ Пользователь найден:', user);
        } else {
            console.log('❌ Пользователь не найден');
        }
        
        // Проверяем ставки
        const bets = await db.getAllBets();
        console.log(`🎯 Всего ставок: ${bets.length}`);
        
        if (bets.length > 0) {
            console.log('📋 Ставки:');
            bets.forEach((bet, index) => {
                console.log(`${index + 1}. User: ${bet.userId}, Match: ${bet.matchId}, Amount: ${bet.amount}, Type: ${bet.betType}`);
            });
        }
        
        // Проверяем ставки конкретного пользователя
        if (user) {
            const userBets = await db.getUserBets(testUserId);
            console.log(`🎯 Ставки пользователя ${testUserId}: ${userBets.length}`);
            if (userBets.length > 0) {
                userBets.forEach((bet, index) => {
                    console.log(`${index + 1}. Match: ${bet.matchId}, Amount: ${bet.amount}, Type: ${bet.betType}, Status: ${bet.status}`);
                });
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
}

checkUsers();
