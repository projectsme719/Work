import { api } from 'sdk';
import { ensureUser } from '../lib/users.js';
import { homeText, mainMenu } from '../lib/ui.js';
import { handleAdInput, clearDraft } from '../lib/adflow.js';
import { handleSearchInput } from '../lib/search.js';
import { handleSocialInput } from '../lib/social.js';
import { handleManageInput } from '../lib/manage.js';
import { handleAdminInput, isAdmin, sendPanel } from '../lib/admin.js';
import { handleChatInput } from '../lib/chat.js';
import { handleShopCommand } from '../lib/shops.js';
import { postAppBanner } from '../lib/channel.js';
import { viewAd } from '../lib/ads.js';
​
export default async function (message) {
  if (!message.from || message.chat.type !== 'private') return;
  const user = await ensureUser(message.from);
​
  if (user.banned && !isAdmin(message.from)) {
    await api.sendMessage({ chat_id: message.chat.id, text: '⛔ دسترسی شما به این ربات مسدود شده است.' });
    return;
  }
​
  const text = (message.text ?? '').trim();
  const isCmd = text.startsWith('/');
​
  if (user.state && !isCmd) {
    if (user.state.startsWith('sr:')) await handleSearchInput(message, user);
    else if (user.state.startsWith('nt:')) await handleSocialInput(message, user);
    else if (user.state.startsWith('ed:')) await handleManageInput(message, user);
    else if (user.state.startsWith('pn:')) await handleAdminInput(message, user);
    else if (user.state.startsWith('ch:')) await handleChatInput(message, user);
    else await handleAdInput(message, user);
    return;
  }
  if (user.state && isCmd) await clearDraft(user.tgId);
​
  // دستورهای مدیر
  if (text === '/admin' && isAdmin(message.from)) {
    await sendPanel(message.chat.id);
    return;
  }
  if (text === '/pinapp' && isAdmin(message.from)) {
    try {
      await postAppBanner();
      await api.sendMessage({ chat_id: message.chat.id, text: '✅ پیام معرفی مینی•اپ در کانال ارسال و پین شد.' });
    } catch (e) {
      await api.sendMessage({ chat_id: message.chat.id, text: '⚠️ خطا در ارسال به کانال: ' + (e && e.description ? e.description : e) });
    }
    return;
  }
  if ((text.startsWith('/shop') || text.startsWith('/unshop')) && (await handleShopCommand(message))) return;
​
  // لینک مستقیم آگهی: /start ad_12
  const m = text.match(/^\/start\s+ad_(\d+)/);
  if (m) {
    await viewAd(message.chat.id, user.tgId, Number(m[1]));
    return;
  }
​
  await api.sendMessage({
    chat_id: message.chat.id,
    text: homeText(user),
    parse_mode: 'HTML',
    reply_markup: mainMenu(),
  });
}
​