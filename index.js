const { default: makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');
const express = require('express');
const qrcode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const qrcode = require('qrcode');

// Endpoint to generate QR for a user
app.get('/pair', async (req, res) => {
    const number = req.query.number;
    if(!number) return res.json({error:"No number provided"});
    
    try {
        // Generate a fake pairing QR for demo
        // In real scenario, use Baileys QR from sock.ev.on('connection.update')
        const demoQR = `WHATSAPP_PAIR:${number}:${Date.now()}`; 
        const qrDataUrl = await qrcode.toDataURL(demoQR);
        res.json({ qr: qrDataUrl });
    } catch(e){
        res.json({ error: e.message });
    }
});
const prefix = '.';
const owners = ['+2348056408043'];

app.use(express.static(__dirname));

let lastQR = '';
const groupSettingsFile = './groupSettings.json';
let groupSettings = {};

// Load or create group settings
if (fs.existsSync(groupSettingsFile)) groupSettings = JSON.parse(fs.readFileSync(groupSettingsFile));
else fs.writeFileSync(groupSettingsFile, JSON.stringify({}));

function saveSettings() { fs.writeFileSync(groupSettingsFile, JSON.stringify(groupSettings, null, 2)); }

// Serve QR code for pairing
app.get('/qr', (req, res) => res.json({ qr: lastQR }));

app.listen(PORT, () => console.log(`🌐 Panel running on http://localhost:${PORT}`));

// ===== COMMANDS =====
const commands = {
    general: {
        ping: (sock, msg) => sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pong!' }),
        alive: (sock, msg) => sock.sendMessage(msg.key.remoteJid, { text: '✅ Bot Alive!' }),
        time: (sock, msg) => sock.sendMessage(msg.key.remoteJid, { text: new Date().toLocaleTimeString() }),
        date: (sock, msg) => sock.sendMessage(msg.key.remoteJid, { text: new Date().toLocaleDateString() }),
        id: (sock, msg) => sock.sendMessage(msg.key.remoteJid, { text: `🆔 ${msg.key.participant || msg.key.remoteJid}` })
    },
    tools: {
        calc: (sock,msg,args)=>{ try{ sock.sendMessage(msg.key.remoteJid,{text:`🧮 ${eval(args.join(" "))}`}) }catch{ sock.sendMessage(msg.key.remoteJid,{text:'❌ Error'}) } },
        reverse: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:args.join("").split("").reverse().join("")}),
        upper: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:args.join(" ").toUpperCase()}),
        lower: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:args.join(" ").toLowerCase()}),
        length: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:args.join(" ").length.toString()}),
        random: (sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:`🎲 ${Math.floor(Math.random()*50)+1}`}),
        roll100: (sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:`🎲 ${Math.floor(Math.random()*100)+1}`}),
        random1000: (sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:`🎲 ${Math.floor(Math.random()*1000)+1}`}),
        binary: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:Number(args[0]).toString(2)}),
        hex: (sock,msg,args)=>sock.sendMessage(msg.key.remoteJid,{text:Number(args[0]).toString(16)})
    },
    fun: {
        joke:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"😂 Why dev broke? Too many bugs!"}),
        quote:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"💡 Keep pushing forward!"}),
        fact:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"🌍 The internet never sleeps."}),
        compliment:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"🔥 You’re powerful!"}),
        roast:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"💀 Even WiFi is faster than you!"}),
        laugh:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"😂"}),
        cry:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"😭"}),
        love:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"❤️"}),
        angry:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"😡"}),
        bored:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"😴"}),
        dance:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"💃"}),
        sing:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"🎤"}),
        food:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"🍔"}),
        drink:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:"🥤"})
    },
    games: {
        guess:(sock,msg,args)=>{ const num=Math.floor(Math.random()*10)+1; const user=parseInt(args[0]); if(!user) return sock.sendMessage(msg.key.remoteJid,{text:"Guess 1-10"}); sock.sendMessage(msg.key.remoteJid,{text:user===num?"🎉 Correct!":`❌ It was ${num}`}); },
        guess50:(sock,msg,args)=>{ const num=Math.floor(Math.random()*50)+1; const user=parseInt(args[0]); if(!user) return sock.sendMessage(msg.key.remoteJid,{text:"Guess 1-50"}); sock.sendMessage(msg.key.remoteJid,{text:user===num?"🎉 Correct!":`❌ It was ${num}`}); },
        dice:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:`🎲 ${Math.floor(Math.random()*6)+1}`}),
        dice12:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:`🎲 ${Math.floor(Math.random()*12)+1}`}),
        coinflip:(sock,msg)=>sock.sendMessage(msg.key.remoteJid,{text:Math.random()>0.5?"Heads":"Tails"})
    },
    group: {
        delete: async(sock,msg)=>{
            const from=msg.key.remoteJid; const sender=msg.key.participant||msg.key.remoteJid;
            const key={ remoteJid:from, id:msg.message.extendedTextMessage?.contextInfo?.stanzaId, participant: msg.message.extendedTextMessage?.contextInfo?.participant };
            await sock.sendMessage(from,{delete:key});
            sock.sendMessage(from,{text:'🗑️ Message deleted!'});
        },
        antilink: async(sock,msg,args)=>{
            const from=msg.key.remoteJid; if(!groupSettings[from]) groupSettings[from]={};
            const action=args[0]?.toLowerCase();
            if(action==='warn'){ groupSettings[from].antilink='warn'; saveSettings(); sock.sendMessage(from,{text:'⚠️ Anti-link set to WARN'});}
            else if(action==='delete'){ groupSettings[from].antilink='delete'; saveSettings(); sock.sendMessage(from,{text:'🗑️ Anti-link set to DELETE'});}
            else if(action==='off'){ groupSettings[from].antilink='off'; saveSettings(); sock.sendMessage(from,{text:'❌ Anti-link OFF'});}
            else sock.sendMessage(from,{text:'Usage: .antilink [warn|delete|off]'});
        },
        antibadword: async(sock,msg,args)=>{
            const from=msg.key.remoteJid; if(!groupSettings[from]) groupSettings[from]={};
            const action=args[0]?.toLowerCase();
            if(action==='on'){ groupSettings[from].antibadword=true; saveSettings(); sock.sendMessage(from,{text:'⚠️ Anti-badword ON'});}
            else if(action==='off'){ groupSettings[from].antibadword=false; saveSettings(); sock.sendMessage(from,{text:'❌ Anti-badword OFF'});}
            else sock.sendMessage(from,{text:'Usage: .antibadword [on|off]'});
        }
    },
    owner: {
        eval: async(sock,msg,args)=>{
            const sender=msg.key.participant||msg.key.remoteJid;
            if(!owners.includes(sender.split('@')[0])) return;
            try{ const result = eval(args.join(' ')); sock.sendMessage(msg.key.remoteJid,{text:`✅ ${result}`}); }catch(e){ sock.sendMessage(msg.key.remoteJid,{text:`❌ ${e}`}); }
        }
    }
};

