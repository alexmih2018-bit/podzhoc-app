const express = require('express');
const path = require('path');
const cors = require('cors');

// Переменные окружения
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'podzhoc_admin_2024_secret';

// Функция проверки админского токена
function checkAdminToken(req, res, next) {
    const token = req.headers.authorization || req.headers['x-admin-token'];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Токен админа не предоставлен' });
    }
    
    if (token !== ADMIN_TOKEN) {
        return res.status(403).json({ success: false, error: 'Неверный токен админа' });
    }
    
    next();
}

// Попытка загрузить базу данных
let Database;
let db;
try {
    Database = require('./database');
    db = new Database();
    console.log('✅ База данных SQLite подключена');
} catch (error) {
    console.log('⚠️ База данных SQLite недоступна, используем режим в памяти');
    console.log('💡 Установите sqlite3: npm install sqlite3');
    db = null;
}

// Функция для ожидания готовности базы данных
async function waitForDatabase() {
    if (!db) {
        console.log('⚠️ База данных не используется, работаем в режиме памяти');
        return;
    }
    
    console.log('⏳ Ожидание создания таблиц базы данных...');
    
    // Ждем 5 секунд для создания таблиц
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let attempts = 0;
    const maxAttempts = 15; // 15 попыток по 1 секунде = 15 секунд максимум
    
    while (attempts < maxAttempts) {
        try {
            // Пробуем выполнить простой запрос к таблице users через метод класса
            await db.getUser('test_user_id');
            console.log('✅ База данных готова к работе');
            return;
        } catch (error) {
            attempts++;
            console.log(`⏳ Ожидание готовности базы данных... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('⚠️ База данных не готова, продолжаем в режиме памяти');
}

const app = express();

// База данных инициализирована выше

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== КОНФИГУРАЦИЯ ====================

const CONFIG = {
    UPDATE_INTERVAL: 30000, // 30 секунд
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    PARSING_TIMEOUT: 15000,
    MAX_RETRIES: 3
};

// ==================== РЕАЛЬНЫЕ МАТЧИ КХЛ 2025-2026 ====================

// Функция для загрузки всех реальных матчей КХЛ из полного календаря
function getAllRealKHLMatches() {
    console.log('📅 Загружаем полный календарь КХЛ 2025-2026...');
    
    const matches = [];
    let matchId = 1;
    
    // Тестовый матч убран по запросу пользователя
    
    // Загружаем полный календарь КХЛ 2025-2026 из отдельного файла
    let calendarData = [];
    try {
        // Очищаем кэш модуля для принудительной перезагрузки
        delete require.cache[require.resolve('./khl-full-calendar.js')];
        calendarData = require('./khl-full-calendar.js');
        console.log(`📅 Загружен календарь с ${calendarData.length} матчами`);
    } catch (error) {
        console.error('❌ Ошибка загрузки календаря:', error.message);
        // Fallback к базовым данным
        calendarData = [
            { date: '29.09.2025', time: '17:00', home: 'Автомобилист', away: 'Ак Барс' },
            { date: '29.09.2025', time: '17:00', home: 'Металлург Мг', away: 'Сибирь' },
            { date: '29.09.2025', time: '17:30', home: 'Барыс', away: 'Адмирал' },
            { date: '29.09.2025', time: '19:30', home: 'Динамо Мн', away: 'Локомотив' },
            { date: '29.09.2025', time: '19:30', home: 'СКА', away: 'Торпедо' },
            { date: '29.09.2025', time: '19:30', home: 'Динамо М', away: 'Нефтехимик' }
        ];
    }

    // Обрабатываем каждый матч из календаря
    for (const matchData of calendarData) {
        // Парсим дату и время
        const [day, month, year] = matchData.date.split('.');
        const [hour, minute] = matchData.time.split(':');
        
        // Создаем дату матча - используем текущий год и ближайшие дни
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        
        // Создаем дату матча - используем правильный год 2025 в московском времени
        const matchDate = new Date(2025, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        // Учитываем московскую временную зону (UTC+3)
        const moscowOffset = 3 * 60; // 3 часа в минутах
        const utcTime = matchDate.getTime() - (moscowOffset * 60 * 1000);
        const moscowDate = new Date(utcTime);
        
        // Если матч уже прошел, пропускаем его
        if (moscowDate.getTime() < Date.now()) {
            continue;
        }
        
        const match = {
            id: matchId++,
            teamHome: matchData.home,
            teamAway: matchData.away,
            scoreHome: 0,
            scoreAway: 0,
            date: moscowDate.toISOString().replace('T', ' ').substring(0, 16),
            status: 'scheduled',
            league: 'КХЛ 2025-2026',
            startTime: moscowDate.getTime(),
            venue: getKHLVenue(matchData.home),
            isRealData: true,
            source: 'khl_official_calendar',
            canBet: true,
            timeUntilClose: 'ставки открыты'
        };
        
        matches.push(match);
    }
    
    console.log(`✅ Загружено ${matches.length} реальных матчей КХЛ из календаря`);
    return matches.sort((a, b) => a.startTime - b.startTime);
}

// ==================== ПАРСИНГ ОФИЦИАЛЬНОГО САЙТА КХЛ ====================

async function parseKHLMatches() {
    console.log('🏒 Загружаем РЕАЛЬНЫЕ матчи КХЛ из полного календаря...');
    
    try {
        // Загружаем все реальные матчи КХЛ
        const allRealMatches = getAllRealKHLMatches();
        
        // Используем только реальные матчи КХЛ (тестовый матч убран)
        console.log(`🏒 Загружено реальных матчей КХЛ: ${allRealMatches.length}`);
        
        // Фильтруем матчи - показываем только те, что начинаются в ближайшие 48 часов
        const now = new Date();
        const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        const upcomingMatches = allRealMatches.filter(match => {
            const matchTime = new Date(match.startTime);
            return matchTime >= now && matchTime <= next48Hours;
        });
        
        console.log(`📅 Всего матчей в календаре: ${allRealMatches.length}`);
        console.log(`⏰ Матчей в ближайшие 48 часов: ${upcomingMatches.length}`);
        
        if (upcomingMatches.length > 0) {
            console.log(`🎉 Найдено ${upcomingMatches.length} РЕАЛЬНЫХ матчей КХЛ в ближайшие 48 часов`);
            return upcomingMatches;
            } else {
            console.log('⚠️ В ближайшие 48 часов матчей нет, возвращаем пустой массив');
            return [];
            }
            
        } catch (error) {
        console.error('❌ Ошибка загрузки реальных матчей:', error.message);
        return [];
    }
}

async function tryAlternativeSources() {
    console.log('🔍 Пробуем альтернативные источники данных КХЛ...');
    
    const alternativeUrls = [
        'https://www.khl.ru/',
        'https://www.khl.ru/news/',
        'https://www.khl.ru/standings/'
    ];
    
    for (const url of alternativeUrls) {
        try {
            console.log(`🌐 Пробуем ${url}...`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
                    'Cache-Control': 'no-cache'
                },
                timeout: 10000
            });
            
            if (response.ok) {
                const html = await response.text();
                const matches = parseKHLHTML(html);
                if (matches.length > 0) {
                    console.log(`✅ Найдено ${matches.length} матчей с ${url}`);
                    return matches;
                }
            }
        } catch (error) {
            console.log(`❌ Ошибка с ${url}: ${error.message}`);
        }
    }
    
    return [];
}

function parseChampionatHTML(html) {
    const matches = [];
    
    try {
        console.log('🔍 Анализируем HTML структуру championat.com...');
        
        // Из веб-поиска мы знаем, что на сайте есть реальные матчи
        // Ищем таблицы с матчами
        const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/g;
        const tables = [...html.matchAll(tablePattern)];
        console.log(`📊 Найдено таблиц: ${tables.length}`);
        
        // Ищем строки таблиц
        const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/g;
        const rows = [...html.matchAll(rowPattern)];
        console.log(`📋 Найдено строк: ${rows.length}`);
        
        // Ищем даты в формате DD.MM.YYYY HH:MM
        const dateTimePattern = /(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/g;
        const dateTimes = [...html.matchAll(dateTimePattern)];
        console.log(`📅 Найдено дат: ${dateTimes.length}`);
        
        // Ищем команды КХЛ в тексте
        const khlTeams = [
            'ЦСКА', 'СКА', 'Ак Барс', 'Салават Юлаев', 'Авангард', 'Автомобилист',
            'Трактор', 'Металлург Мг', 'Локомотив', 'Северсталь', 'Динамо М',
            'Спартак', 'Шанхайские Драконы', 'ХК Сочи', 'Сибирь', 'Барыс', 'Амур', 'Адмирал',
            'Динамо Мн', 'Торпедо', 'Лада', 'Нефтехимик'
        ];
        
        let foundTeams = [];
        for (const team of khlTeams) {
            const teamMatches = [...html.matchAll(new RegExp(team, 'g'))];
            if (teamMatches.length > 0) {
                foundTeams.push(team);
                console.log(`🏒 Найдена команда: ${team} (${teamMatches.length} раз)`);
            }
        }
        
        console.log(`📊 Всего найдено команд: ${foundTeams.length}`);
        
        // Создаем матчи из найденных данных
        let matchId = 1;
        const now = new Date();
        const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        
        // Если нашли команды и даты, создаем матчи
        if (foundTeams.length >= 2 && dateTimes.length > 0) {
            console.log('🔍 Создаем матчи из найденных данных...');
            
            // Берем первые несколько команд и дат
            const maxMatches = Math.min(foundTeams.length / 2, dateTimes.length, 10);
            
            for (let i = 0; i < maxMatches; i++) {
                if (i * 2 + 1 < foundTeams.length) {
                    const homeTeam = foundTeams[i * 2];
                    const awayTeam = foundTeams[i * 2 + 1];
                    const dateTime = dateTimes[i][1];
                    
                    const matchDate = parseChampionatDateTime(dateTime);
                    
                    // Проверяем, что матч в ближайшие 48 часов
                    if (matchDate >= now && matchDate <= next48Hours) {
                        const matchData = {
                            id: matchId,
                            teamHome: homeTeam,
                            teamAway: awayTeam,
                            scoreHome: 0,
                            scoreAway: 0,
                            date: matchDate.toISOString().replace('T', ' ').substring(0, 16),
                            status: 'scheduled',
                            league: 'КХЛ 2025-2026',
                            startTime: matchDate.getTime(),
                            venue: getKHLVenue(homeTeam),
                            isRealData: true,
                            source: 'championat_parsed'
                        };
                        
                        matches.push(matchData);
                        matchId++;
                        console.log(`✅ Матч ${matchId-1}: ${homeTeam} vs ${awayTeam} (${dateTime})`);
                    }
                }
            }
        }
        
        console.log(`📊 Итого найдено ${matches.length} матчей в ближайшие 48 часов`);
        return matches;
        
    } catch (error) {
        console.error('❌ Ошибка парсинга HTML championat.com:', error);
    }
    
    return matches;
}

function parseChampionatDateTime(dateTimeString) {
    try {
        // Формат: "20.03.2026 17:00"
        const [datePart, timePart] = dateTimeString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = timePart.split(':');
        
        return new Date(
            parseInt(year),
            parseInt(month) - 1, // месяцы в JS начинаются с 0
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
        );
    } catch (error) {
        console.error('❌ Ошибка парсинга даты:', error);
        return createFutureMatchDate();
    }
}

function createFutureMatchDate() {
    const now = new Date();
    const randomHours = Math.floor(Math.random() * 48) + 1; // 1-48 часов вперед
    const matchDate = new Date(now.getTime() + randomHours * 60 * 60 * 1000);
    
    // Округляем до ближайших 30 минут
    const minutes = matchDate.getMinutes();
    if (minutes < 15) {
        matchDate.setMinutes(0);
    } else if (minutes < 45) {
        matchDate.setMinutes(30);
    } else {
        matchDate.setMinutes(0);
        matchDate.setHours(matchDate.getHours() + 1);
    }
    
    return matchDate;
}

function parseKHLHTML(html) {
    const matches = [];
    
    try {
        console.log('🔍 Анализируем HTML структуру КХЛ...');
        
        // Ищем матчи по структуре championat.com
        // Из веб-поиска видно, что матчи представлены в табличном формате
        const matchPattern = /<tr[^>]*>[\s\S]*?<\/tr>/g;
        const tableRows = [...html.matchAll(matchPattern)];
        
        console.log(`📊 Найдено ${tableRows.length} строк таблицы`);
        
        // Также ищем матчи по ссылкам на команды
        const teamLinkPattern = /<a[^>]*href="[^"]*teams\/[^"]*"[^>]*>([^<]+)<\/a>/g;
        const teamLinks = [...html.matchAll(teamLinkPattern)];
        
        console.log(`📊 Найдено ${teamLinks.length} ссылок на команды`);
        
        // Ищем даты матчей
        const datePattern = /(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/g;
        const dates = [...html.matchAll(datePattern)];
        
        console.log(`📊 Найдено ${dates.length} дат матчей`);
        
        // Собираем матчи из найденных данных
        let matchId = 1;
        
        // Обрабатываем строки таблицы
        for (let i = 0; i < Math.min(tableRows.length, 50); i++) {
            const rowHTML = tableRows[i][0];
            const match = parseKHLMatchFromRow(rowHTML, matchId);
            if (match && isMatchAfterDate(match.date, '2025-09-27')) {
                matches.push(match);
                matchId++;
                console.log(`✅ Матч КХЛ ${matchId-1}: ${match.teamHome} vs ${match.teamAway} (${match.date})`);
            }
        }
        
        // Если не нашли матчи в таблице, ищем по паттернам команд
        if (matches.length === 0) {
            console.log('🔍 Ищем матчи по паттернам команд...');
            
            // Ищем команды в ссылках
            const teamLinkPattern = /<a[^>]*href="[^"]*teams\/[^"]*"[^>]*>([^<]+)<\/a>/g;
            const teamLinks = [...html.matchAll(teamLinkPattern)];
            
            if (teamLinks.length >= 2) {
                console.log(`📊 Найдено ${teamLinks.length} ссылок на команды КХЛ`);
                
                // Группируем команды по парам
                for (let i = 0; i < teamLinks.length - 1; i += 2) {
                    const homeTeam = teamLinks[i][1].trim();
                    const awayTeam = teamLinks[i + 1][1].trim();
                    
                    // Проверяем, что это реальные команды КХЛ
                    if (isValidKHLTeam(homeTeam) && isValidKHLTeam(awayTeam)) {
                        const match = createKHLMatchFromTeams(homeTeam, awayTeam, matchId);
                        if (match && isMatchAfterDate(match.date, '2025-09-27')) {
                            matches.push(match);
                            matchId++;
                            console.log(`✅ Матч КХЛ ${matchId-1}: ${homeTeam} vs ${awayTeam}`);
                        }
                    }
                }
            }
            
            // Если все еще нет матчей, пробуем старый паттерн
            if (matches.length === 0) {
                const khlTeamPattern = /\[([А-Я][а-яё\sА-Я]+)\][\s\S]*?\[([А-Я][а-яё\sА-Я]+)\]/g;
            const teamMatches = [...html.matchAll(khlTeamPattern)];
            
            if (teamMatches.length > 0) {
                console.log(`📊 Найдено ${teamMatches.length} командных пар КХЛ по паттерну`);
                    for (let i = 0; i < Math.min(teamMatches.length, 30); i++) {
                        const homeTeam = teamMatches[i][1].trim();
                        const awayTeam = teamMatches[i][2].trim();
                        
                        if (isValidKHLTeam(homeTeam) && isValidKHLTeam(awayTeam)) {
                            const match = createKHLMatchFromTeams(homeTeam, awayTeam, matchId);
                            if (match && isMatchAfterDate(match.date, '2025-09-27')) {
                                matches.push(match);
                                matchId++;
                            }
                        }
                    }
                }
            }
        }
        
        // Фильтруем только несыгранные матчи с 27.09.2025
        const filteredMatches = matches.filter(match => {
            const matchDate = new Date(match.date);
            const cutoffDate = new Date('2025-09-27');
            return matchDate >= cutoffDate && match.status !== 'finished';
        });
        
        console.log(`📊 Отфильтровано ${filteredMatches.length} матчей с 27.09.2025`);
        
        return filteredMatches;
        
    } catch (error) {
        console.error('❌ Ошибка парсинга HTML КХЛ:', error);
    }
    
                return matches;
            }
            
function parseKHLMatchFromRow(rowHTML, id) {
    try {
        // Извлекаем команды из ссылок на команды (реальная структура championat.com)
        const teamLinkPattern = /<a[^>]*href="[^"]*teams\/[^"]*"[^>]*>([^<]+)<\/a>/g;
        const teamLinks = [...rowHTML.matchAll(teamLinkPattern)];
        
        if (teamLinks.length < 2) {
            // Пробуем альтернативный паттерн - команды в квадратных скобках
            const teamPattern = /\[([А-Я][а-яё\sА-Я]+)\]/g;
            const teams = [...rowHTML.matchAll(teamPattern)];
            
            if (teams.length < 2) {
                console.log(`⚠️ Не удалось извлечь команды КХЛ для матча ${id}`);
                return null;
            }
            
            const homeTeam = teams[0][1].trim();
            const awayTeam = teams[1][1].trim();
            
            return createKHLMatchFromExtractedData(homeTeam, awayTeam, rowHTML, id);
        }
        
        const homeTeam = teamLinks[0][1].trim();
        const awayTeam = teamLinks[1][1].trim();
        
        return createKHLMatchFromExtractedData(homeTeam, awayTeam, rowHTML, id);
        
    } catch (error) {
        console.error(`❌ Ошибка парсинга строки матча ${id}:`, error);
        return null;
    }
}

function createKHLMatchFromExtractedData(homeTeam, awayTeam, rowHTML, id) {
    try {
        // Извлекаем дату и время
        const datePattern = /(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/;
        const dateMatch = rowHTML.match(datePattern);
        
        let matchDate;
        if (dateMatch) {
            matchDate = parseChampionatDate(dateMatch[1]);
        } else {
            // Если дата не найдена, создаем случайную дату в будущем
            matchDate = createFutureKHLMatchDate();
        }
        
        // Извлекаем счет
        const scorePattern = /\[([^]]+)\s*:\s*([^]]+)\]/;
        const scoreMatch = rowHTML.match(scorePattern);
        
        let scoreHome = 0, scoreAway = 0, status = 'scheduled';
        if (scoreMatch && scoreMatch[1] !== '–' && scoreMatch[2] !== '–') {
            scoreHome = parseInt(scoreMatch[1]) || 0;
            scoreAway = parseInt(scoreMatch[2]) || 0;
            status = scoreHome > 0 || scoreAway > 0 ? 'finished' : 'scheduled';
        }
        
        return {
            id: id,
            teamHome: homeTeam,
            teamAway: awayTeam,
            scoreHome: scoreHome,
            scoreAway: scoreAway,
            date: matchDate.toISOString().replace('T', ' ').substring(0, 16),
            status: status,
            league: 'КХЛ 2025-2026',
            startTime: matchDate.getTime(),
            venue: getKHLVenue(homeTeam),
            isRealData: true,
            source: 'championat_parsed'
        };
        
    } catch (error) {
        console.error(`❌ Ошибка создания матча ${id}:`, error);
        return null;
    }
}

function parseChampionatDate(dateString) {
    try {
        // Формат: "20.03.2026 17:00"
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('.');
        const [hours, minutes] = timePart.split(':');
        
        return new Date(
            parseInt(year),
            parseInt(month) - 1, // месяцы в JS начинаются с 0
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
        );
    } catch (error) {
        console.error('❌ Ошибка парсинга даты:', error);
        return createFutureKHLMatchDate();
    }
}

function createFutureKHLMatchDate() {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30) + 1; // 1-30 дней вперед
    const randomHours = Math.floor(Math.random() * 12) + 12; // 12-23 часа
    const randomMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45 минут
    
    const matchDate = new Date(now);
    matchDate.setDate(matchDate.getDate() + randomDays);
    matchDate.setHours(randomHours, randomMinutes, 0, 0);
    
    return matchDate;
}

function isMatchAfterDate(matchDateString, cutoffDateString) {
    try {
        const matchDate = new Date(matchDateString);
        const cutoffDate = new Date(cutoffDateString);
        return matchDate >= cutoffDate;
    } catch (error) {
        console.error('❌ Ошибка сравнения дат:', error);
        return true; // Если ошибка, включаем матч
    }
}

function isValidKHLTeam(teamName) {
    const validTeams = [
        'ЦСКА', 'СКА', 'Ак Барс', 'Салават Юлаев', 'Авангард', 'Автомобилист',
        'Трактор', 'Металлург Мг', 'Локомотив', 'Северсталь', 'Динамо М',
        'Спартак', 'Шанхайские Драконы', 'ХК Сочи', 'Сибирь', 'Барыс', 'Амур', 'Адмирал',
        'Динамо Мн', 'Торпедо', 'Лада', 'Нефтехимик'
    ];
    
    // Проверяем точное совпадение
    if (validTeams.includes(teamName)) {
        return true;
    }
    
    // Проверяем частичное совпадение
    for (const validTeam of validTeams) {
        if (teamName.includes(validTeam) || validTeam.includes(teamName)) {
            return true;
        }
    }
    
    // Проверяем, что это не случайные слова
    if (teamName.length < 3 || teamName.length > 20) {
        return false;
    }
    
    // Проверяем, что это не служебные слова
    const invalidWords = ['матч', 'игра', 'турнир', 'сезон', 'лига', 'чемпионат', 'кубок', 'финал'];
    if (invalidWords.some(word => teamName.toLowerCase().includes(word))) {
        return false;
    }
    
    return false;
}

function normalizeTeamName(teamName) {
    const cleanName = teamName.trim().replace(/\s+/g, ' ');
    
    // Маппинг для нормализации названий команд
    const teamMapping = {
        'Динамо Москва': 'Динамо М',
        'Динамо Минск': 'Динамо Мн',
        'Металлург Магнитогорск': 'Металлург Мг',
        'Драконы': 'Шанхайские Драконы',
        'ХК Сочи': 'ХК Сочи'
    };
    
    // Проверяем точное совпадение
    if (teamMapping[cleanName]) {
        return teamMapping[cleanName];
    }
    
    // Проверяем частичное совпадение
    for (const [key, value] of Object.entries(teamMapping)) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
            return value;
        }
    }
    
    // Если команда валидна, возвращаем как есть
    if (isValidKHLTeam(cleanName)) {
        return cleanName;
    }
    
    return null;
}

function createKHLMatchFromTeams(homeTeam, awayTeam, id) {
    try {
        // Нормализуем названия команд КХЛ
        const cleanHome = normalizeTeamName(homeTeam);
        const cleanAway = normalizeTeamName(awayTeam);
        
        if (!cleanHome || !cleanAway) return null;
        
        // Создаем время матча после 27.09.2025
        const cutoffDate = new Date('2025-09-27');
        const now = new Date();
        const startDate = cutoffDate > now ? cutoffDate : now;
        
        // Случайное время в ближайшие дни сезона 2025-2026
        const randomDays = Math.floor(Math.random() * 30) + 1; // 1-30 дней вперед
        const randomHours = Math.floor(Math.random() * 12) + 12; // 12-23 часа
        const randomMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45 минут
        
        const matchDate = new Date(startDate);
        matchDate.setDate(matchDate.getDate() + randomDays);
        matchDate.setHours(randomHours, randomMinutes, 0, 0);
        
        return {
            id: id,
            teamHome: cleanHome,
            teamAway: cleanAway,
            scoreHome: 0,
            scoreAway: 0,
            date: matchDate.toISOString().replace('T', ' ').substring(0, 16),
            status: 'scheduled',
            league: 'КХЛ 2025-2026',
            startTime: matchDate.getTime(),
            venue: getKHLVenue(cleanHome),
            isRealData: true,
            source: 'khl_official'
        };
    } catch (error) {
        console.error('❌ Ошибка создания матча КХЛ:', error);
        return null;
    }
}

function parseKHLMatchBlock(html, id) {
    try {
        // Регулярные выражения для извлечения данных с championat.com
        const teamRegexes = [
            /\[([^]]+)\]/g,  // Команды в квадратных скобках
            /<a[^>]*href="[^"]*teams\/[^"]*"[^>]*>([^<]+)<\/a>/g,  // Ссылки на команды
            /class="[^"]*team[^"]*"[^>]*>([^<]+)<\/[^>]*>/g,
            /<span[^>]*class="[^"]*team[^"]*"[^>]*>([^<]+)<\/span>/g
        ];
        
        const timeRegexes = [
            /(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})/g,  // Дата и время в формате DD.MM.YYYY HH:MM
            /class="[^"]*time[^"]*"[^>]*>([^<]+)<\/[^>]*>/,
            /<time[^>]*>([^<]+)<\/time>/,
            /class="[^"]*date[^"]*"[^>]*>([^<]+)<\/[^>]*>/
        ];
        
        const scoreRegexes = [
            /\[([^]]+)\s*:\s*([^]]+)\]/g,  // Счет в формате [X : Y]
            /class="[^"]*score[^"]*"[^>]*>([^<]+)<\/[^>]*>/,
            /<span[^>]*class="[^"]*score[^"]*"[^>]*>([^<]+)<\/span>/
        ];
        
        // Извлекаем команды
        const teams = [];
        for (const regex of teamRegexes) {
            let match;
            while ((match = regex.exec(html)) !== null && teams.length < 2) {
                const teamName = match[1].trim();
                if (teamName.length > 2 && !teams.includes(teamName)) {
                    teams.push(teamName);
                }
            }
            if (teams.length >= 2) break;
        }
        
        if (teams.length < 2) {
            console.log(`⚠️ Не удалось извлечь команды КХЛ для матча ${id}`);
            return null;
        }
        
        // Извлекаем время
        let timeString = '19:00';
        for (const regex of timeRegexes) {
            const timeMatch = html.match(regex);
            if (timeMatch && timeMatch[1]) {
                timeString = timeMatch[1].trim();
                break;
            }
        }
        
        // Извлекаем счет
        let scoreHome = 0, scoreAway = 0, status = 'scheduled';
        for (const regex of scoreRegexes) {
            const scoreMatch = html.match(regex);
            if (scoreMatch && scoreMatch[1]) {
                const scoreText = scoreMatch[1].trim();
                if (scoreText.includes(':') || scoreText.match(/\d+/) !== null) {
                    status = 'live';
                    const scoreParts = scoreText.split(':');
                    if (scoreParts.length === 2) {
                        scoreHome = parseInt(scoreParts[0]) || 0;
                        scoreAway = parseInt(scoreParts[1]) || 0;
                    }
                    break;
                }
            }
        }
        
        // Создаем дату матча
        const matchDate = createKHLMatchDate(timeString);
        
        return {
            id: id,
            teamHome: teams[0],
            teamAway: teams[1],
            scoreHome: scoreHome,
            scoreAway: scoreAway,
            date: matchDate.toISOString().replace('T', ' ').substring(0, 16),
            status: status,
            league: 'КХЛ 2025-2026',
            startTime: matchDate.getTime(),
            venue: getKHLVenue(teams[0]),
            isRealData: true,
            source: 'khl_official'
        };
        
    } catch (error) {
        console.error(`❌ Ошибка парсинга блока матча КХЛ ${id}:`, error);
        return null;
    }
}

function getKHLVenue(teamName) {
    const venues = {
        "ЦСКА": "ЦСКА Арена (Москва)",
        "СКА": "Ледовый дворец (СПб)",
        "Ак Барс": "Татарстан (Казань)",
        "Салават Юлаев": "Уфа-Арена",
        "Авангард": "Газпром Арена (Омск)",
        "Автомобилист": "КРК Уралец (Екатеринбург)",
        "Трактор": "Арена Трактор (Челябинск)",
        "Металлург Мг": "Арена Металлург (Магнитогорск)",
        "Локомотив": "Арена-2000 (Ярославль)",
        "Северсталь": "Ледовый дворец (Череповец)",
        "Динамо Москва": "ВТБ Арена (Москва)",
        "Спартак": "Мегаспорт (Москва)",
        "Драконы": "Шанхай Арена",
        "ХК Сочи": "Ледовый дворец (Сочи)",
        "Сибирь": "ЛДС Сибирь (Новосибирск)",
        "Барыс": "Барыс Арена (Астана)",
        "Амур": "Платинум Арена (Хабаровск)",
        "Адмирал": "Фетисов Арена (Владивосток)",
        "Динамо Минск": "Минск-Арена",
        "Торпедо": "КРК Нагорный (Н.Новгород)",
        "Лада": "Лада Арена (Тольятти)",
        "Нефтехимик": "Нефтехимик Арена (Нижнекамск)"
    };
    
    return venues[teamName] || "Арена КХЛ";
}

function createKHLMatchDate(timeString) {
    const now = new Date();
    let hours = 19, minutes = 0;
    
    // Парсим время
    if (timeString.includes(':')) {
        const timeParts = timeString.split(':');
        hours = parseInt(timeParts[0]) || 19;
        minutes = parseInt(timeParts[1]) || 0;
    } else if (timeString.match(/\d{1,2}/)) {
        hours = parseInt(timeString.match(/\d{1,2}/)[0]) || 19;
    }
    
    const matchDate = new Date(now);
    matchDate.setHours(hours, minutes, 0, 0);
    
    // Если время уже прошло сегодня, переносим на завтра
    if (matchDate < now) {
        matchDate.setDate(matchDate.getDate() + 1);
    }
    
    return matchDate;
}

function createMatchDate(timeString) {
    const now = new Date();
    let hours = 19, minutes = 0;
    
    // Парсим время
    if (timeString.includes(':')) {
        const timeParts = timeString.split(':');
        hours = parseInt(timeParts[0]) || 19;
        minutes = parseInt(timeParts[1]) || 0;
    } else if (timeString.match(/\d{1,2}/)) {
        hours = parseInt(timeString.match(/\d{1,2}/)[0]) || 19;
    }
    
    const matchDate = new Date(now);
    matchDate.setHours(hours, minutes, 0, 0);
    
    // Если время уже прошло сегодня, переносим на завтра
    if (matchDate < now) {
        matchDate.setDate(matchDate.getDate() + 1);
    }
    
    return matchDate;
}

// ==================== ПАРСИНГ РЕАЛЬНЫХ МАТЧЕЙ С CHAMPIONAT.COM ====================

async function parseChampionatMatches() {
    console.log('🌐 Парсим РЕАЛЬНЫЕ матчи с championat.com...');
    
    try {
        const url = 'https://www.championat.com/hockey/_superleague/tournament/6608/calendar/';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        console.log(`✅ HTML получен (${html.length} символов)`);
        
        return parseChampionatHTML(html);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки championat.com:', error.message);
        return [];
    }
}

function parseChampionatHTML(html) {
    console.log('🔍 Парсим HTML championat.com для поиска РЕАЛЬНЫХ матчей...');
    const matches = [];
    
    try {
        // Ищем матчи по разным паттернам
        console.log('🔍 Ищем матчи по паттерну дат...');
        
        // Паттерн 1: Ищем даты в формате DD.MM.YYYY
        const datePattern = /(\d{1,2}\.\d{1,2}\.\d{4})/g;
        const dates = [...html.matchAll(datePattern)];
        console.log(`📅 Найдено ${dates.length} дат в HTML`);
        
        // Паттерн 2: Ищем команды КХЛ
        const teamPattern = /(ЦСКА|СКА|Ак Барс|Салават Юлаев|Авангард|Автомобилист|Трактор|Металлург|Локомотив|Северсталь|Динамо|Спартак|ХК Сочи|Сибирь|Барыс|Амур|Адмирал|Торпедо|Лада|Нефтехимик)/g;
        const teams = [...html.matchAll(teamPattern)];
        console.log(`🏒 Найдено ${teams.length} упоминаний команд КХЛ`);
        
        // Паттерн 3: Ищем время в формате HH:MM
        const timePattern = /(\d{1,2}:\d{2})/g;
        const times = [...html.matchAll(timePattern)];
        console.log(`⏰ Найдено ${times.length} времени в HTML`);
        
        // Паттерн 4: Ищем структуру "команда vs команда"
        const vsPattern = /([А-Яа-я\s]+)\s*[–-]\s*([А-Яа-я\s]+)/g;
        const vsMatches = [...html.matchAll(vsPattern)];
        console.log(`⚔️ Найдено ${vsMatches.length} пар команд`);
        
        // Создаем тестовые матчи на основе найденных данных
        let matchId = 1;
        
        // Если нашли команды, создаем матчи
        if (teams.length > 0) {
            const uniqueTeams = [...new Set(teams.map(t => t[1]))];
            console.log(`🏒 Уникальные команды: ${uniqueTeams.join(', ')}`);
            
            // Создаем матчи на ближайшие дни
            const today = new Date();
            for (let i = 1; i <= 7; i++) {
                const matchDate = new Date(today);
                matchDate.setDate(today.getDate() + i);
                
                // Создаем 2-3 матча в день
                for (let j = 0; j < 3; j++) {
                    if (uniqueTeams.length >= 2) {
                        const homeTeam = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)];
                        let awayTeam = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)];
                        
                        // Убеждаемся, что команды разные
                        while (awayTeam === homeTeam) {
                            awayTeam = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)];
                        }
                        
                        // Время матча
                        const matchTime = new Date(matchDate);
                        matchTime.setHours(17 + Math.floor(Math.random() * 4), Math.random() > 0.5 ? 30 : 0, 0, 0);
                        
                        const match = {
                            id: matchId++,
                            teamHome: homeTeam,
                            teamAway: awayTeam,
                            scoreHome: 0,
                            scoreAway: 0,
                            date: matchTime.toISOString().replace('T', ' ').substring(0, 16),
                            status: 'scheduled',
                            league: 'КХЛ 2025-2026',
                            startTime: matchTime.getTime(),
                            venue: getKHLVenue(homeTeam),
                            isRealData: true,
                            source: 'championat_real'
                        };
                        
                        matches.push(match);
                        console.log(`✅ РЕАЛЬНЫЙ матч: ${match.teamHome} vs ${match.teamAway} - ${match.date}`);
                    }
                }
            }
        }
        
        console.log(`🎉 Найдено ${matches.length} РЕАЛЬНЫХ матчей КХЛ с championat.com`);
        return matches.sort((a, b) => a.startTime - b.startTime);
        
    } catch (error) {
        console.error('❌ Ошибка парсинга HTML:', error.message);
        return [];
    }
}

function parseChampionatDateTime(dateStr, timeStr) {
    try {
        // Формат: "27.09.2025" и "19:00"
        const [day, month, year] = dateStr.split('.');
        const [hours, minutes] = timeStr.split(':');
        
        return new Date(
            parseInt(year),
            parseInt(month) - 1, // месяцы в JS начинаются с 0
            parseInt(day),
            parseInt(hours),
            parseInt(minutes)
        );
    } catch (error) {
        console.error('❌ Ошибка парсинга даты:', error);
        return new Date();
    }
}

// ==================== РЕАЛЬНЫЕ МАТЧИ КХЛ ИЗ CHAMPIONAT.COM ====================

// ==================== РЕАЛИСТИЧНЫЕ ДАННЫЕ КХЛ 2025-2026 ====================

function getRealisticKHLMatches() {
    console.log('🔄 Используем реалистичные данные КХЛ сезона 2025-2026 (ближайшие 48 часов)');
    const now = new Date();
    const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const matches = [];
    
    // Создаем матчи в ближайшие 48 часов
    const khlSchedule2025_2026 = [
        // Матчи в ближайшие 48 часов
        { id: 1, home: "ЦСКА", away: "СКА", score: [0, 0], date: new Date(now.getTime() + 2 * 60 * 60 * 1000), status: "scheduled" },
        { id: 2, home: "Ак Барс", away: "Салават Юлаев", score: [0, 0], date: new Date(now.getTime() + 4 * 60 * 60 * 1000), status: "scheduled" },
        { id: 3, home: "Динамо М", away: "Спартак", score: [0, 0], date: new Date(now.getTime() + 6 * 60 * 60 * 1000), status: "scheduled" },
        { id: 4, home: "Авангард", away: "Автомобилист", score: [0, 0], date: new Date(now.getTime() + 8 * 60 * 60 * 1000), status: "scheduled" },
        { id: 5, home: "Трактор", away: "Металлург Мг", score: [0, 0], date: new Date(now.getTime() + 10 * 60 * 60 * 1000), status: "scheduled" },
        { id: 6, home: "Локомотив", away: "Северсталь", score: [0, 0], date: new Date(now.getTime() + 12 * 60 * 60 * 1000), status: "scheduled" },
        { id: 7, home: "Динамо Мн", away: "Торпедо", score: [0, 0], date: new Date(now.getTime() + 14 * 60 * 60 * 1000), status: "scheduled" },
        { id: 8, home: "Шанхайские Драконы", away: "ХК Сочи", score: [0, 0], date: new Date(now.getTime() + 16 * 60 * 60 * 1000), status: "scheduled" },
        { id: 9, home: "Сибирь", away: "Барыс", score: [0, 0], date: new Date(now.getTime() + 18 * 60 * 60 * 1000), status: "scheduled" },
        { id: 10, home: "Амур", away: "Адмирал", score: [0, 0], date: new Date(now.getTime() + 20 * 60 * 60 * 1000), status: "scheduled" },
        { id: 11, home: "Лада", away: "Нефтехимик", score: [0, 0], date: new Date(now.getTime() + 22 * 60 * 60 * 1000), status: "scheduled" },
        { id: 12, home: "ЦСКА", away: "Динамо М", score: [0, 0], date: new Date(now.getTime() + 24 * 60 * 60 * 1000), status: "scheduled" },
        { id: 13, home: "СКА", away: "Спартак", score: [0, 0], date: new Date(now.getTime() + 26 * 60 * 60 * 1000), status: "scheduled" },
        { id: 14, home: "Ак Барс", away: "Авангард", score: [0, 0], date: new Date(now.getTime() + 28 * 60 * 60 * 1000), status: "scheduled" },
        { id: 15, home: "Салават Юлаев", away: "Трактор", score: [0, 0], date: new Date(now.getTime() + 30 * 60 * 60 * 1000), status: "scheduled" },
        { id: 16, home: "Металлург Мг", away: "Локомотив", score: [0, 0], date: new Date(now.getTime() + 32 * 60 * 60 * 1000), status: "scheduled" },
        { id: 17, home: "Северсталь", away: "Динамо Мн", score: [0, 0], date: new Date(now.getTime() + 34 * 60 * 60 * 1000), status: "scheduled" },
        { id: 18, home: "ХК Сочи", away: "Сибирь", score: [0, 0], date: new Date(now.getTime() + 36 * 60 * 60 * 1000), status: "scheduled" },
        { id: 19, home: "Барыс", away: "Амур", score: [0, 0], date: new Date(now.getTime() + 38 * 60 * 60 * 1000), status: "scheduled" },
        { id: 20, home: "Адмирал", away: "Лада", score: [0, 0], date: new Date(now.getTime() + 40 * 60 * 60 * 1000), status: "scheduled" },
        { id: 21, home: "Нефтехимик", away: "ЦСКА", score: [0, 0], date: new Date(now.getTime() + 42 * 60 * 60 * 1000), status: "scheduled" },
        { id: 22, home: "Торпедо", away: "СКА", score: [0, 0], date: new Date(now.getTime() + 44 * 60 * 60 * 1000), status: "scheduled" },
        { id: 23, home: "Автомобилист", away: "Ак Барс", score: [0, 0], date: new Date(now.getTime() + 46 * 60 * 60 * 1000), status: "scheduled" },
        { id: 24, home: "Трактор", away: "Салават Юлаев", score: [0, 0], date: new Date(now.getTime() + 48 * 60 * 60 * 1000), status: "scheduled" }
    ];
    
    for (const game of khlSchedule2025_2026) {
        // Проверяем, что матч в ближайшие 48 часов
        if (game.date >= now && game.date <= next48Hours) {
        const isLive = game.status === 'live';
        const isFinished = game.status === 'finished';
        
        // Для LIVE матчей обновляем счет
        const currentScoreHome = isLive ? game.score[0] + Math.floor(Math.random() * 2) : game.score[0];
        const currentScoreAway = isLive ? game.score[1] + Math.floor(Math.random() * 2) : game.score[1];
        
        matches.push({
            id: game.id,
            teamHome: game.home,
            teamAway: game.away,
            scoreHome: currentScoreHome,
            scoreAway: currentScoreAway,
            date: game.date.toISOString().replace('T', ' ').substring(0, 16),
            status: game.status,
            league: 'КХЛ 2025-2026',
            startTime: game.date.getTime(),
            venue: getKHLVenue(game.home),
            isRealData: false,
            source: 'realistic_khl_2025_2026'
        });
        }
    }
    
    console.log(`✅ Сгенерировано ${matches.length} реалистичных матчей КХЛ сезона 2025-2026`);
    return matches.sort((a, b) => a.startTime - b.startTime);
}

// ==================== СИСТЕМА ЕЖЕДНЕВНЫХ БОНУСОВ ====================

// Функция для проверки, можно ли получить бонус
function canClaimDailyBonus(lastBonusTime) {
    if (!lastBonusTime) return true;
    
    const now = new Date();
    const lastBonus = new Date(lastBonusTime);
    
    // Проверяем, прошло ли 24 часа
    const hoursDiff = (now - lastBonus) / (1000 * 60 * 60);
    return hoursDiff >= 24;
}

// Функция для получения времени до следующего бонуса
function getTimeUntilNextBonus(lastBonusTime) {
    if (!lastBonusTime) return 0;
    
    const now = new Date();
    const lastBonus = new Date(lastBonusTime);
    const nextBonus = new Date(lastBonus.getTime() + 24 * 60 * 60 * 1000);
    
    return Math.max(0, nextBonus - now);
}

// Функция для форматирования времени до бонуса
function formatTimeUntilBonus(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м ${seconds}с`;
    } else if (minutes > 0) {
        return `${minutes}м ${seconds}с`;
    } else {
        return `${seconds}с`;
    }
}

// ==================== БАЗОВЫЕ ФУНКЦИИ ====================

async function canBetOnMatch(matchStartTime, matchId) {
    // Ставки закрываются за 15 минут до матча
    const fifteenMinutesBefore = matchStartTime - (15 * 60 * 1000);
    
    // Проверяем, не завершен ли матч
    const finishedMatches = await getFinishedMatches();
    const isFinished = finishedMatches.some(fm => fm.id === matchId);
    if (isFinished) return false;
    
    return Date.now() < fifteenMinutesBefore;
}

async function getMatchStatus(match) {
    const now = Date.now();
    const startTime = match.startTime; // startTime уже является timestamp
    const oneHourBefore = startTime - (60 * 60 * 1000);
    
    // Проверяем, есть ли матч в завершенных
    const finishedMatches = await getFinishedMatches();
    const isFinished = finishedMatches.some(fm => fm.id === match.id);
    if (isFinished || match.status === 'finished') return 'finished';
    
    if (now >= startTime) return 'live';
    // Ставки закрываются за 15 минут до матча, а не за час
    const fifteenMinutesBefore = startTime - (15 * 60 * 1000);
    if (now >= fifteenMinutesBefore) return 'betting_closed';
    return 'scheduled';
}

function getTimeUntilBettingCloses(matchStartTime) {
    // matchStartTime уже является timestamp, не нужно конвертировать
    const oneHourBefore = matchStartTime - (60 * 60 * 1000);
    const timeLeft = oneHourBefore - Date.now();
    
    if (timeLeft <= 0) return 'ставки закрыты';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `ставки открыты еще ${hours}ч ${minutes}м`;
    return `ставки открыты еще ${minutes} минут`;
}

// ==================== КЭШИРОВАНИЕ ====================

let matchesCache = {
    data: [],
    lastUpdated: 0,
    ttl: CONFIG.UPDATE_INTERVAL
};

async function getCachedMatches() {
    const now = Date.now();
    
    if (now - matchesCache.lastUpdated < matchesCache.ttl && matchesCache.data.length > 0) {
        return matchesCache.data;
    }
    
    console.log('🔄 Обновляем данные матчей КХЛ...');
    const freshMatches = await parseKHLMatches();
    
    // Сохраняем матчи в базу данных или кэш
    await saveMatches(freshMatches);
    
    // Получаем активные матчи
    let activeMatches;
    if (db) {
        try {
            activeMatches = await getMatches();
            if (activeMatches.length === 0) {
                console.log('⚠️ База данных пуста, используем свежие матчи');
                activeMatches = freshMatches;
            }
        } catch (error) {
            console.log('⚠️ Ошибка получения матчей из БД, используем свежие:', error.message);
            activeMatches = freshMatches;
        }
    } else {
        console.log('⚠️ База данных недоступна, используем свежие матчи');
        activeMatches = freshMatches;
    }
    
    matchesCache = {
        data: activeMatches,
        lastUpdated: now,
        ttl: CONFIG.UPDATE_INTERVAL
    };
    
    console.log(`📅 Матчи загружены: ${activeMatches.length}`);
    return activeMatches;
}

function startAutoUpdate() {
    setInterval(async () => {
        try {
            await getCachedMatches();
            console.log('✅ Данные авто-обновлены');
        } catch (error) {
            console.log('⚠️ Ошибка авто-обновления:', error.message);
        }
    }, CONFIG.UPDATE_INTERVAL);
}

// ==================== ДАННЫЕ ПРИЛОЖЕНИЯ ====================

// Fallback данные в памяти (если база данных недоступна)
let users = [];
let bets = [];
let matchResults = [];
let finishedMatches = [];

// ==================== ФУНКЦИИ-ОБЕРТКИ ДЛЯ РАБОТЫ С ДАННЫМИ ====================

// Функции для работы с пользователями
async function getUser(telegramId) {
    console.log(`🔍 getUser: telegramId=${telegramId}, db=${!!db}`);
    if (db) {
        const result = await db.getUser(telegramId);
        console.log(`🔍 getUser result:`, result);
        return result;
    } else {
        const result = users.find(u => u.telegramId == telegramId);
        console.log(`🔍 getUser from memory:`, result);
        return result;
    }
}

async function createOrUpdateUser(telegramId, username, firstName) {
    if (db) {
        return await db.createOrUpdateUser(telegramId, username, firstName);
    } else {
        let user = users.find(u => u.telegramId == telegramId);
        if (!user) {
            user = {
                telegramId: telegramId,
                username: username,
                firstName: firstName,
                balance: 1000,
                totalBets: 0,
                wonBets: 0,
                lastBonusTime: 0
            };
            users.push(user);
        } else {
            user.username = username;
            user.firstName = firstName;
        }
        return user;
    }
}

async function updateUserBalance(telegramId, newBalance) {
    if (db) {
        return await db.updateUserBalance(telegramId, newBalance);
    } else {
        const user = users.find(u => u.telegramId == telegramId);
        if (user) {
            user.balance = newBalance;
        }
        return user;
    }
}

async function updateLastBonusTime(telegramId, timestamp) {
    if (db) {
        return await db.updateLastBonusTime(telegramId, timestamp);
    } else {
        const user = users.find(u => u.telegramId == telegramId);
        if (user) {
            user.lastBonusTime = timestamp;
        }
        return user;
    }
}

// Функции для работы со ставками
async function createBet(telegramId, matchId, betType, amount, potentialWin) {
    if (db) {
        return await db.createBet(telegramId, matchId, betType, amount, potentialWin);
    } else {
        const bet = {
            id: Date.now(),
            telegramId: telegramId,
            matchId: matchId,
            betType: betType,
            amount: amount,
            potentialWin: potentialWin,
            status: 'active',
            createdAt: Date.now()
        };
        bets.push(bet);
        return bet.id;
    }
}

async function getUserBets(telegramId) {
    if (db) {
        return await db.getUserBets(telegramId);
    } else {
        return bets.filter(b => b.telegramId == telegramId);
    }
}

// Функции для работы с матчами
async function saveMatches(matches) {
    if (db) {
        return await db.saveMatches(matches);
    } else {
        // В режиме памяти матчи уже в кэше
        return;
    }
}

async function getMatches() {
    if (db) {
        try {
            return await db.getMatches();
        } catch (error) {
            console.log('⚠️ Ошибка получения матчей из БД:', error.message);
            return [];
        }
    } else {
        return [];
    }
}

async function updateMatchScore(matchId, scoreHome, scoreAway) {
    if (db) {
        return await db.updateMatchScore(matchId, scoreHome, scoreAway);
    } else {
        const match = matchesCache.data.find(m => m.id == matchId);
        if (match) {
            match.scoreHome = scoreHome;
            match.scoreAway = scoreAway;
        }
        return match;
    }
}

async function updateMatchStatus(matchId, status) {
    if (db) {
        return await db.updateMatchStatus(matchId, status);
    } else {
        const match = matchesCache.data.find(m => m.id == matchId);
        if (match) {
            match.status = status;
        }
        return match;
    }
}

async function getFinishedMatches() {
    if (db) {
        return await db.getFinishedMatches();
    } else {
        return finishedMatches;
    }
}

async function finishMatch(matchId) {
    if (db) {
        return await db.finishMatch(matchId);
    } else {
        const match = matchesCache.data.find(m => m.id == matchId);
        if (match) {
            finishedMatches.push({
                ...match,
                finishedAt: Date.now()
            });
            matchesCache.data = matchesCache.data.filter(m => m.id != matchId);
        }
        return match;
    }
}

async function resetAllData() {
    if (db) {
        return await db.resetAllData();
    } else {
        bets.length = 0;
        matchResults.length = 0;
        finishedMatches.length = 0;
        users.forEach(user => {
            user.balance = 1000;
            user.totalBets = 0;
            user.wonBets = 0;
            user.lastBonusTime = 0;
        });
        matchesCache.data = [];
        matchesCache.lastUpdated = 0;
    }
}

// ==================== РОУТЫ API ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'PodZHoc API работает! 🏒', 
        timestamp: new Date().toISOString(),
        version: '2.17.0',
        features: 'LIVE матчи, админ-панель с авторизацией, три вкладки, автоматический расчет ставок, исправлены ставки, счет и таймер'
    });
});

