const { Client } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const socketIO = require('socket.io');
const http = require('http');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { phoneNumberFormatter } = require('./helpers/formatter');
const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
    console.log('ada');
}

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

const client = new Client({ 
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
          ],
        }, 
        session: sessionCfg 
    });

client.on('message', msg => {
    if (msg.body == '/ping') {
        msg.reply('pong');
    }else if (msg.body == '/help') {
        msg.reply('Kenapa lu ?');
    }
});

client.initialize();

//SOCET io
io.on('connection', function(socket) {
    socket.emit('message', 'Yeay Connecting...');

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code diterima, silahkan scan');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        sessionCfg=session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    client.on('auth_failure', function(session) {
        socket.emit('message', 'Auth failure, restarting...');
    });
    
    client.on('disconnected', (reason) => {
        socket.emit('message', 'Whatsapp is disconnected!');
        db.removeSession();
        client.destroy();
        client.initialize();
    });
}); // end SOCKET

const checkRegisterdNumber = async function(num) {
    const isRegistered = await client.isRegisteredUser(num);
    return isRegistered;
}
 
// Send Message OTP
app.post('/send-otp', [
    body('num').notEmpty(),
    body('otp').notEmpty(),
], async (req, res) => {
    const failed = validationResult(req).formatWith(({ msg }) => {
        return msg;
    });

    if (!failed.isEmpty()) {
        return res.status(422).json({
            status:false,
            message: failed.mapped()
        })
    }

    const num = phoneNumberFormatter(req.body.num);
    const otp = req.body.otp;

    const isRegisteredNumber = await checkRegisterdNumber(num);
    if(!isRegisteredNumber) {
        return res.status(422).json({
            status: "Gagal!",
            message: 'The Number is not registered whatsapp !!'
        });
    }

    client.sendMessage(num, otp).then(response => {
        res.status(200).json({
            status: "Terkirim!",
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: "Gagal!",
            response: err
        });
    })
});

server.listen(port, function() {
    console.log('App Running...*:' + port)
});