import fs from 'fs';
import path from 'path';
import { query, pool } from './index.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data folder: backend/src/db -> backend/src -> backend -> .. -> data
const DATA_DIR = path.resolve(__dirname, '../../../data');

const clean = (val: any) => (typeof val === 'string' ? val.trim() : val);

const seed = async () => {
    try {
        console.log('Starting seed process...');
        console.log(`Reading data from: ${DATA_DIR}`);

        // Read Files
        const repsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reps.json'), 'utf8'));
        const accountsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'accounts.json'), 'utf8'));
        const dealsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'deals.json'), 'utf8'));
        const activitiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'activities.json'), 'utf8'));
        const targetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'targets.json'), 'utf8'));

        // Helper for batch processing
        const processBatch = async <T>(items: T[], fn: (item: T) => Promise<void>, batchSize = 50) => {
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                await Promise.all(batch.map(fn));
            }
        };

        // 1. Reps
        console.log(`Seeding ${repsData.length} reps...`);
        await processBatch(repsData, async (row: any) => {
            const id = clean(row.rep_id);
            if (id) {
                await query(
                    'INSERT INTO reps (rep_id, name) VALUES ($1, $2) ON CONFLICT (rep_id) DO NOTHING',
                    [id, clean(row.name)]
                );
            }
        });

        // 2. Accounts
        console.log(`Seeding ${accountsData.length} accounts...`);
        await processBatch(accountsData, async (row: any) => {
            const id = clean(row.account_id);
            if (id) {
                await query(
                    'INSERT INTO accounts (account_id, name, industry, segment) VALUES ($1, $2, $3, $4) ON CONFLICT (account_id) DO NOTHING',
                    [id, clean(row.name), clean(row.industry), clean(row.segment)]
                );
            }
        });
        
        // 3. Monthly Targets
        console.log(`Seeding ${targetsData.length} targets...`);
        await processBatch(targetsData, async (row: any) => {
             const month = clean(row.month);
            if (month) {
                await query(
                    'INSERT INTO monthly_targets (month, target) VALUES ($1, $2) ON CONFLICT (month) DO UPDATE SET target = EXCLUDED.target',
                    [month, row.target]
                );
            }
        });

        // 4. Deals
        console.log(`Seeding ${dealsData.length} deals...`);
        await processBatch(dealsData, async (row: any) => {
            const id = clean(row.deal_id);
            const accountId = clean(row.account_id);
            const repId = clean(row.rep_id);
            
            if (id) {
                await query(
                    `INSERT INTO deals (deal_id, account_id, rep_id, stage, amount, created_at, closed_at) 
                     VALUES ($1, $2, $3, $4, $5, ($6)::date, ($7)::date) 
                     ON CONFLICT (deal_id) DO NOTHING`,
                    [id, accountId, repId, clean(row.stage), row.amount, row.created_at, row.closed_at]
                );
            }
        });

        // 5. Activities
        console.log(`Seeding ${activitiesData.length} activities...`);
        await processBatch(activitiesData, async (row: any) => {
             const id = clean(row.activity_id);
             const dealId = clean(row.deal_id);

             if (id) {
                 await query(
                     `INSERT INTO activities (activity_id, deal_id, type, timestamp)
                      VALUES ($1, $2, $3, ($4)::timestamp)
                      ON CONFLICT (activity_id) DO NOTHING`,
                     [id, dealId, clean(row.type), row.timestamp]
                 );
             }
        });

        console.log('Seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await pool.end();
    }
};

seed();
