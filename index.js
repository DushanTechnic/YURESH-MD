const { makeWASocket, useMultiFileAuthState, Browsers, downloadContentFromMessage, getContentType, jidDecode, makeCacheableSignalKeyStore, makeInMemoryStore, DisconnectReason } = require("@darkcriminal/baileys")
const pino = require("pino")
const path = require('path')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const FileType = require('file-type')
const { color } = require('./lib/color')
const config = require('./config')
const nexara = require('nexara')
const { sms, getSizeMedia } = require('./lib/msg') 

const express = require('express')
const app = express()
const PORT = 4506

const sessionDir = path.join(__dirname, 'auth_info_baileys');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
    if (!config.SESSION_ID) {
        console.error('🛠️⚙️Please add your session to SESSION_ID env ‼️');
        return false;
    }
    const sessdata = config.SESSION_ID.split("GENUX-")[1];
    const url = `https://pastebin.com/raw/${sessdata}`;
    try {
        const response = await nexara.get(url);
        const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        await fs.promises.writeFile(credsPath, data);
        console.log("🔐 Session Successfully Loaded !!⏳");
        return true;
    } catch (error) {
       // console.error('Failed to download session data:', error);
        return false;
    }
}

const store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

async function connectWA() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const syenite = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true
    })

    syenite.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        try {
        if (connection === 'close') { 
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            if (reason === DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete Session and Scan Again`);
                connectWA()
            } else if (reason === DisconnectReason.connectionClosed) {
				console.log("Connection closed, reconnecting....");
				connectWA();
			} else if (reason === DisconnectReason.connectionLost) {
				console.log("Connection Lost from Server, reconnecting...");
				connectWA();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log("Connection Replaced, Another New Session Opened, reconnecting...");
				connectWA();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
				connectWA();
			} else if (reason === DisconnectReason.restartRequired) {
				console.log("Restart Required, Restarting...");
				connectWA();
			} else if (reason === DisconnectReason.timedOut) {
				console.log("Connection TimedOut, Reconnecting...");
				connectWA();
			} else syenite.end(`Unknown DisconnectReason: ${reason}|${connection}`) 
        }

        if (update.connection == "connecting" || update.receivedPendingNotifications == "false") {
			console.log(color(`\n🐿️ Connecting...`, 'red'))
		}
        if (update.connection == "open" || update.receivedPendingNotifications == "true") {
            console.log(color(` `,'magenta'))
            console.log(color(`🐿️ Connected to => ` + JSON.stringify(syenite.user, null, 2), 'red'))
        }

    } catch (err) {
        console.log('Error in Connection.update '+err)
        connectWA()
    }
    })

    syenite.ev.on('creds.update', saveCreds)
    store.bind(syenite.ev)
    setInterval(() => { store.writeToFile("./lib/src/store.json"); }, 3000);

    syenite.ev.on('messages.upsert', async chatUpdate => {
        try { 
            asmi = chatUpdate.messages[0]
            console.log(asmi)
            if (!asmi.message) return
            asmi.message = (Object.keys(asmi.message)[0] === 'ephemeralMessage') ? asmi.message.ephemeralMessage.message : asmi.message

            const m = await sms(syenite, asmi)

            if (m?.key?.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === true) {
              try {
                  const me = await syenite.decodeJid(syenite.user.id);
  
                  const emojis = ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '❤️‍', '🔥', '❤️‍']  
                  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                  const participant = m.key.participant || me;
                  await syenite.sendMessage(
                      m.key.remoteJid,
                      { react: { key: m.key, text: randomEmoji } },
                      { statusJidList: [participant, me] }
                  );
                } catch (error) {
                  console.error('Error reacting to status:', error);
              }
            }

            if (m.message.protocolMessage && m.message.protocolMessage.type === 0 && config.ANTI_DELETE === true) { 
              let key = m.message.protocolMessage.key
              try { 
                  const st = path.join(__dirname, './lib/src/store.json'); 
                  const datac = fs.readFileSync(st, 'utf8'); 
                  const jsonData = JSON.parse(datac); 
                   
                  let messagez = jsonData.messages[m.chat]; 
                  let msgb; 

                  for (let i = 0; i < messagez.length; i++) { 
                      if (messagez[i].key.id === key.id) { 
                          msgb = messagez[i]; 
                      } 
                  } 

                  if (!msgb) { 
                      return console.log("Deleted message detected, error retrieving..."); 
                  } 

                  if(msgb.mtype === 'conversation') {
                  await syenite.sendMessage(m.key.remoteJid, { audio: { url: 'https://github.com/nimesh-piyumal/uploads/raw/refs/heads/main/voice/antidelete.mp3' }, mimetype: 'audio/mp4', ptt: true }); 
                  let caption = `🚫 *This message was deleted !!*\n\n`
                  caption += `⚙️ From: ${msgb.pushName}\n`
                  caption += `✉️ Message Text: ${msgb.body}\n\n`
                  caption += `> ᴅᴇᴠᴇʟᴏᴘᴇʀ ʙʏ ɴɪᴍᴇsʜ ᴘɪʏᴜᴍᴀʟ`

                  await syenite.sendMessage(m.key.remoteJid, { text: caption, contextInfo:{
                  forwardingScore: 9999999, 
                  isForwarded: true  }});

                  } else if(msgb.type === 'imageMessage') {
                  } else if(msgb.type === 'videoMessage') {     
                  } else if(msgb.type === 'stickerMessage') {              
                  } else if(msgb.type === 'documentMessage') {              
                  }

              } catch(e){ 
                  console.log(e.message) 
              } 
            } 

            require("./syenite")(syenite, m, chatUpdate, asmi)

        } catch(e){ 
            console.log(e.message) 
        } 
    })

    syenite.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    syenite.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    syenite.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        filename = path.join(__filename, '../lib/src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
	    size: await getSizeMedia(data),
            ...type,
            data
        }

    }

    syenite.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await syenite.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;
      
        if (res && res.status !== 200 || file.length <= 65536) {
          try {
            throw {
              json: JSON.parse(file.toString())
            };
          } catch (e) {
            if (e.json) throw e.json;
          }
        }
      
        let opt = {
          filename
        };
      
        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;
      
        let mtype = '',
          mimetype = type.mime,
          convert;
      
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) {
          convert = await (ptt ? toPTT : toAudio)(file, type.ext);
          file = convert.data;
          pathFile = convert.filename;
          mtype = 'audio';
          mimetype = 'audio/ogg; codecs=opus';
        } else mtype = 'document';
      
        if (options.asDocument) mtype = 'document';
      
        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;
      
        let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
        let m;
      
        try {
          m = await syenite.sendMessage(jid, message, { ...opt, ...options });
        } catch (e) {
          //console.error(e)
          m = null;
        } finally {
          if (!m) m = await syenite.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
          file = null;
          return m;
        }
      }

}
async function init() {
  if (fs.existsSync(credsPath)) {
      console.log("🛠️ Session ID found📛");
      connectWA();
  } else {
      const sessionDownloaded = await downloadSessionData();
      if (sessionDownloaded) {
          console.log("🔑 Session downloaded, starting bot.�🔓");
          connectWA()
      } else {
          console.log("🔐No session found or downloaded⚙️");
          useQR = true;
          connectWA()
      }
  }
}
init();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`✨️✨Server is running on port ${PORT}`);
});