# 🚀 Развертывание PodZHoc App

## 📋 Подготовка к развертыванию

### 1. Создание GitHub репозитория
```bash
# Инициализация Git (если еще не сделано)
git init
git add .
git commit -m "Initial commit"

# Создание репозитория на GitHub и подключение
git remote add origin https://github.com/ВАШ_USERNAME/podzhoc-app.git
git push -u origin main
```

### 2. Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```env
PORT=3000
ADMIN_TOKEN=podzhoc_admin_2024_secret
NODE_ENV=production
```

## 🌐 Варианты размещения

### **Вариант 1: Render.com (Рекомендуется для начала)**

#### Преимущества:
- ✅ Бесплатный план
- ✅ Автоматическое развертывание из GitHub
- ✅ HTTPS включен
- ✅ Простая настройка

#### Недостатки:
- ❌ Приложение "засыпает" после 15 минут бездействия (бесплатный план)
- ❌ Ограниченные ресурсы

#### Настройка:
1. Зайдите на [render.com](https://render.com)
2. Зарегистрируйтесь через GitHub
3. Нажмите "New +" → "Web Service"
4. Подключите ваш GitHub репозиторий
5. Настройки:
   - **Name**: `podzhoc-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### **Вариант 2: Railway (Альтернатива)**

#### Преимущества:
- ✅ Бесплатный план с $5 кредитов
- ✅ Быстрое развертывание
- ✅ Хорошая производительность

#### Настройка:
1. Зайдите на [railway.app](https://railway.app)
2. Подключите GitHub
3. Создайте новый проект из репозитория
4. Railway автоматически определит Node.js приложение

### **Вариант 3: VPS (Для постоянной работы)**

#### DigitalOcean (от $4/месяц)
1. Создайте Droplet (Ubuntu 22.04)
2. Подключитесь по SSH
3. Установите Node.js и PM2:
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Клонирование репозитория
git clone https://github.com/ВАШ_USERNAME/podzhoc-app.git
cd podzhoc-app

# Установка зависимостей
npm install

# Запуск с PM2
pm2 start server.js --name "podzhoc-app"
pm2 startup
pm2 save
```

#### Настройка домена (опционально)
1. Купите домен (например, на Namecheap)
2. Настройте DNS записи:
   - A запись: `@` → IP адрес VPS
   - CNAME: `www` → ваш домен

## 🔧 Настройка Telegram WebApp

После развертывания обновите настройки бота:

1. Зайдите в [@BotFather](https://t.me/BotFather)
2. Выберите вашего бота
3. `/setmenubutton`
4. Укажите URL: `https://ВАШ-ДОМЕН.com` или `https://ВАШ-APP.onrender.com`

## 📊 Мониторинг

### Для VPS:
```bash
# Просмотр логов
pm2 logs podzhoc-app

# Перезапуск приложения
pm2 restart podzhoc-app

# Статус приложения
pm2 status
```

### Для облачных платформ:
- Render: Dashboard → Logs
- Railway: Deployments → View Logs

## 💰 Стоимость

| Платформа | Бесплатный план | Платный план |
|-----------|----------------|--------------|
| Render | ✅ (с ограничениями) | $7/месяц |
| Railway | ✅ ($5 кредитов) | $5/месяц |
| DigitalOcean | ❌ | $4/месяц |
| Vultr | ❌ | $2.50/месяц |

## 🎯 Рекомендации

1. **Для тестирования**: Render.com (бесплатно)
2. **Для продакшена**: DigitalOcean VPS ($4/месяц)
3. **Для масштабирования**: Railway или Heroku

## 🔒 Безопасность

- Никогда не коммитьте `.env` файл
- Используйте сильные пароли для админки
- Регулярно обновляйте зависимости
- Настройте бэкапы базы данных