// ===== START BOT =====
async function startBot(){
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async(update)=>{
        const { connection, qr } = update;
        if(qr) lastQR = await qrcode.toDataURL(qr);
        if(connection==='open') console.log('✅ WhatsApp Connected');
    });

    sock.ev.on('messages.upsert', async({messages})=>{
        const msg=messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const text=msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const from=msg.key.remoteJid;

        // Group filters
        if(from.endsWith('@g.us') && groupSettings[from]){
            const textLower = text.toLowerCase();
            const linkRegex = /(https?:\/\/[^\s]+)/gi;
            const badWords = ['badword1','badword2','badword3'];
            const sender = msg.key.participant||msg.key.remoteJid;

            if(groupSettings[from].antilink && linkRegex.test(textLower)){
                if(groupSettings[from].antilink==='warn') await sock.sendMessage(from,{text:`⚠️ ${sender.split('@')[0]}, links not allowed!`});
                else if(groupSettings[from].antilink==='delete') await sock.sendMessage(from,{delete:msg.key});
                return;
            }

            if(groupSettings[from].antibadword){
                for(const word of badWords){
                    if(textLower.includes(word)){
                        await sock.sendMessage(from,{delete:msg.key});
                        await sock.sendMessage(from,{text:`⚠️ ${sender.split('@')[0]}, bad words not allowed!`});
                        return;
                    }
                }
            }
        }

        // Command handler
        if(!text.startsWith(prefix)) return;
        const [cmd,...args] = text.slice(prefix.length).split(' ');

        if(commands.general[cmd]) return commands.general[cmd](sock,msg,args);
        if(commands.tools[cmd]) return commands.tools[cmd](sock,msg,args);
        if(commands.fun[cmd]) return commands.fun[cmd](sock,msg,args);
        if(commands.games[cmd]) return commands.games[cmd](sock,msg,args);
        if(commands.group[cmd]) return commands.group[cmd](sock,msg,args);
        if(commands.owner[cmd]) return commands.owner[cmd](sock,msg,args);

        // Menu
        if(cmd==='menu'){
            const menuText = `
┌══════════════════┐
│ 💞 TEMPLE_MD BOT 💞 │
└══════════════════┘

⚡ GENERAL
💞 ping
💞 alive
💞 time
💞 date
💞 id

⚡ TOOLS
💞 calc
💞 reverse
💞 upper
💞 lower
💞 length
💞 random
💞 roll100
💞 random1000
💞 binary
💞 hex

⚡ FUN
💞 joke
💞 quote
💞 fact
💞 compliment
💞 roast
💞 laugh
💞 cry
💞 love
💞 angry
💞 bored
💞 dance
💞 sing
💞 food
💞 drink

⚡ GAMES
💞 guess
💞 guess50
💞 dice
💞 dice12
💞 coinflip

⚡ GROUP (Admin)
💞 delete
💞 antilink [warn|delete|off]
💞 antibadword [on|off]

⚡ OWNER
💞 eval

💞 Use ${prefix} before each command
`;
            return sock.sendMessage(from,{text:menuText});
        }
    });
}

startBot();
console.log('☠️ TEMPLE_MD BOT RUNNING PERFECTLY 💞');