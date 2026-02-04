import type { Request, Response } from 'express';
import { query } from '../db/index.js';
import NodeCache from 'node-cache';

const summaryCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const summaryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const quarter = req.query.quarter as string;
        const year = (req.query.year as string) || '2025';
        const cacheKey = `summary_${year}_${quarter}`;

        // Check Cache
        const cachedData = summaryCache.get(cacheKey);
        if (cachedData) {
            console.log(`Serving summary for Q${quarter} ${year} from CACHE`);
            res.json({
                success: true,
                data: cachedData
            });
            return;
        }

        // 1. Variables for Monthly Targets (Stored as "YYYY-MM" strings)
        let startMonth = '';
        let endMonth = '';

        // 2. Variables for Deals (Stored as DATE "YYYY-MM-DD")
        let startDate = '';
        let endDate = '';

        if(quarter === '1') {
            startMonth = `${year}-01`; endMonth = `${year}-03`;
            startDate = `${year}-01-01`; endDate = `${year}-03-31`;
        }  else 
        if(quarter === '2') {
            startMonth = `${year}-04`; endMonth = `${year}-06`;
            startDate = `${year}-04-01`; endDate = `${year}-06-30`;
        } 
         else 
        if(quarter === '3') {
            startMonth = `${year}-07`; endMonth = `${year}-09`;
            startDate = `${year}-07-01`; endDate = `${year}-09-30`;
        } 
        else {
            startMonth = `${year}-10`; endMonth = `${year}-12`;
            startDate = `${year}-10-01`; endDate = `${year}-12-31`;
        }  

        // Execute both queries in parallel to reduce response time
        const [revenueRes, dealsRes] = await Promise.all([
            // Query 1: Targets
            query(`
                SELECT COALESCE(SUM(target), 0) as quarterly_target 
                FROM monthly_targets  
                WHERE month BETWEEN '${startMonth}' AND '${endMonth}'
            `),
            // Query 2: Deals (Closed Won)
            query(`
                SELECT COALESCE(SUM(amount), 0) as quarterly_revenue 
                FROM deals  
                WHERE stage = 1 AND closed_at BETWEEN '${startDate}' AND '${endDate}'
            `)
        ]);

        const target = Number(revenueRes.rows[0].quarterly_target || 0);
        const actual = Number(dealsRes.rows[0].quarterly_revenue || 0);
        const percentage = target > 0 ? ((actual - target) / target) * 100 : 0;

        const responseData = {
            quarterlyTarget: target,
            quarterlyRevenue: actual,
            percentage: Number(percentage.toFixed(2))
        };

        // Set Cache
        summaryCache.set(cacheKey, responseData);
        console.log(`Serving summary for Q${quarter} ${year} from DB`);

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

export const trendController = async (req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'revenue_trend_6months';
        const cachedData = summaryCache.get(cacheKey);
        
        if (cachedData) {
             console.log('Serving revenue trend from CACHE');
             res.json({ success: true, data: cachedData });
             return;
        }

        // Query for last 6 months revenue grouped by month
        // Using Postgres date functions
        const trendQuery = `
            SELECT 
                TO_CHAR(closed_at, 'Mon') as month,
                EXTRACT(MONTH FROM closed_at) as month_num,
                EXTRACT(YEAR FROM closed_at) as year_num,
                SUM(amount) as revenue
            FROM deals
            WHERE stage = 1 
            AND closed_at >= NOW() - INTERVAL '6 months'
            GROUP BY 1, 2, 3
            ORDER BY year_num ASC, month_num ASC
        `;

        const result = await query(trendQuery);

        const data = result.rows.map(row => ({
            month: row.month,
            revenue: Number(row.revenue)
        }));

        summaryCache.set(cacheKey, data);
        console.log('Serving revenue trend from DB');

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Error fetching trend:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
