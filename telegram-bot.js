const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Конфигурация бота
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://your-domain.com/webhook';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-domain.com';

app.use(express.json());

// Функция для отправки запросов к Telegram API
async function sendTelegramRequest(method, data) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    } catch (error) {
        console.error('❌ Ошибка Telegram API:', error);
        throw error;
    }
}

// Обработка webhook от Telegram
app.post('/webhook', async (req, res) => {
    try {
        const update = req.body;
        console.log('📨 Получено обновление:', JSON.stringify(update, null, 2));
        
        if (update.message) {
            await handleMessage(update.message);
        } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
        }
        
        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обработка сообщений
async function handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text;
    const username = message.from.username || message.from.first_name;
    
    console.log(`💬 Сообщение от ${username}: ${text}`);
    
    if (text === '/start') {
        await sendWelcomeMessage(chatId);
    } else if (text === '/help') {
        await sendHelpMessage(chatId);
    } else if (text === '/app') {
        await sendMiniApp(chatId);
    } else {
        await sendUnknownCommand(chatId);
    }
}

// Обработка callback query (нажатия на кнопки)
async function handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const username = callbackQuery.from.username || callbackQuery.from.first_name;
    
    console.log(`🔘 Callback от ${username}: ${data}`);
    
    if (data === 'open_app') {
        await sendMiniApp(chatId);
    }
    
    // Отвечаем на callback query
    await sendTelegramRequest('answerCallbackQuery', {
        callback_query_id: callbackQuery.id
    });
}

// Отправка приветственного сообщения
async function sendWelcomeMessage(chatId) {
    const message = `🏒 Добро пожаловать в PodZHoc!

🎯 Это хоккейный челлендж для дружеских пари на матчи КХЛ 2025-2026!

📊 Что вы можете делать:
• Делать ставки на реальные матчи КХЛ
• Следить за своим балансом шайбочек
• Соревноваться с друзьями в рейтинге
• Получать уведомления о результатах

🚀 Нажмите кнопку ниже, чтобы открыть приложение!`;

    await sendTelegramRequest('sendMessage', {
        chat_id: chatId,
        text: message,
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🏒 Открыть PodZHoc',
                    web_app: { url: MINI_APP_URL }
                }],
                [{
                    text: '❓ Помощь',
                    callback_data: 'help'
                }]
            ]
        }
    });
}

// Отправка сообщения с помощью
async function sendHelpMessage(chatId) {
    const message = `❓ Помощь по PodZHoc

🎯 Как играть:
1. Откройте приложение кнопкой "Открыть PodZHoc"
2. Выберите матч из списка
3. Сделайте ставку на команду
4. Следите за результатами

💰 Валюта:
• Используются "шайбочки" вместо реальных денег
• Начальный баланс: 1000 шайбочек
• Коэффициент: 2.0 (ставка x2 при выигрыше)

📊 Статусы матчей:
🟢 Ставки открыты - можно делать ставки
🟡 Ставки закрыты - менее 1 часа до начала
🔴 LIVE - матч идет
✅ Завершен - матч окончен

🏆 Рейтинг:
• Показывает лучших игроков
• Обновляется в реальном времени
• Учитывает процент побед и общее количество ставок

🔄 Обновления:
• Матчи обновляются каждые 30 секунд
• Результаты приходят автоматически

❓ Если у вас есть вопросы, напишите /start`;

    await sendTelegramRequest('sendMessage', {
        chat_id: chatId,
        text: message,
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🏒 Открыть приложение',
                    web_app: { url: MINI_APP_URL }
                }]
            ]
        }
    });
}

// Отправка Mini App
async function sendMiniApp(chatId) {
    const message = `🚀 Открываем PodZHoc...

Нажмите кнопку ниже, чтобы начать играть!`;

    await sendTelegramRequest('sendMessage', {
        chat_id: chatId,
        text: message,
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🏒 Открыть PodZHoc',
                    web_app: { url: MINI_APP_URL }
                }]
            ]
        }
    });
}

// Отправка сообщения о неизвестной команде
async function sendUnknownCommand(chatId) {
    const message = `❓ Неизвестная команда

Доступные команды:
/start - Начать работу с ботом
/help - Показать помощь
/app - Открыть приложение

Или просто нажмите кнопку ниже!`;

    await sendTelegramRequest('sendMessage', {
        chat_id: chatId,
        text: message,
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '🏒 Открыть PodZHoc',
                    web_app: { url: MINI_APP_URL }
                }]
            ]
        }
    });
}

// Установка webhook
async function setWebhook() {
    try {
        console.log('🔗 Устанавливаем webhook...');
        const result = await sendTelegramRequest('setWebhook', {
            url: WEBHOOK_URL + '/webhook'
        });
        
        if (result.ok) {
            console.log('✅ Webhook установлен успешно');
        } else {
            console.error('❌ Ошибка установки webhook:', result);
        }
    } catch (error) {
        console.error('❌ Ошибка установки webhook:', error);
    }
}

// Получение информации о боте
async function getBotInfo() {
    try {
        const result = await sendTelegramRequest('getMe');
        if (result.ok) {
            console.log('🤖 Информация о боте:');
            console.log(`   Имя: ${result.result.first_name}`);
            console.log(`   Username: @${result.result.username}`);
            console.log(`   ID: ${result.result.id}`);
        }
    } catch (error) {
        console.error('❌ Ошибка получения информации о боте:', error);
    }
}

// Запуск сервера
app.listen(PORT, async () => {
    console.log(`🚀 Telegram Bot запущен на порту ${PORT}`);
    console.log(`🌐 Webhook URL: ${WEBHOOK_URL}/webhook`);
    console.log(`📱 Mini App URL: ${MINI_APP_URL}`);
    
    if (BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
        await getBotInfo();
        await setWebhook();
    } else {
        console.log('⚠️ Установите BOT_TOKEN в переменных окружения');
    }
});

// Обработка ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});


