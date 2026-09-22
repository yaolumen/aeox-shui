const Database = require('better-sqlite3');
const db = new Database('D:/codex/aeox-shui/data/qfl.db', { readonly: true });
const r = db.prepare("SELECT id, locale, ai_provider FROM reports ORDER BY created_at DESC LIMIT 5").all();
console.log(JSON.stringify(r, null, 2));
