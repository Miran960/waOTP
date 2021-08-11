const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

const readSession = async () => {
    try {
        const res = await client.query('SELECT * FROM wa_sessions ORDER BY session DESC LIMIT 1');
        if (res.rows.length) return res.rows[0].readSession;
        return '';
    }catch (err) {
        throw err;
    }
}

const saveSession = (session) => {
    client.query('INSERT INTO wa_sessions (session) VALUES ($1)', [session], (err, results) => {
        if (err) {
            console.error('Failed to save', err);
        }else {
            console.log('Session saved !');
        }
    });
}

const removeSession = () => {
    client.query('DELETE FROM wa_sessions', (err, results) => {
        if (err) {
            console.error('Failed to remove', err);
        }else {
            console.log('Session removed !');
        }
    });
}

module.exports = {
    readSession,
    saveSession,
    removeSession
}