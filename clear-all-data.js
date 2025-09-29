const Database = require('./database');

async function clearAllData() {
    try {
        console.log('🧹 Начинаем очистку всех данных...');
        
        const db = new Database();
        
        // Очищаем все таблицы
        await db.clearAllData();
        
        console.log('✅ Все данные успешно очищены!');
        console.log('📊 База данных готова к работе с чистого листа');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка при очистке данных:', error);
        process.exit(1);
    }
}

clearAllData();
