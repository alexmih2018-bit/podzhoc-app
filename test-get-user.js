const Database = require('./database');

async function testGetUser() {
    try {
        const db = new Database();
        const user = await db.getUser('5307839647.0');
        
        console.log('Пользователь:', user);
        
        process.exit(0);
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

testGetUser();
