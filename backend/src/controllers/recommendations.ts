import type { Request, Response } from 'express';
import { query } from '../db/index.js';
import NodeCache from 'node-cache';

const recommendationsCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const recommendationsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'recommendations';

        const cachedData = recommendationsCache.get(cacheKey);
        if (cachedData) {
            console.log('Serving recommendations from CACHE');
            res.json({ success: true, data: cachedData });
            return;
        }

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

        const inactiveAccountsQuery = `
            SELECT COUNT(*)::int as count
            FROM (
                SELECT a.account_id
                FROM accounts a
                LEFT JOIN deals d ON a.account_id = d.account_id
                LEFT JOIN activities act ON d.deal_id = act.deal_id
                GROUP BY a.account_id
                HAVING MAX(act.timestamp) < NOW() - INTERVAL '30 days' OR MAX(act.timestamp) IS NULL
            ) as inactive_accounts;
        `;

        const lateStageInactiveDealsQuery = `
            SELECT COUNT(*)::int as count
            FROM (
                SELECT d.deal_id
                FROM deals d
                LEFT JOIN activities act ON d.deal_id = act.deal_id
                WHERE d.stage IN (3, 4) AND d.closed_at IS NULL
                GROUP BY d.deal_id
                HAVING MAX(act.timestamp) < NOW() - INTERVAL '14 days' OR MAX(act.timestamp) IS NULL
            ) as inactive_late_stage;
        `;

        const [
            stuckDealsResult,
            repWinRateResult,
            inactiveAccountsResult,
            lateStageInactiveDealsResult
        ] = await Promise.all([
            query(stuckDealsQuery),
            query(repWinRateQuery),
            query(inactiveAccountsQuery),
            query(lateStageInactiveDealsQuery)
        ]);

        const recommendations: Array<{ id: string; text: string; data?: any }> = [];

        if (stuckDealsResult.rows.length > 0) {
            const row = stuckDealsResult.rows[0];
            const segmentMap: Record<number, string> = { 1: 'SMB', 2: 'Mid-Market', 3: 'Enterprise' };
            const segmentName = segmentMap[row.segment] || 'Unknown';
            if (row.count > 0) {
                recommendations.push({
                    id: 'aging_deals',
                    text: `Focus on aging deals in ${segmentName} segment (${row.count} open > 30 days)`,
                    data: row
                });
            }
        }

        if (repWinRateResult.rows.length > 0) {
            const row = repWinRateResult.rows[0];
            recommendations.push({
                id: 'coach_rep',
                text: `Coach ${row.name} to improve win rate (${Math.round(row.win_rate)}%)`,
                data: row
            });
        }

        if (inactiveAccountsResult.rows.length > 0) {
            const row = inactiveAccountsResult.rows[0];
            if (row.count > 0) {
                recommendations.push({
                    id: 'inactive_accounts',
                    text: `Increase outreach to ${row.count} inactive accounts (no activity in 30 days)`,
                    data: row
                });
            }
        }

        if (lateStageInactiveDealsResult.rows.length > 0) {
            const row = lateStageInactiveDealsResult.rows[0];
            if (row.count > 0) {
                recommendations.push({
                    id: 'late_stage_inactive',
                    text: `Re-engage ${row.count} late-stage deals with no activity in 14 days`,
                    data: row
                });
            }
        }

        if (recommendations.length === 0) {
            recommendations.push(
                { id: 'pipeline_review', text: 'Review pipeline coverage by segment to spot gaps' },
                { id: 'rep_coaching', text: 'Run a quick win/loss review and share best practices' },
                { id: 'activity_push', text: 'Increase outreach on accounts without recent touchpoints' }
            );
        }

        const limited = recommendations.slice(0, 5);

        recommendationsCache.set(cacheKey, limited);
        console.log('Serving recommendations from DB');

        res.json({
            success: true,
            data: limited
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};
