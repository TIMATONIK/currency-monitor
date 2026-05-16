// ─── Константы ────────────────────────────────────────────────────────────────

const API_URL   = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CODES     = ['USD', 'EUR', 'CNY', 'GBP', 'JPY', 'CHF', 'HKD', 'SGD', 'TRY', 'KZT'];
const HEADERS   = ['Дата обновления', 'Код', 'Название', 'Номинал', 'Курс за единицу'];

// Строка, с которой начинается таблица (1 = статус, 2 = заголовки, 3+ = данные)
const ROW_HEADERS = 2;
const ROW_DATA    = 3;

// ─── Триггер onOpen ────────────────────────────────────────────────────────────

/**
 * Простой триггер — запускается автоматически при открытии таблицы.
 * Добавляет пункт меню «Обновить курсы» на панель инструментов.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Валюты ЦБ РФ')
    .addItem('Обновить курсы', 'updateRates')
    .addToUi();
}

// ─── Основная функция ─────────────────────────────────────────────────────────

/**
 * Получает актуальные курсы валют с API ЦБ РФ и записывает их в активный лист.
 * Вызывается из меню или напрямую из редактора скриптов.
 */
function updateRates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    // 1. Запрос к API — muteHttpExceptions позволяет перехватить HTTP-ошибки вручную
    const response = UrlFetchApp.fetch(API_URL, { muteHttpExceptions: true });

    const code = response.getResponseCode();
    if (code !== 200) {
      throw new Error(`API вернул HTTP ${code}. Попробуйте позже.`);
    }

    // 2. Парсинг JSON — обрабатываем невалидный ответ
    let data;
    try {
      data = JSON.parse(response.getContentText());
    } catch (_) {
      throw new Error('Неверный формат ответа API: ожидался JSON.');
    }

    // 3. Проверка структуры данных
    if (!data || typeof data.Valute !== 'object') {
      throw new Error('Неожиданная структура данных: поле Valute отсутствует.');
    }

    // 4. Дата котировки из ответа ЦБ (не системная дата)
    const rateDate = Utilities.formatDate(
      new Date(data.Date),
      Session.getScriptTimeZone(),
      'dd.MM.yyyy'
    );

    // 5. Формируем строки данных; валюты, которых нет в ответе, пропускаем с логом
    const rows = [];
    for (const cur of CODES) {
      if (!data.Valute[cur]) {
        Logger.log(`[warn] ${cur} отсутствует в ответе ЦБ — пропускаем.`);
        continue;
      }
      const v           = data.Valute[cur];
      const ratePerUnit = v.Value / v.Nominal;
      rows.push([rateDate, cur, v.Name, v.Nominal, ratePerUnit]);
    }

    // 6. Сортируем по курсу за единицу — по убыванию
    rows.sort((a, b) => b[4] - a[4]);

    // 7. Очищаем область данных перед записью (заголовки + до 20 строк данных)
    sheet.getRange(ROW_HEADERS, 1, 20 + 1, HEADERS.length).clearContent().clearFormat();

    // 8. Записываем заголовки и применяем форматирование
    const headerRange = sheet.getRange(ROW_HEADERS, 1, 1, HEADERS.length);
    headerRange.setValues([HEADERS]);
    headerRange
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#f1f5f9')
      .setHorizontalAlignment('center');

    // 9. Записываем строки данных
    const dataRange = sheet.getRange(ROW_DATA, 1, rows.length, HEADERS.length);
    dataRange.setValues(rows);

    // 10. Форматируем колонку «Курс за единицу» (5-я) как число с 4 знаками
    sheet
      .getRange(ROW_DATA, 5, rows.length, 1)
      .setNumberFormat('#,##0.0000');

    // 11. Чередующийся фон для читаемости строк
    for (let i = 0; i < rows.length; i++) {
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      sheet.getRange(ROW_DATA + i, 1, 1, HEADERS.length).setBackground(bg);
    }

    // 12. Авторазмер столбцов
    for (let col = 1; col <= HEADERS.length; col++) {
      sheet.autoResizeColumn(col);
    }

    // 13. Статус успешного выполнения в A1
    setStatus(sheet, `✅ Обновлено: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm:ss')}  |  котировка на ${rateDate}`, '#166534', '#dcfce7');

    Logger.log(`Успешно записано ${rows.length} валют.`);

  } catch (err) {
    // Любая ошибка — пишем в A1 и в лог
    setStatus(sheet, `❌ Ошибка: ${err.message}`, '#991b1b', '#fee2e2');
    Logger.log(`Ошибка updateRates: ${err.message}`);
  }
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

/**
 * Записывает строку статуса в ячейку A1 с цветовым оформлением.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} message
 * @param {string} fontColor  — HEX цвет шрифта
 * @param {string} bgColor    — HEX цвет фона
 */
function setStatus(sheet, message, fontColor, bgColor) {
  const cell = sheet.getRange('A1');
  cell
    .setValue(message)
    .setFontColor(fontColor)
    .setBackground(bgColor)
    .setFontWeight('bold')
    .setFontSize(10);

  // Объединяем A1:E1, чтобы статус не обрезался
  sheet.getRange(1, 1, 1, HEADERS.length).merge();
}