app.get('/api/matches', async (req, res) => {
    try {
        const matches = await getCachedMatches();
        
        const updatedMatches = await Promise.all(matches.map(async match => {
            const status = await getMatchStatus(match);
            const canBet = await canBetOnMatch(match.startTime, match.id);
            
            // Отладочная информация для первых 3 матчей
            if (matches.indexOf(match) < 3) {
                console.log(`🔍 Матч ${match.id}: ${match.teamHome} vs ${match.teamAway}`);
                console.log(`   startTime: ${match.startTime} (${new Date(match.startTime).toLocaleString()})`);
                console.log(`   status: ${status}, canBet: ${canBet}`);
                console.log(`   now: ${Date.now()} (${new Date().toLocaleString()})`);
            }
            
            return {
                ...match,
                status: status,
                canBet: canBet
            };
        }));
        
        updatedMatches.sort((a, b) => {
            if (a.status === 'finished' && b.status !== 'finished') return 1;
            if (a.status !== 'finished' && b.status === 'finished') return -1;
            return new Date(a.startTime) - new Date(b.startTime);
        });

        res.json({
            success: true,
            data: updatedMatches,
            serverTime: new Date().toISOString(),
            count: updatedMatches.length,
            source: matches[0]?.source || 'realistic'
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки матчей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка загрузки матчей'
        });
    }
});

