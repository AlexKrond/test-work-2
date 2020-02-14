const fs = require('fs');
const playTypesConfig = require('./config.js').playTypes;
const getVolumeCredits = require('./config.js').getVolumeCredits;
const getAdditionalVolumeCredits = require('./config.js').getAdditionalVolumeCredits;
let invoice, plays, bill;

try {
  invoice = JSON.parse(fs.readFileSync('./invoices.json', 'utf8'));
  plays = JSON.parse(fs.readFileSync('./plays.json', 'utf8'));
} catch (e) {
  return console.error('Ошибка чтения файлов', e);
}

try {
  bill = statement(invoice, plays);
} catch (e) {
  return console.error('Ошибка оформления счёта', e);
}

console.log(bill);


/**
 * Получение общего счёта и бонусов по заказу.
 * @param   {object}  invoice               Инвойс.
 * @param   {string}  invoice.customer      Заказчик.
 * @param   {array}   invoice.performances  Представления.
 * @param   {object}  plays                 База доступных представлений.
 * @return  {string}                        Счёт за услуги компании с указанием бонусов.
 */
function statement(invoice, plays) {

  // Базовая валидация данных
  if (!invoice) throw new Error('Не передан инвойс');
  if (!plays) throw new Error('Не передана база доступных представлений');
  if (!invoice.hasOwnProperty('customer')) throw new Error('В инвойсе отсутствует заказчик');
  if (typeof invoice.customer !== 'string') throw new Error('Заказчик в инвойсе должен быть строкой');
  if (!invoice.hasOwnProperty('performances')) throw new Error('В инвойсе отсутствует представления');
  if (!Array.isArray(invoice.performances)) throw new Error('Представления в инвойсе должны быть массивом');

  // Переменные
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = [`Счет для ${invoice.customer}`];
  const playTypesCounter = new Map();
  const format = new Intl.NumberFormat("ru-RU",
      {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 2
      }).format;

  // Цикл по каждому представлению из инвойса
  for (let perf of invoice.performances) {
    let { playId, audience } = perf;

    // Валидация отдельного представления
    if (!playId) throw new Error(`В заказе представления ${JSON.stringify(perf)} отсутствует playId`);
    if (!audience) throw new Error(`В заказе представления ${JSON.stringify(perf)} отсутствует audience`);
    if (typeof audience !== 'number') throw new Error(`В заказе представления ${JSON.stringify(perf)} поле audience не является числом`);
    if (!plays.hasOwnProperty(playId)) throw new Error(`Нет представления с id=${playId}`);
    if (!plays[playId].hasOwnProperty('name')) throw new Error(`У представления с id=${playId} не указано поле name`);
    if (!plays[playId].hasOwnProperty('type')) throw new Error(`У представления с id=${playId} не указано поле type`);
    if (!playTypesConfig.hasOwnProperty(plays[playId].type)) throw new Error(`Нет конфигурации для представления с type=${plays[playId].type}`);

    const play = plays[playId];
    const amountConfig = playTypesConfig[play.type].amount;
    let thisAmount = 0;
    audience = Math.ceil(audience);

    if (playTypesCounter.has(play.type)) {
      playTypesCounter.set(play.type, playTypesCounter.get(play.type) + 1);
    } else {
      playTypesCounter.set(play.type, 1);
    }

    // Подсчёт суммы за представление
    thisAmount += amountConfig.basic;
    if (audience > amountConfig.viewerBoundary) {
      thisAmount += amountConfig.viewerBoundary * amountConfig.perViewerUntilBoundary;
      thisAmount += amountConfig.additionalAfterBoundary;
      thisAmount += (audience - amountConfig.viewerBoundary) * amountConfig.perViewerAfterBoundary;
    } else {
      thisAmount += audience * amountConfig.perViewerUntilBoundary;
    }

    // Добавление бонусов
    volumeCredits += getVolumeCredits(audience);

    // Добавление суммы за представление к общему счёту
    totalAmount += thisAmount;

    // Строка счета
    result.push(`${play.name} (${audience} мест): ${format(thisAmount)}`);
  }

  // Дополнительный бонус
  volumeCredits += getAdditionalVolumeCredits(playTypesCounter);

  result.push(`Итого с вас ${format(totalAmount)}`);
  result.push(`Вы заработали ${volumeCredits} бонусов`);
  return result.join('\n');
}
