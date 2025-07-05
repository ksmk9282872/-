const { Client } = require('discord.js-selfbot-v13');
const express = require('express');

const tokens = ["التوكن"];
const targets = [{ userId: "ايديه" }];
const targetChannels = ["الروم"];
const startMessageId = "المسج";

const expressApp = express();
expressApp.get('/', (_, res) => res.send('Bot is running.'));
expressApp.listen(process.env.PORT || 3000);

const randomReplies = [...new Set(["شنقمك", "دعسمك", "اكسرمك", "اشقمك", "ارفسمك", "اسرطمك", "غدرمك", "نيجمك", "عصرمك", "طحنمك", "خلطمك", "بعصمك", "فلقمك", "قتلمك", "قطعمك", "شطرمك", "عجنمك", "دهسمك", "ظرفمك", "شويمك", "حرقمك", "نيكمك", "كسمك", "كسعرضك", "فتحمك", "ركلمك", "خطفمك", "نكحمك", "جلدمك", "خبطمك", "يبن القحبة", "ضربمك", "عفطمك", "ربطمك", "زرفمك", "شلعمك", "نيجختك", "كسختك", "انيكمك", "هردمك", "نفيمك", "صعقمك", "دعسكسمك", "نحرمك", "سلخمك", "هرسمك", "جلدختك", "نطحمك", "نتحمك", "افجرمك", "سحقمك", "صرعمك", "نسخمك", "قشعمك", "سحقاهلك", "شنقاهلك", "ابجغاهلك", "انطحختك", "اشنقكسمك", "افجرختك", "اقطعختك", "انيكختمك", "هروبمك", "اقودمك", "كس امك", "نفخمك", "قمعمك", "موتمك", "وفاتمك", "يبن الشرموطة", "دفنمك", "لطشمك", "لهبمك", "خرقمك", "اغتصبمك", "انيكختك", "يبن القحاب", "سخطمك", "لعنمك", "فرشمك"])]
const specialWords = ["نقطة", "نقط", "نقطه", "نوقطا", "ن..قط", "ن قط", "نق ط", "بروجكت", "بروجيكت", "البروجكت", "الروبوت", "الروبوتة"];
const specialReplies = ["كسمك.", "كسختك.", "حرقمك.", "قتلمك.", "شفطمك.", "عصرمك.", "ركلمك.", "خطفمك.", "فتحمك.", "عجنمك.", "نيجمك.", "سحقمك.", "شلعمك.", "افترسمك.", "انهشمك.", "اشقمك.", "نيجمك كافي تتهم زبي", "نيكمك دكافي تتهم", "اقتلمك.....", "بكسمك البروجكت", "بكسختك البروجكت", "بطيزمك البروجكت", "ترا نقطت لكسمك", "رفسمك.", "غدرمك."];
const screenshotReplies = ["اسكرن كسمك", "كسمك لا تلح", "ادخل بكسمك واسكرن", "اصور فيديو وانا انيكمك", "سكرين بطبونمك"];
const streamReplies = ["ستريم بحتشونمك", "ستريم بكسختك"];
const questionReplies = ["لو امك قحبة اجبر", "لو ابوك ديوث اجبر", "لو اخوك ابن زنا اجبر"];
const imageReplies = ["حط الصورة بكسمك", "انيكمك بالصور", "اخشي صورة بكسمك"];
const imagePatterns = [/^صور$/, /^صورة$/];
const screenshotPatterns = [/سكرن/, /سكرين/];
const streamPatterns = [/ستريم/, /بث/, /تعال.بث/];
const emojiPatterns = [/حط.?([\p{Extended_Pictographic}\uFE0F]+)/u];

function normalize(text) {
  return text.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

function includesSpecial(text) {
  const flat = normalize(text);
  return specialWords.findIndex(word => flat.includes(normalize(word)));
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomReply(recentReplies) {
  let reply;
  let attempts = 0;
  do {
    reply = getRandom(randomReplies);
    attempts++;
  } while (recentReplies.includes(reply) && attempts < 10);
  recentReplies.push(reply);
  if (recentReplies.length > 10) recentReplies.shift();
  return reply;
}

function isConditionalInsult(content) {
  return /^\s*(لو|اذا)\b/.test(content.toLowerCase());
}

function buildReply(content, recentReplies) {
  if (isConditionalInsult(content)) return getRandom(questionReplies);
  if (imagePatterns.some(rx => rx.test(content))) return `${getRandomReply(recentReplies)} في الصورة`;
  if (screenshotPatterns.some(rx => rx.test(content))) return getRandom(screenshotReplies);
  if (streamPatterns.some(rx => rx.test(content))) return getRandom(streamReplies);
  const emojiMatch = content.match(emojiPatterns[0]);
  if (emojiMatch) return `${getRandomReply(recentReplies)} ${emojiMatch[1]}`;
  const idx = includesSpecial(content);
  return idx !== -1 ? specialReplies[idx % specialReplies.length] : getRandomReply(recentReplies);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

tokens.forEach(token => {
  const client = new Client();
  const repliedMessages = new Set();
  const recentReplies = [];
  let idleChannel;
  let lastActivity = Date.now();
  let userProgress = {};
  let initialDone = false;
  let idleMessageSent = false;
  let processedAll = false;

  client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    idleChannel = await client.channels.fetch(targetChannels[0]);
    for (const channelId of targetChannels) {
      const channel = await client.channels.fetch(channelId);
      for (const target of targets) {
        const messages = await channel.messages.fetch({ after: startMessageId, limit: 100 });
        const sorted = messages.filter(m => m.author.id === target.userId).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        userProgress[target.userId] = {
          channel,
          pendingMessages: [...sorted.values()],
          passCount: 0
        };
      }
    }
    initialDone = true;
  });

  client.on('messageCreate', async msg => {
    if (!initialDone) return;
    if (!targets.some(t => t.userId === msg.author.id)) return;
    if (!targetChannels.includes(msg.channel.id)) return;
    if (repliedMessages.has(msg.id)) return;
    const userData = userProgress[msg.author.id];
    if (!userData) return;
    userData.pendingMessages.push(msg);
    lastActivity = Date.now();
    idleMessageSent = false;
    userData.passCount = 0;
  });

  setInterval(async () => {
    const now = Date.now();
    const idle = now - lastActivity;

    for (const target of targets) {
      const data = userProgress[target.userId];
      if (!data || !data.pendingMessages.length) continue;
      const nextMsg = data.pendingMessages.shift();
      if (!repliedMessages.has(nextMsg.id)) {
        const reply = buildReply(nextMsg.content, recentReplies);
        await delay(1000 + Math.random() * 1000);
        await nextMsg.reply(reply);
        repliedMessages.add(nextMsg.id);
        lastActivity = Date.now();
        idleMessageSent = false;
        data.passCount = 0;
        return;
      }
    }

    const allDone = Object.values(userProgress).every(p => p.pendingMessages.length === 0);
    if (allDone) {
      for (const p of Object.values(userProgress)) {
        p.passCount++;
      }
      const alreadySaid = idleMessageSent;
      if (idle >= 60000 && idle < 180000 && !alreadySaid) {
        await idleChannel.send("هروبمه");
        idleMessageSent = true;
        lastActivity = now;
      } else if (idle >= 180000 && Object.values(userProgress).some(p => p.passCount <= 1)) {
        const mentions = targets.map(t => `<@${t.userId}>`).join(" ");
        await idleChannel.send(`${mentions} وينك يا ابن الشرموطة`);
        lastActivity = now;
        idleMessageSent = false;
      }
    }
  }, 3000);

  client.login(token).catch(console.error);
});