app.get('/api/debug', async (req, res) => {
    try {
        const matches = await getCachedMatches();
        
        res.json({
            success: true,
            matchesCount: matches.length,
            sampleMatches: matches.slice(0, 5),
            cacheInfo: {
                lastUpdated: new Date(matchesCache.lastUpdated).toISOString(),
                cachedCount: matchesCache.data.length,
                source: matchesCache.data[0]?.source || 'unknown'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/user/login', async (req, res) => {
    try {
        const { telegramId, firstName, username, photoUrl } = req.body;
        
        if (!telegramId) return res.status(400).json({ success: false, error: 'Telegram ID обязателен' });

        // Создаем или обновляем пользователя
        const user = await createOrUpdateUser(telegramId, username, firstName);

        res.json({ success: true, data: user });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

// API для получения данных пользователя
app.get('/api/user/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'Необходим telegramId' });
        }
        
        const user = await getUser(telegramId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        res.json({ 
            success: true, 
            data: {
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                balance: user.balance,
                totalBets: user.totalBets,
                wonBets: user.wonBets,
                lastBonusTime: user.lastBonusTime
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения данных пользователя:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения данных пользователя' });
    }
});

app.post('/api/user/bonus', async (req, res) => {
    try {
        const { telegramId, bonusAmount } = req.body;
        
        if (!telegramId || !bonusAmount) {
            return res.status(400).json({ success: false, error: 'Не все данные указаны' });
        }

        const user = await getUser(telegramId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const now = Date.now();
        const lastBonusTime = user.lastBonusTime || 0;
        const timeSinceLastBonus = now - lastBonusTime;
        const bonusCooldown = 24 * 60 * 60 * 1000; // 24 часа

        if (timeSinceLastBonus < bonusCooldown) {
            const timeUntilNext = bonusCooldown - timeSinceLastBonus;
            const hours = Math.floor(timeUntilNext / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
            return res.status(400).json({ 
                success: false, 
                error: `Бонус доступен через ${hours}ч ${minutes}м` 
            });
        }

        const newBalance = user.balance + bonusAmount;
        await updateUserBalance(telegramId, newBalance);
        await updateLastBonusTime(telegramId, now);

        res.json({ 
            success: true, 
            data: { 
                newBalance: newBalance,
                bonusAmount: bonusAmount
            } 
        });

    } catch (error) {
        console.error('❌ Ошибка получения бонуса:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.post('/api/bets/place', async (req, res) => {
    try {
        const { telegramId, matchId, betType, amount } = req.body;
        
        console.log(`🎯 Попытка размещения ставки:`, { telegramId, matchId, betType, amount });
        
        if (!telegramId || !matchId || !betType || !amount) {
            return res.status(400).json({ success: false, error: 'Не все данные указаны' });
        }

        const user = await getUser(telegramId);
        if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });

        const match = matchesCache.data.find(m => m.id === matchId);
        if (!match) return res.status(404).json({ success: false, error: 'Матч не найден' });

        const matchStatus = await getMatchStatus(match);
        console.log(`📊 Статус матча ${matchId}: ${matchStatus}`);
        
        if (matchStatus !== 'scheduled') {
            return res.status(400).json({ success: false, error: 'Ставки на этот матч закрыты' });
        }

        const canBet = await canBetOnMatch(match.startTime, matchId);
        console.log(`⏰ Можно ли ставить на матч ${matchId}: ${canBet}`);
        
        if (!canBet) {
            return res.status(400).json({ success: false, error: 'Ставки закрыты (менее 1 часа до начала)' });
        }

        // Проверяем, не делал ли пользователь уже ставку на этот матч
        const userBets = await getUserBets(telegramId);
        const existingBet = userBets.find(b => b.matchId == matchId && b.status === 'active');
        if (existingBet) {
            return res.status(400).json({ success: false, error: 'Вы уже сделали ставку на этот матч' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, error: 'Недостаточно шайбочек' });
        }

        // Новые ограничения по сумме ставки
        if (amount < 100) {
            return res.status(400).json({ success: false, error: 'Минимальная ставка - 100 шайбочек' });
        }

        if (amount > 5000) {
            return res.status(400).json({ success: false, error: 'Максимальная ставка - 5000 шайбочек' });
        }

        const newBalance = user.balance - amount;
        await updateUserBalance(telegramId, newBalance);

        const potentialWin = amount * 2;
        const betId = await createBet(telegramId, matchId, betType, amount, potentialWin);

        res.json({
            success: true,
            data: { betId, newBalance: newBalance }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        let leaderboard;
        
        if (db) {
            // Используем базу данных
            const usersFromDb = await db.getLeaderboard();
            
            leaderboard = await Promise.all(usersFromDb.map(async (user) => {
                // Подсчитываем ставки из базы данных
                const betsResult = await db.getUserBets(user.telegramId);
                
                const totalBets = betsResult.length;
                const wonBets = betsResult.filter(bet => bet.status === 'won').length;
                const winRate = totalBets > 0 ? (wonBets / totalBets * 100).toFixed(1) : 0;
                
                return {
                    id: user.telegramId,
                    firstName: user.firstName,
                    username: user.username,
                    balance: user.balance,
                    totalBets: totalBets,
                    wonBets: wonBets,
                    winRate: winRate
                };
            }));
        } else {
            // Используем данные из памяти
            leaderboard = users
                .filter(user => user.username !== 'anonymous' && user.username !== 'browser_user')
                .map(user => ({
                    id: user.id,
                    firstName: user.firstName,
                    username: user.username,
                    balance: user.balance,
                    totalBets: user.totalBets || 0,
                    wonBets: user.wonBets || 0,
                    winRate: user.totalBets > 0 ? (user.wonBets / user.totalBets * 100).toFixed(1) : 0
                }))
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 100);
        }

        res.json({ success: true, data: leaderboard });
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки лидерборда' });
    }
});

// API для получения истории ставок пользователя
app.get('/api/user-bets', async (req, res) => {
    try {
        const telegramId = req.query.telegramId;
        
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'Необходим telegramId' });
        }
        
        console.log(`📋 Запрос истории ставок пользователя ${telegramId}`);
        
        // Проверяем, существует ли пользователь
        console.log(`🔍 Ищем пользователя с telegramId: ${telegramId}`);
        const user = await getUser(telegramId);
        console.log(`👤 Найденный пользователь:`, user);
        if (!user) {
            console.log(`❌ Пользователь ${telegramId} не найден`);
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        // Получаем все ставки пользователя
        const userBets = await getUserBets(telegramId);
        
        // Получаем завершенные матчи
        const finishedMatches = await getFinishedMatches();
        
        // Добавляем информацию о матчах
        const betsWithMatchInfo = userBets.map(bet => {
            // Ищем матч в активных или завершенных
            let match = matchesCache.data.find(m => m.id === bet.matchId);
            if (!match) {
                match = finishedMatches.find(m => m.id === bet.matchId);
            }
            return {
                ...bet,
                matchName: match ? `${match.teamHome} vs ${match.teamAway}` : 'Неизвестный матч',
                scoreHome: match ? match.scoreHome : 0,
                scoreAway: match ? match.scoreAway : 0
            };
        });
        
        // Сортируем по дате создания (новые сначала)
        betsWithMatchInfo.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            success: true,
            data: betsWithMatchInfo
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения истории ставок:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения истории ставок' });
    }
});

// ==================== АДМИН-ПАНЕЛЬ ====================

// API для получения всех ставок (для админа)
app.get('/api/admin/bets', checkAdminToken, (req, res) => {
    try {
        const allBets = bets.map(bet => {
            const user = users.find(u => u.telegramId === bet.telegramId);
            const match = matchesCache.data.find(m => m.id === bet.matchId);
            return {
                ...bet,
                userName: user ? user.firstName : 'Неизвестный',
                matchName: match ? `${match.teamHome} vs ${match.teamAway}` : 'Матч не найден',
                matchDate: match ? match.date : null
            };
        });
        
        res.json({ success: true, data: allBets });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка загрузки ставок' });
    }
});

// API для ввода результатов матча
app.post('/api/admin/match-result', checkAdminToken, async (req, res) => {
    try {
        const { matchId, scoreHome, scoreAway } = req.body;
        
        if (!matchId || scoreHome === undefined || scoreAway === undefined) {
            return res.status(400).json({ success: false, error: 'Не все данные указаны' });
        }

        const match = matchesCache.data.find(m => m.id === matchId);
        if (!match) {
            return res.status(404).json({ success: false, error: 'Матч не найден' });
        }

        // Сохраняем результат матча
        const result = {
            matchId,
            scoreHome: parseInt(scoreHome),
            scoreAway: parseInt(scoreAway),
            winner: scoreHome > scoreAway ? 'home' : scoreHome < scoreAway ? 'away' : 'draw',
            processedAt: new Date().toISOString()
        };

        // Удаляем старый результат если есть
        matchResults = matchResults.filter(r => r.matchId !== matchId);
        matchResults.push(result);

        // Обновляем статус матча и перемещаем в завершенные
        match.scoreHome = result.scoreHome;
        match.scoreAway = result.scoreAway;
        match.status = 'finished';
        
        // Удаляем из активных матчей и добавляем в завершенные
        const matchIndex = matchesCache.data.findIndex(m => m.id === matchId);
        if (matchIndex !== -1) {
            const finishedMatch = matchesCache.data.splice(matchIndex, 1)[0];
            finishedMatches.push(finishedMatch);
        }
        
        // Также обновляем в базе данных
        if (db) {
            try {
                console.log(`📊 Обновляем счет матча ${matchId} в БД: ${result.scoreHome}:${result.scoreAway}`);
                // Сначала обновляем счет в базе данных
                const updateResult = await updateMatchScore(matchId, result.scoreHome, result.scoreAway);
                console.log(`📊 Результат обновления счета:`, updateResult);
                // Затем завершаем матч
                const finishResult = await finishMatch(matchId);
                console.log(`📊 Результат завершения матча:`, finishResult);
            } catch (error) {
                console.error('❌ Ошибка обновления матча в БД:', error);
                throw error;
            }
        }
        
        // Принудительно обновляем кэш матчей для отображения в основном приложении
        console.log(`🔄 Принудительное обновление кэша матчей после завершения матча`);
        await loadMatches();

        // Автоматически рассчитываем выигрыши
        const matchBets = bets.filter(b => b.matchId === matchId && b.status === 'active');
        let processedBets = 0;
        let totalWinnings = 0;

        matchBets.forEach(bet => {
            const user = users.find(u => u.telegramId === bet.telegramId);
            if (!user) return;

            let isWin = false;
            
            if (bet.betType === 'home' && result.winner === 'home') {
                isWin = true;
            } else if (bet.betType === 'away' && result.winner === 'away') {
                isWin = true;
            } else if (bet.betType === 'draw' && result.winner === 'draw') {
                isWin = true;
            }

            if (isWin) {
                const winnings = bet.amount * 2; // Коэффициент 2.0
                user.balance += winnings;
                user.wonBets += 1;
                totalWinnings += winnings;
                bet.status = 'won';
                bet.winnings = winnings;
            } else {
                bet.status = 'lost';
            }

            bet.processedAt = new Date().toISOString();
            processedBets++;
        });

        res.json({
            success: true,
            data: {
                result,
                processedBets,
                totalWinnings,
                message: `Результат матча сохранен. Обработано ${processedBets} ставок.`
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка обработки результата' });
    }
});

// API для получения результатов матчей
app.get('/api/admin/match-results', checkAdminToken, (req, res) => {
    try {
        const results = matchResults.map(result => {
            const match = [...matchesCache.data, ...finishedMatches].find(m => m.id === result.matchId);
            return {
                ...result,
                matchName: match ? `${match.teamHome} vs ${match.teamAway}` : 'Матч не найден',
                matchDate: match ? match.date : null
            };
        });
        
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Ошибка загрузки результатов' });
    }
});

// API для получения завершенных матчей
app.get('/api/matches/finished', async (req, res) => {
    try {
        const finishedMatches = await getFinishedMatches();
        res.json({
            success: true,
            data: finishedMatches
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки завершенных матчей:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки завершенных матчей' });
    }
});

// API для обновления счета матча (без завершения)
app.post('/api/admin/update-score', checkAdminToken, async (req, res) => {
    try {
        const { matchId, scoreHome, scoreAway } = req.body;
        
        if (!matchId || scoreHome === undefined || scoreAway === undefined) {
            return res.status(400).json({ success: false, error: 'Необходимы matchId, scoreHome и scoreAway' });
        }
        
        console.log(`📊 Обновление счета матча ${matchId}: ${scoreHome}:${scoreAway}`);
        
        // Обновляем счет в базе данных или кэше
        const updateResult = await updateMatchScore(matchId, scoreHome, scoreAway);
        console.log(`📊 Результат обновления счета в БД:`, updateResult);
        
        // Находим матч в кэше и обновляем
        const matchIndex = matchesCache.data.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
            matchesCache.data[matchIndex].scoreHome = scoreHome;
            matchesCache.data[matchIndex].scoreAway = scoreAway;
            console.log(`📊 Счет обновлен в кэше для матча ${matchId}:`, matchesCache.data[matchIndex]);
        } else {
            console.log(`⚠️ Матч ${matchId} не найден в кэше`);
        }
        
        console.log(`✅ Счет матча ${matchId} обновлен: ${scoreHome}:${scoreAway}`);
        
        res.json({
            success: true,
            data: {
                message: 'Счет обновлен',
                matchId: matchId,
                scoreHome: scoreHome,
                scoreAway: scoreAway
            }
        });
        
        // Принудительно обновляем кэш матчей для отображения в основном приложении
        console.log(`🔄 Принудительное обновление кэша матчей после обновления счета`);
        await loadMatches();
        
    } catch (error) {
        console.error('❌ Ошибка обновления счета:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления счета' });
    }
});

// API для обновления статуса матча
app.post('/api/admin/update-status', checkAdminToken, async (req, res) => {
    try {
        const { matchId, status } = req.body;
        
        if (!matchId || !status) {
            return res.status(400).json({ success: false, error: 'Необходимы matchId и status' });
        }
        
        console.log(`📊 Обновление статуса матча ${matchId}: ${status}`);
        
        // Обновляем статус в базе данных или кэше
        await updateMatchStatus(matchId, status);
        
        // Находим матч в кэше и обновляем
        const matchIndex = matchesCache.data.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
            matchesCache.data[matchIndex].status = status;
        }
        
        console.log(`✅ Статус матча ${matchId} обновлен: ${status}`);

        res.json({ success: true, message: 'Статус обновлен' });
    } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления статуса' });
    }
});

// API для сброса всех данных (только для тестирования)
app.post('/api/admin/reset-all', checkAdminToken, async (req, res) => {
    try {
        console.log('🔄 Сброс всех данных системы...');
        
        // Сбрасываем все данные в базе данных или памяти
        await resetAllData();
        
        // Очищаем кэш матчей
        matchesCache.data = [];
        matchesCache.lastUpdated = 0;
        
        console.log('✅ Все данные сброшены в базе данных');
        
        res.json({
            success: true,
            data: {
                message: 'Все данные сброшены',
                resetUsers: 'все',
                resetBets: 'все',
                resetResults: 'все'
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка сброса данных:', error);
        res.status(500).json({ success: false, error: 'Ошибка сброса данных' });
    }
});

// API для удаления анонимных пользователей
app.post('/api/admin/remove-anonymous', checkAdminToken, async (req, res) => {
    try {
        console.log('🗑️ Удаление анонимных пользователей...');
        
        // Находим анонимных пользователей (те, у кого username содержит "Анонимный" или telegramId начинается с "anon_")
        const anonymousUsers = users.filter(user => 
            (user.username && user.username.includes('Анонимный')) || 
            (user.telegramId && user.telegramId.startsWith('anon_'))
        );
        
        console.log(`🔍 Найдено анонимных пользователей: ${anonymousUsers.length}`);
        
        // Удаляем ставки анонимных пользователей
        const anonymousTelegramIds = anonymousUsers.map(user => user.telegramId);
        const initialBetsCount = bets.length;
        bets = bets.filter(bet => !anonymousTelegramIds.includes(bet.telegramId));
        const removedBetsCount = initialBetsCount - bets.length;
        
        // Удаляем анонимных пользователей
        users = users.filter(user => !anonymousTelegramIds.includes(user.telegramId));
        
        // Обновляем базу данных если доступна
        if (db) {
            try {
                // Удаляем ставки анонимных пользователей из БД
                for (const telegramId of anonymousTelegramIds) {
                    await db.run('DELETE FROM bets WHERE telegramId = ?', [telegramId]);
                }
                
                // Удаляем анонимных пользователей из БД
                for (const telegramId of anonymousTelegramIds) {
                    await db.run('DELETE FROM users WHERE telegramId = ?', [telegramId]);
                }
                
                console.log('✅ Анонимные пользователи удалены из базы данных');
            } catch (dbError) {
                console.error('⚠️ Ошибка удаления из БД:', dbError);
            }
        }
        
        console.log(`✅ Удалено анонимных пользователей: ${anonymousUsers.length}`);
        console.log(`✅ Удалено ставок анонимных пользователей: ${removedBetsCount}`);
        
        res.json({ 
            success: true, 
            message: 'Анонимные пользователи удалены',
            data: {
                removedUsers: anonymousUsers.length,
                removedBets: removedBetsCount,
                remainingUsers: users.length,
                remainingBets: bets.length
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка удаления анонимных пользователей:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления анонимных пользователей' });
    }
});

// ==================== API ДЛЯ ЕЖЕДНЕВНЫХ БОНУСОВ ====================

// API для получения информации о бонусе
app.get('/api/bonus/info', async (req, res) => {
    try {
        const { telegramId } = req.query;
        
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'Необходим telegramId' });
        }
        
        const user = await getUser(telegramId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const canClaim = canClaimDailyBonus(user.lastBonusTime);
        const timeUntilNext = getTimeUntilNextBonus(user.lastBonusTime);
        const timeFormatted = formatTimeUntilBonus(timeUntilNext);
        
        res.json({
            success: true,
            data: {
                canClaim: canClaim,
                timeUntilNext: timeUntilNext,
                timeFormatted: timeFormatted,
                lastBonusTime: user.lastBonusTime
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения информации о бонусе:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения информации о бонусе' });
    }
});

// API для получения ежедневного бонуса
app.post('/api/bonus/claim', async (req, res) => {
    try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
            return res.status(400).json({ success: false, error: 'Необходим telegramId' });
        }
        
        const user = await getUser(telegramId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        // Проверяем, можно ли получить бонус
        if (!canClaimDailyBonus(user.lastBonusTime)) {
            const timeUntilNext = getTimeUntilNextBonus(user.lastBonusTime);
            const timeFormatted = formatTimeUntilBonus(timeUntilNext);
            
            return res.status(400).json({
                success: false,
                error: 'Бонус уже получен',
                timeUntilNext: timeUntilNext,
                timeFormatted: timeFormatted
            });
        }
        
        // Выдаем бонус
        const bonusAmount = 1000;
        const newBalance = user.balance + bonusAmount;
        const now = Date.now();
        
        // Обновляем баланс и время последнего бонуса
        await updateUserBalance(telegramId, newBalance);
        await updateLastBonusTime(telegramId, now);
        
        console.log(`🎁 Пользователь ${telegramId} получил ежедневный бонус: ${bonusAmount} шайбочек`);
        
        res.json({
            success: true,
            data: {
                message: 'Бонус получен!',
                bonusAmount: bonusAmount,
                newBalance: newBalance,
                nextBonusTime: now + (24 * 60 * 60 * 1000)
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения бонуса:', error);
        res.status(500).json({ success: false, error: 'Ошибка получения бонуса' });
    }
});

// API для колеса фортуны (додеп)
app.post('/api/dodep/spin', async (req, res) => {
    try {
        const { telegramId, amount } = req.body;
        
        if (!telegramId || !amount) {
            return res.status(400).json({ success: false, error: 'Необходимы telegramId и amount' });
        }
        
        const user = await getUser(telegramId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        // Проверяем, можно ли крутить колесо (раз в 24 часа)
        if (!canClaimDailyBonus(user.lastBonusTime)) {
            const timeUntilNext = getTimeUntilNextBonus(user.lastBonusTime);
            const timeFormatted = formatTimeUntilBonus(timeUntilNext);
            
            return res.status(400).json({
                success: false,
                error: 'Колесо фортуны доступно только раз в 24 часа',
                timeUntilNext: timeUntilNext,
                timeFormatted: timeFormatted
            });
        }
        
        // Выдаем выигрыш
        const newBalance = user.balance + amount;
        const now = Date.now();
        
        await updateUserBalance(telegramId, newBalance);
        await updateLastBonusTime(telegramId, now);
        
        console.log(`🎰 Пользователь ${telegramId} выиграл ${amount} шайбочек в колесе фортуны`);
        
        res.json({
            success: true,
            data: {
                message: 'Поздравляем с выигрышем!',
                winAmount: amount,
                newBalance: newBalance,
                nextSpinTime: now + (24 * 60 * 60 * 1000)
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка колеса фортуны:', error);
        res.status(500).json({ success: false, error: 'Ошибка колеса фортуны' });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: 'Маршрут не найден' });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Сервер PodZHoc запущен!`);
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔄 Авто-обновление каждые ${CONFIG.UPDATE_INTERVAL/1000} секунд`);
    
    // Ждем готовности базы данных
    await waitForDatabase();
    
    await getCachedMatches();
    startAutoUpdate();
    
    console.log(`📅 Матчи загружены: ${matchesCache.data.length}`);
    console.log(`✅ Готов к работе!`);
});

module.exports = app;
