const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'podzhoc.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Ошибка подключения к базе данных:', err.message);
            } else {
                console.log('✅ Подключение к базе данных SQLite установлено');
                // Создаем таблицы синхронно
                this.createTablesSync();
            }
        });
    }

    createTablesSync() {
        const tables = [
            // Таблица пользователей
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegramId TEXT UNIQUE NOT NULL,
                username TEXT,
                firstName TEXT,
                balance INTEGER DEFAULT 1000,
                totalBets INTEGER DEFAULT 0,
                wonBets INTEGER DEFAULT 0,
                lastBonusTime INTEGER DEFAULT 0,
                createdAt INTEGER DEFAULT (strftime('%s', 'now')),
                updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            // Таблица ставок
            `CREATE TABLE IF NOT EXISTS bets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegramId TEXT NOT NULL,
                matchId INTEGER NOT NULL,
                betType TEXT NOT NULL,
                amount INTEGER NOT NULL,
                status TEXT DEFAULT 'active',
                potentialWin INTEGER,
                winnings INTEGER DEFAULT 0,
                processedAt TEXT,
                createdAt INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            // Таблица матчей
            `CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY,
                teamHome TEXT NOT NULL,
                teamAway TEXT NOT NULL,
                scoreHome INTEGER DEFAULT 0,
                scoreAway INTEGER DEFAULT 0,
                date TEXT NOT NULL,
                startTime INTEGER NOT NULL,
                status TEXT DEFAULT 'scheduled',
                venue TEXT,
                league TEXT,
                isRealData BOOLEAN DEFAULT 1,
                source TEXT,
                createdAt INTEGER DEFAULT (strftime('%s', 'now')),
                updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            // Таблица завершенных матчей
            `CREATE TABLE IF NOT EXISTS finished_matches (
                id INTEGER PRIMARY KEY,
                teamHome TEXT NOT NULL,
                teamAway TEXT NOT NULL,
                scoreHome INTEGER NOT NULL,
                scoreAway INTEGER NOT NULL,
                date TEXT NOT NULL,
                startTime INTEGER NOT NULL,
                venue TEXT,
                league TEXT,
                finishedAt INTEGER DEFAULT (strftime('%s', 'now'))
            )`
        ];

        // Создаем таблицы последовательно с ожиданием
        let completed = 0;
        const totalTables = tables.length;
        
        tables.forEach((sql, index) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error(`❌ Ошибка создания таблицы ${index + 1}:`, err.message);
                } else {
                    console.log(`✅ Таблица ${index + 1} создана`);
                }
                completed++;
                if (completed === totalTables) {
                    console.log('✅ Все таблицы базы данных созданы');
                    // Выполняем миграции
                    this.runMigrations();
                }
            });
        });
    }

    runMigrations() {
        console.log('🔄 Выполняем миграции базы данных...');
        
        // Миграция: добавляем недостающие колонки в таблицу bets
        this.db.run(`ALTER TABLE bets ADD COLUMN winnings INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('❌ Ошибка добавления колонки winnings:', err.message);
            } else if (!err) {
                console.log('✅ Колонка winnings добавлена');
            }
        });
        
        this.db.run(`ALTER TABLE bets ADD COLUMN processedAt TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('❌ Ошибка добавления колонки processedAt:', err.message);
            } else if (!err) {
                console.log('✅ Колонка processedAt добавлена');
            }
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const tables = [
                // Таблица пользователей
                `CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegramId TEXT UNIQUE NOT NULL,
                    username TEXT,
                    firstName TEXT,
                    balance INTEGER DEFAULT 1000,
                    totalBets INTEGER DEFAULT 0,
                    wonBets INTEGER DEFAULT 0,
                    lastBonusTime INTEGER DEFAULT 0,
                    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
                    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
                )`,
                
                // Таблица ставок
                `CREATE TABLE IF NOT EXISTS bets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegramId TEXT NOT NULL,
                    matchId INTEGER NOT NULL,
                    betType TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    status TEXT DEFAULT 'active',
                    potentialWin INTEGER,
                    createdAt INTEGER DEFAULT (strftime('%s', 'now'))
                )`,
                
                // Таблица матчей
                `CREATE TABLE IF NOT EXISTS matches (
                    id INTEGER PRIMARY KEY,
                    teamHome TEXT NOT NULL,
                    teamAway TEXT NOT NULL,
                    scoreHome INTEGER DEFAULT 0,
                    scoreAway INTEGER DEFAULT 0,
                    date TEXT NOT NULL,
                    startTime INTEGER NOT NULL,
                    status TEXT DEFAULT 'scheduled',
                    venue TEXT,
                    league TEXT,
                    isRealData BOOLEAN DEFAULT 1,
                    source TEXT,
                    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
                    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
                )`,
                
                // Таблица завершенных матчей
                `CREATE TABLE IF NOT EXISTS finished_matches (
                    id INTEGER PRIMARY KEY,
                    teamHome TEXT NOT NULL,
                    teamAway TEXT NOT NULL,
                    scoreHome INTEGER NOT NULL,
                    scoreAway INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    startTime INTEGER NOT NULL,
                    venue TEXT,
                    league TEXT,
                    finishedAt INTEGER DEFAULT (strftime('%s', 'now'))
                )`
            ];

            // Создаем таблицы последовательно
            let completed = 0;
            let hasError = false;

            tables.forEach((sql, index) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        console.error(`❌ Ошибка создания таблицы ${index + 1}:`, err.message);
                        hasError = true;
                        reject(err);
                    } else {
                        completed++;
                        console.log(`✅ Таблица ${index + 1} создана`);
                        if (completed === tables.length && !hasError) {
                            console.log('✅ Все таблицы базы данных созданы');
                            resolve();
                        }
                    }
                });
            });
        });
    }

    // Методы для работы с пользователями
    async getUser(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE telegramId = ?',
                [telegramId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async createOrUpdateUser(telegramId, username, firstName) {
        return new Promise((resolve, reject) => {
            const self = this; // Сохраняем ссылку на this
            this.db.run(
                `INSERT OR REPLACE INTO users (telegramId, username, firstName, balance, totalBets, wonBets, lastBonusTime, updatedAt) 
                 VALUES (?, ?, ?, COALESCE((SELECT balance FROM users WHERE telegramId = ?), 1000), 
                         COALESCE((SELECT totalBets FROM users WHERE telegramId = ?), 0),
                         COALESCE((SELECT wonBets FROM users WHERE telegramId = ?), 0),
                         COALESCE((SELECT lastBonusTime FROM users WHERE telegramId = ?), 0),
                         strftime('%s', 'now'))`,
                [telegramId, username, firstName, telegramId, telegramId, telegramId, telegramId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Получаем полные данные созданного/обновленного пользователя
                    self.db.get(
                        'SELECT * FROM users WHERE telegramId = ?',
                        [telegramId],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        }
                    );
                }
            );
        });
    }

    async updateUserBalance(telegramId, newBalance) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET balance = ?, updatedAt = strftime("%s", "now") WHERE telegramId = ?',
                [newBalance, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async clearAllData() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('DELETE FROM bets', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('✅ Ставки очищены');
                });
                
                this.db.run('DELETE FROM users', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('✅ Пользователи очищены');
                });
                
                this.db.run('DELETE FROM matches', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log('✅ Матчи очищены');
                });
                
                // Таблица bonuses может не существовать, поэтому игнорируем ошибку
                this.db.run('DELETE FROM bonuses', (err) => {
                    if (err && !err.message.includes('no such table')) {
                        reject(err);
                        return;
                    }
                    console.log('✅ Бонусы очищены (или таблица не существует)');
                    resolve();
                });
            });
        });
    }

    async updateUserStats(telegramId, totalBets, wonBets) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET totalBets = ?, wonBets = ?, updatedAt = strftime("%s", "now") WHERE telegramId = ?',
                [totalBets, wonBets, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateLastBonusTime(telegramId, timestamp) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET lastBonusTime = ? WHERE telegramId = ?',
                [timestamp, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Методы для работы со ставками
    async createBet(telegramId, matchId, betType, amount, potentialWin) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO bets (telegramId, matchId, betType, amount, potentialWin) VALUES (?, ?, ?, ?, ?)',
                [telegramId, matchId, betType, amount, potentialWin],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getUserBets(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM bets WHERE telegramId = ? ORDER BY createdAt DESC',
                [telegramId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async updateBetStatus(betId, status, winnings = 0) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE bets SET status = ?, winnings = ?, processedAt = ? WHERE id = ?',
                [status, winnings, new Date().toISOString(), betId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getMatchBets(matchId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM bets WHERE matchId = ?', [matchId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async incrementWonBets(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET wonBets = wonBets + 1 WHERE telegramId = ?',
                [telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getAllBets() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM bets ORDER BY createdAt DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Методы для работы с матчами
    async saveMatches(matches) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO matches 
                (id, teamHome, teamAway, scoreHome, scoreAway, date, startTime, status, venue, league, isRealData, source, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            `);

            matches.forEach(match => {
                stmt.run([
                    match.id,
                    match.teamHome,
                    match.teamAway,
                    match.scoreHome || 0,
                    match.scoreAway || 0,
                    match.date,
                    match.startTime,
                    match.status || 'scheduled',
                    match.venue || 'Арена КХЛ',
                    match.league || 'КХЛ 2025-2026',
                    match.isRealData || 1,
                    match.source || 'khl_official'
                ]);
            });

            stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getMatches() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM matches ORDER BY startTime ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async clearDuplicateMatches() {
        return new Promise((resolve, reject) => {
            // Удаляем дубли, оставляя только самую новую запись для каждой комбинации команд и времени
            this.db.run(`
                DELETE FROM matches 
                WHERE id NOT IN (
                    SELECT MAX(updatedAt) 
                    FROM matches 
                    GROUP BY teamHome, teamAway, startTime
                )
            `, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async clearAllMatches() {
        return new Promise((resolve, reject) => {
            // Полностью очищаем таблицу матчей
            this.db.run('DELETE FROM matches', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async clearAllBets() {
        return new Promise((resolve, reject) => {
            // Полностью очищаем таблицу ставок
            this.db.run('DELETE FROM bets', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async resetAllUserBalances() {
        return new Promise((resolve, reject) => {
            // Сбрасываем баланс всех пользователей на 1000
            this.db.run('UPDATE users SET balance = 1000', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async clearAllUsers() {
        return new Promise((resolve, reject) => {
            // Удаляем всех пользователей
            this.db.run('DELETE FROM users', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async updateMatchScore(matchId, scoreHome, scoreAway) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE matches SET scoreHome = ?, scoreAway = ?, updatedAt = strftime("%s", "now") WHERE id = ?',
                [scoreHome, scoreAway, matchId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateMatchStatus(matchId, status) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE matches SET status = ?, updatedAt = strftime("%s", "now") WHERE id = ?',
                [status, matchId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async finishMatch(matchId) {
        return new Promise((resolve, reject) => {
            // Получаем данные матча
            this.db.get('SELECT * FROM matches WHERE id = ?', [matchId], (err, match) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!match) {
                    reject(new Error('Матч не найден'));
                    return;
                }

                // Перемещаем в таблицу завершенных матчей
                this.db.run(
                    'INSERT INTO finished_matches (id, teamHome, teamAway, scoreHome, scoreAway, date, startTime, venue, league) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [match.id, match.teamHome, match.teamAway, match.scoreHome, match.scoreAway, match.date, match.startTime, match.venue, match.league],
                    function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Удаляем из активных матчей
                        this.db.run('DELETE FROM matches WHERE id = ?', [matchId], (err) => {
                            if (err) reject(err);
                            else resolve(match); // Возвращаем данные матча
                        });
                    }
                );
            });
        });
    }

    async getFinishedMatches() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM finished_matches ORDER BY finishedAt DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async clearFinishedMatches() {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM finished_matches', function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Методы для лидерборда
    async getLeaderboard() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM users WHERE username != "anonymous" AND username != "browser_user" ORDER BY balance DESC, wonBets DESC LIMIT 50',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Метод для сброса всех данных
    async resetAllData() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('DELETE FROM bets');
                this.db.run('DELETE FROM finished_matches');
                this.db.run('UPDATE users SET balance = 1000, totalBets = 0, wonBets = 0, lastBonusTime = 0');
                this.db.run('DELETE FROM matches');
            }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Ошибка закрытия базы данных:', err.message);
                } else {
                    console.log('✅ Соединение с базой данных закрыто');
                }
            });
        }
    }
}

module.exports = Database;
