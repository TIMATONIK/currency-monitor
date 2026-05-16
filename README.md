# Currency Monitor — Курсы валют ЦБ РФ

Тестовое задание из трёх задач. Все три используют публичный API Центрального банка РФ ([cbr-xml-daily.ru](https://www.cbr-xml-daily.ru/daily_json.js)) и работают с одним набором валют: **USD, EUR, CNY, GBP, JPY, CHF, HKD, SGD, TRY, KZT**.

---

## Задача 1 — Веб-утилита мониторинга курсов

**Файл:** [`index.html`](./index.html)

Однофайловое веб-приложение без зависимостей и сборки. Пользователь выбирает валюту, задаёт пороговый курс и получает визуальный алерт — выше или ниже порога текущее значение. Последние 5 запросов сохраняются в историю.

**Возможности:**
- Выбор валюты: USD, EUR, CNY
- Ввод порогового курса (необязательно)
- Цветовой алерт: 🔴 выше / 🟢 ниже / 🟡 равен порогу
- Отклонение от порога в рублях
- История последних 5 запросов с индикаторами статуса
- Пульсирующий индикатор актуальности данных

**Живая версия:** [timatonik.github.io/currency-monitor](https://timatonik.github.io/currency-monitor)

---

## Задача 2 — Python скрипт + Docker

**Файлы:** [`currency_parser.py`](./currency_parser.py), [`Dockerfile`](./Dockerfile), [`requirements.txt`](./requirements.txt)

Консольный скрипт выводит отсортированную таблицу курсов в терминал и сохраняет результат в CSV-файл с датой котировки в названии (`rates_ДД-ММ-ГГГГ.csv`).

**Возможности:**
- Топ-10 валют, курс за единицу (`Value / Nominal`)
- Сортировка по убыванию курса
- Вывод таблицы через `tabulate` с рамкой
- Сохранение в CSV
- Обработка ошибок: таймаут, HTTP-ошибки, невалидный JSON, отсутствие валюты

**Запуск локально:**
```bash
pip install -r requirements.txt
python currency_parser.py
```

**Запуск в Docker:**
```bash
docker build -t currency-parser .
docker run --rm currency-parser
```

**Запуск с сохранением CSV на хост:**
```bash
docker run --rm -v "$(pwd)/output:/app" currency-parser
```

Подробнее: [README_task2.md](./README_task2.md)

---

## Задача 3 — Google Apps Script

**Файл:** [`currency_rates.gs`](./currency_rates.gs)

Скрипт для Google Таблиц. Загружает курсы 10 валют через `UrlFetchApp`, записывает в лист с форматированием и добавляет пункт меню **«Обновить курсы»** через `onOpen()`.

**Возможности:**
- Запрос к API через встроенный `UrlFetchApp`
- Столбцы: Дата обновления, Код, Название, Номинал, Курс за единицу
- Сортировка по курсу по убыванию
- Статус выполнения в ячейке A1 (зелёный/красный фон)
- Форматирование: заголовки, чередующийся фон строк, автоширина столбцов
- Обработка ошибок: недоступность API, HTTP-ошибки, невалидный JSON

**Как подключить:** Расширения → Apps Script → вставить код → сохранить → переоткрыть таблицу.

**Живая таблица:** [открыть в Google Sheets](https://docs.google.com/spreadsheets/d/1u81xHpliAWpcerLBk3I6F_RzQ7N_oJeIRvmovcH_Zt0/edit?usp=sharing)

Подробнее: [README_task3.md](./README_task3.md)

---

## Стек

| Задача | Технологии |
|--------|-----------|
| 1 — Веб-утилита | HTML5, CSS3, JavaScript (ES6+), Fetch API |
| 2 — Python скрипт | Python 3.11, requests, tabulate, Docker |
| 3 — Google Apps Script | GAS (V8), UrlFetchApp, SpreadsheetApp |

Внешние зависимости только в задаче 2 (`requests`, `tabulate`). Задачи 1 и 3 не требуют установки пакетов.

---

## Структура файлов

```
currency-monitor/
├── index.html           # Задача 1: веб-утилита
├── currency_parser.py   # Задача 2: Python скрипт
├── requirements.txt     # Задача 2: зависимости
├── Dockerfile           # Задача 2: Docker-образ
├── currency_rates.gs    # Задача 3: Google Apps Script
├── README.md            # этот файл
├── README_task2.md      # документация к задаче 2
└── README_task3.md      # документация к задаче 3
```
