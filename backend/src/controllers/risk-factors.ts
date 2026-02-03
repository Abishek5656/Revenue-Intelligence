import type { Request, Response } from 'express';
import { query } from '../db/index.js';
import NodeCache from 'node-cache';

export const riskFactorsController = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Stuck Deals: Open deals > 30 days old, grouped by segment
        const stuckDealsQuery = `
            SELECT COUNT(*)::int as count, acc.segment 
            FROM deals as ds 
            INNER JOIN accounts as acc ON acc.account_id = ds.account_id
            WHERE ds.closed_at IS NULL 
            AND ds.created_at < NOW() - INTERVAL '30 days'
            GROUP BY acc.segment
            ORDER BY count DESC
            LIMIT 1;
        `;

        // 2. Rep Win Rate: (Won / (Won + Lost)) * 100
        const repWinRateQuery = `
            SELECT r.name, 
                CAST(COUNT(CASE WHEN d.stage = 1 THEN 1 END) AS FLOAT) / 
                NULLIF(COUNT(CASE WHEN d.stage IN (1, 2) THEN 1 END), 0) * 100 as win_rate
            FROM reps r
            JOIN deals d ON r.rep_id = d.rep_id
            GROUP BY r.name
            HAVING COUNT(CASE WHEN d.stage IN (1, 2) THEN 1 END) >= 5
            ORDER BY win_rate ASC
            LIMIT 1;
        `;

        // 3. Inactive Accounts: No activity in last 30 days
        // We look for accounts where the most recent activity is older than 30 days OR there are no activities.
        const inactiveAccountsQuery = `
           SELECT COUNT(*)::int as count
            FROM accounts a
            LEFT JOIN deals d ON a.account_id = d.account_id
            LEFT JOIN activities act ON d.deal_id = act.deal_id
            GROUP BY a.account_id
            HAVING MAX(act.timestamp) < NOW() - INTERVAL '30 days' OR MAX(act.timestamp) IS NULL
        `;

        const [stuckDealsResult, repWinRateResult, inactiveAccountsResult] = await Promise.all([
            query(stuckDealsQuery),
            query(repWinRateQuery),
            query(inactiveAccountsQuery)
        ]);

        const risks = [];

        // Process Stuck Deals
        if (stuckDealsResult.rows.length > 0) {
            const row = stuckDealsResult.rows[0];
            const segmentMap: Record<number, string> = { 1: 'SMB', 2: 'Mid-Market', 3: 'Enterprise' };
            const segmentName = segmentMap[row.segment] || 'Unknown';
            risks.push({
                type: 'stuck_deals',
                text: `${row.count} ${segmentName} deals stuck over 30 days`,
                data: row
            });
        }

        // Process Low Win Rate
        if (repWinRateResult.rows.length > 0) {
            const row = repWinRateResult.rows[0];
            risks.push({
                type: 'low_win_rate',
                text: `Rep ${row.name} - Win Rate: ${Math.round(row.win_rate)}%`,
                data: row
            });
        }

        // Process Inactive Accounts
        // inactiveAccountsQuery returns a row per account. We need to sum them up.
        const inactiveCount = inactiveAccountsResult.rows.length;
        if (inactiveCount > 0) {
            risks.push({
                type: 'inactive_accounts',
                text: `${inactiveCount} Accounts with no recent activity`,
                data: { count: inactiveCount }
            });
        }

        res.json({
            success: true,
            data: risks
        });
    } catch (error) {
        console.error('Error fetching risk factors:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};
