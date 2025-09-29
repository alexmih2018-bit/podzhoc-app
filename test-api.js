const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('🧪 Тестируем API...');
        
        // Тест 1: Создание пользователя
        console.log('\n1️⃣ Тестируем создание пользователя...');
        const userData = {
            telegramId: '1759162823434.0',
            firstName: 'Тест',
            username: 'test_user'
        };
        
        const userResponse = await fetch('http://localhost:3000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const userResult = await userResponse.json();
        console.log('Результат создания пользователя:', userResult);
        
        // Тест 2: Получение ставок пользователя
        console.log('\n2️⃣ Тестируем получение ставок...');
        const betsResponse = await fetch('http://localhost:3000/api/user-bets?telegramId=1759162823434.0');
        const betsResult = await betsResponse.json();
        console.log('Результат получения ставок:', betsResult);
        
        // Тест 3: Создание ставки
        console.log('\n3️⃣ Тестируем создание ставки...');
        const betData = {
            telegramId: '1759162823434.0',
            matchId: 1,
            betType: 'home',
            amount: 100
        };
        
        const betResponse = await fetch('http://localhost:3000/api/bets/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(betData)
        });
        
        const betResult = await betResponse.json();
        console.log('Результат создания ставки:', betResult);
        
        // Тест 4: Повторное получение ставок
        console.log('\n4️⃣ Тестируем повторное получение ставок...');
        const betsResponse2 = await fetch('http://localhost:3000/api/user-bets?telegramId=1759162823434.0');
        const betsResult2 = await betsResponse2.json();
        console.log('Результат повторного получения ставок:', betsResult2);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

testAPI();
