const {
    proto,
    downloadContentFromMessage,
    getContentType
} = require('@darkcriminal/baileys')
const fs = require('fs')
const nexara = require('nexara')

exports.getGroupAdmins = (participants) => {
    let admins = []
    for (let i of participants) {
        i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : ''
    }
    return admins || []
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            nexara.get(path)
                .then((res) => {
                    let length = parseInt(res.headers['content-length'])
                    let size = exports.bytesToSize(length, 3)
                    if (!isNaN(length)) resolve(size)
                })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = exports.bytesToSize(length, 3)
            if (!isNaN(length)) resolve(size)
        } else {
            reject('I dont know what the error is')
        }
    })
}

exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const downloadMediaMessage = async(m, filename) => {
	if (m.type === 'viewOnceMessage') {
		m.type = m.msg.type
	}
	if (m.type === 'imageMessage') {
		var nameJpg = filename ? filename + '.jpg' : 'undefined.jpg'
		const stream = await downloadContentFromMessage(m.msg, 'image')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameJpg, buffer)
		return fs.readFileSync(nameJpg)
	} else if (m.type === 'videoMessage') {
		var nameMp4 = filename ? filename + '.mp4' : 'undefined.mp4'
		const stream = await downloadContentFromMessage(m.msg, 'video')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameMp4, buffer)
		return fs.readFileSync(nameMp4)
	} else if (m.type === 'audioMessage') {
		var nameMp3 = filename ? filename + '.mp3' : 'undefined.mp3'
		const stream = await downloadContentFromMessage(m.msg, 'audio')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameMp3, buffer)
		return fs.readFileSync(nameMp3)
	} else if (m.type === 'stickerMessage') {
		var nameWebp = filename ? filename + '.webp' : 'undefined.webp'
		const stream = await downloadContentFromMessage(m.msg, 'sticker')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameWebp, buffer)
		return fs.readFileSync(nameWebp)
	} else if (m.type === 'documentMessage') {
		var ext = m.msg.fileName.split('.')[1].toLowerCase().replace('jpeg', 'jpg').replace('png', 'jpg').replace('m4a', 'mp3')
		var nameDoc = filename ? filename + '.' + ext : 'undefined.' + ext
		const stream = await downloadContentFromMessage(m.msg, 'document')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameDoc, buffer)
		return fs.readFileSync(nameDoc)
	}
}

exports.sms = (genux, m, store) => {
	if (!m) return m;
	let M = proto.WebMessageInfo;
	if (m.key) {
	  m.id = m.key.id;
	  m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
	  m.chat = m.key.remoteJid;
	  m.fromMe = m.key.fromMe;
	  m.isGroup = m.chat.endsWith('@g.us');
	  m.sender = genux.decodeJid(m.fromMe && genux.user.id || m.participant || m.key.participant || m.chat || '');
	  if (m.isGroup) m.participant = genux.decodeJid(m.key.participant) || '';
	}
	if (m.message) {
	  m.mtype = getContentType(m.message);
	  m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
	  m.body = m.message.conversation || m.msg.caption || m.msg.selectedId || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text;
	  let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
	  m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
	  if (m.quoted) {
		let type = Object.keys(m.quoted)[0];
		m.quoted = m.quoted[type];
		if (['productMessage'].includes(type)) {
		  type = Object.keys(m.quoted)[0];
		  m.quoted = m.quoted[type];
		}
		if (typeof m.quoted === 'string') m.quoted = {
		  text: m.quoted
		};
		m.quoted.mtype = type;
		m.quoted.id = m.msg.contextInfo.stanzaId;
		m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
		m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
		m.quoted.sender = genux.decodeJid(m.msg.contextInfo.participant);
		m.quoted.fromMe = m.quoted.sender === genux.decodeJid(genux.user.id);
		m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
		m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
		m.getQuotedObj = m.getQuotedMessage = async () => {
		  if (!m.quoted.id) return false;
		  let q = await store.loadMessage(m.chat, m.quoted.id, conn);
		  return exports.smsg(conn, q, store);
		};
		let vM = m.quoted.fakeObj = M.fromObject({
		  key: {
			remoteJid: m.quoted.chat,
			fromMe: m.quoted.fromMe,
			id: m.quoted.id
		  },
		  message: quoted,
		  ...(m.isGroup ? {
			participant: m.quoted.sender
		  } : {})
		});
		m.quoted.delete = () => genux.sendMessage(m.quoted.chat, {
		  delete: vM.key
		});
		m.quoted.copyNForward = (jid, forceForward = false, options = {}) => genux.copyNForward(jid, vM, forceForward, options);
		m.quoted.download = () => downloadMediaMessage(m.quoted);
	  }
	}
	if (m.msg.url) m.download = () => downloadMediaMessage(m.msg);
	m.text = m.msg.text || m.msg.caption || m.message.conversation  || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || m.msg.selectedId || '';
	m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? genux.sendMedia(chatId, text, 'file', '', m, {
	  ...options
	}) : genux.sendText(chatId, text, m, {
	  ...options
	});
	m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
	m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => genux.copyNForward(jid, m, forceForward, options);
	genux.appenTextMessage = async (text, chatUpdate) => {
	  let messages = await generateWAMessage(m.chat, {
		text: text,
		mentions: m.mentionedJid
	  }, {
		userJid: genux.user.id,
		quoted: m.quoted && m.quoted.fakeObj
	  });
	  messages.key.fromMe = areJidsSameUser(m.sender, genux.user.id);
	  messages.key.id = m.key.id;
	  messages.pushName = m.pushName;
	  if (m.isGroup) messages.participant = m.sender;
	  let msg = {
		...chatUpdate,
		messages: [proto.WebMessageInfo.fromObject(messages)],
		type: 'append'
	  };
	  genux.ev.emit('messages.upsert', msg);
	};
	return m;
  };