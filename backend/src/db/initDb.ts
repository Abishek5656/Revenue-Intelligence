import fs from 'fs';
import path from 'path';
import { query, getClient } from './index.js'; // Ensure extension is .js for local ESM if not handled by bundler, but tsx handles .ts. 
// Actually with tsx we can import from './index' usually, but let's stick to standard node ESM or just './index' given tsx.

// Reading the SQL file
const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const initDb = async () => {
  console.log('Initializing database...');
  try {
    // We can use the 'query' function from db/index.ts
    // but splitting by ';' might be safer if the driver doesn't support multiple queries in one go.
    // However, pg usually supports multiple statements if passed as a single string.
    
    await query(schemaSql);
    console.log('Database tables created successfully!');
  } catch (err) {
    console.error('Error creating database tables:', err);
    process.exit(1);
  }
};

initDb();
