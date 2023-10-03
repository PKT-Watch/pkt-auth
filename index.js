const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite') // Promisify sqlite3
const crypto = require("crypto");
const bitcoinMessage = require('bitcoinjs-message');

const PORT = process.env.PORT || 3001;
const app = express ();
app.use(cors());
app.use(express.json());

// ### DATABASE

let db;

async function createDatabase() {
    db = await sqlite.open({filename: './db/users.db', driver: sqlite3.Database});
    createTables(db);
}
createDatabase();

function createTables() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address text not null,
        message text,
        token text
    );`, ()  => {
        console.log('Table created');
    });
}

async function createUser(address) {
    let existingUser = await getUser(address);
    if (existingUser) return;

    await db.run('INSERT INTO user (address) values (?)', address);
    let user = await getUser(address);
    return user;
}

async function getUser(address) {
    return await db.get('SELECT * FROM user WHERE address = ?', address);
}

async function authenticateUser(token) {
    return await db.get('SELECT * FROM user WHERE token = ?', token);
}

async function createAuthMessage(user) {
    let authMessage =  crypto.randomBytes(20).toString('hex');
    await db.run('UPDATE user SET message = ? WHERE id = ?', [authMessage, user.id]);
    return authMessage;
}

async function createAccessToken(user) {
    let accessToken =  [8,4,4,4,12].map(n => crypto.randomBytes(n/2).toString("hex")).join("-");
    await db.run('UPDATE user SET token = ? WHERE id = ?', [accessToken, user.id]);
    return accessToken;
}

// ### API

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});

app.get('/register', async (req, res) => {
    if (!req.query.address) {
        res.status(400).send({ error: 'Address not set' });
        return;
    }

    let user = await createUser(req.query.address);

    if (typeof user == 'undefined') {
        console.log('Address is already registered');
        res.status(400).send({ error: 'Address is already registered' });
        return res;
    }
    res.send(user);
});

app.get('/request-login', async (req, res) => {
    if (!req.query.address) {
        res.status(400).send({ error: 'Address not set' });
        return;
    }

    let user = await getUser(req.query.address);

    if (typeof user == 'undefined') {
        console.log('User not found');
        res.status(400).send({ error: 'User not found' });
        return res;
    }

    let authMessage = await createAuthMessage(user);
    res.send(authMessage);
});

app.post('/verify-signature', async (req, res) => {
    if (!req.body.signature) {
        res.status(400).send({ error: 'Signature not set' });
        return;
    }
    if (!req.body.address) {
        res.status(400).send({ error: 'Address not set' });
        return;
    }

    let user = await getUser(req.body.address);

    if (typeof user == 'undefined') {
        console.log('User not found');
        res.status(400).send({ error: 'User not found' });
        return res;
    }

    let isSegwitAddress = (user.address.substring(0, 4) === 'pkt1');
    let verified = false;

    try {
        verified = bitcoinMessage.verify(user.message, user.address, req.body.signature, null, isSegwitAddress);
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: 'Invalid signature' });
        return;
    }
    
    if (verified) {
        let accessToken = await createAccessToken(user);
        res.send(accessToken);
        return;
    } else {
        res.status(401).send({ error: 'Authentication failed' });
    }
});

app.get('/authenticate', async (req, res) => {
    if (!req.query.token) {
        res.status(400).send({ error: 'Token not set' });
        return;
    }

    let user = await authenticateUser(req.query.token);

    if (typeof user == 'undefined') {
        console.log('User not found');
        res.status(401).send({ error: 'Authentication failed' });
        return res;
    }

    res.send(user);
});

// This end point can only be called by users with
// an Authorization header set.
app.get('/restricted', async (req, res) => {
    if (!req.header('Authorization')) {
        res.status(400).send({ error: 'Authorization header not set' });
        return;
    }

    let user = await authenticateUser(req.header('Authorization'));

    if (typeof user == 'undefined') {
        console.log('User not found');
        res.status(401).send({ error: 'Authentication failed' });
        return res;
    }

    res.send(user);
});