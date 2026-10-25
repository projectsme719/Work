import { api } from 'sdk';
import { ensureUser, setProvince } from '../lib/users.js';
import { PROVINCES } from '../lib/config.js';
import { homeText, mainMenu, provinceKeyboard, categoryKeyboard, show } from '../lib/ui.js';
import { handleAdCallback, handleModeration } from '../lib/adflow.js';
import { handleSearchCallback } from '../lib/search.js';
import { handleSocialCallback } from '../lib/social.js';
import { handleManageCallback } from '../lib/manage.js';
import { handleAdminCallback, isAdmin } from '../lib/admin.js';
import { handleChatCallback } from '../lib/chat.js';
import { showCategory, showMine, viewAd } from '../lib/ads.js';
​
export default async function (cb) {
  const data = cb.data ?? '';
  if (!cb.message) {
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return;
  }
  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
​
  let user = await ensureUser(cb.from);
​
  if (user.banned && !isAdmin(cb.from)) {
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: '⛔ دسترسی شما به این ربات مسدود شده است.',
      show_alert: true,
    });
    return;
  }
  if (data === 'soon') {
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: 'این بخش به•زودی اضافه می•شود 🚧',
      show_alert: true,
    });
    return;
  }
  await api.answerCallbackQuery({ callback_query_id: cb.id });
  if (data === 'noop') return;
​
  if (data === 'adm' || data.startsWith('adm:')) { await handleAdminCallback(cb, user, data); return; }
  if (data.startsWith('am:')) { await handleModeration(cb, data); return; }
  if (await handleChatCallback(cb, user, data)) return;
  if (await handleAdCallback(cb, user, data)) return;
  if (await handleSearchCallback(cb, user, data)) return;
  if (await handleSocialCallback(cb, user, data)) return;
  if (await handleManageCallback(cb, user, data)) return;
  if (data.startsWith('v:')) { await viewAd(chatId, cb.from.id, Number(data.slice(2))); return; }
  if (data === 'mine') { await showMine(chatId, msgId, cb.from.id); return; }
  if (data.startsWith('cat:')) { await showCategory(chatId, msgId, user, data.slice(4)); return; }
​
  if (data === 'prov') {
    await show(chatId, msgId, '📍 ولایت خود را انتخاب کنید:', provinceKeyboard());
  } else if (data.startsWith('prov:')) {
    const v = data.slice(5);
    const province = v === 'all' ? null : (PROVINCES[Number(v)] ?? null);
    await setProvince(cb.from.id, province);
    user = { ...user, province };
    await show(chatId, msgId, homeText(user), mainMenu());
  } else if (data === 'cats') {
    await show(chatId, msgId, '🗂 دسته•بندی مورد نظر را انتخاب کنید:', categoryKeyboard());
  } else if (data === 'menu') {
    await show(chatId, msgId, homeText(user), mainMenu());
  }
}
​