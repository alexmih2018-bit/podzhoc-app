const Database = require('./database');

async function checkUsers() {
    try {
        const db = new Database();
        const users = await db.getLeaderboard();
        
        console.log('Пользователи в БД:');
        users.forEach(u => {
            console.log(`ID: ${u.telegramId}, Username: ${u.username}, Name: ${u.firstName}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

checkUsers();
