import type { Request, Response } from 'express';
import { query } from '../db/index.js';
import NodeCache from 'node-cache';

const driverCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

export const driversController = async (req: Request, res: Response): Promise<void> => {
    try {
        const quarter = req.query.quarter as string;
        const year = (req.query.year as string) || '2025';
        const cacheKey = `drivers_${year}_${quarter}`;

        // Check Cache
        const cachedData = driverCache.get(cacheKey);
        if (cachedData) {
            console.log(`Serving drivers for Q${quarter} ${year} from CACHE`);
            res.json({ success: true, data: cachedData });
            return;
        }

        let startDate = '';
        let endDate = '';
        
        // Previous Quarter Logic
        let prevStartDate = '';
        let prevEndDate = '';

        if(quarter === '1') {
            startDate = `${year}-01-01`; endDate = `${year}-03-31`;
            const prevYear = (parseInt(year) - 1).toString();
            prevStartDate = `${prevYear}-10-01`; prevEndDate = `${prevYear}-12-31`;
        } else if(quarter === '2') {
            startDate = `${year}-04-01`; endDate = `${year}-06-30`;
            prevStartDate = `${year}-01-01`; prevEndDate = `${year}-03-31`;
        } else if(quarter === '3') {
            startDate = `${year}-07-01`; endDate = `${year}-09-30`;
            prevStartDate = `${year}-04-01`; prevEndDate = `${year}-06-30`;
        } else {
            startDate = `${year}-10-01`; endDate = `${year}-12-31`;
            prevStartDate = `${year}-07-01`; prevEndDate = `${year}-09-30`;
        } 

        // Execute queries for BOTH quarters in parallel
        const [
            wonCurrent, lostCurrent, avgCurrent, cycleCurrent, pipeCurrent,
            wonPrev, lostPrev, avgPrev, cyclePrev, pipePrev
        ] = await Promise.all([
            // --- Current Quarter ---
            query(`SELECT COUNT(*) as count FROM deals WHERE stage = 1 AND closed_at BETWEEN '${startDate}' AND '${endDate}'`),
            query(`SELECT COUNT(*) as count FROM deals WHERE stage = 2 AND closed_at BETWEEN '${startDate}' AND '${endDate}'`),
            query(`SELECT COALESCE(AVG(amount), 0) as avg_size FROM deals WHERE stage = 1 AND closed_at BETWEEN '${startDate}' AND '${endDate}'`),
            query(`SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at::timestamp - created_at))/86400), 0) as avg_days FROM deals WHERE closed_at BETWEEN '${startDate}' AND '${endDate}'`),
            query(`SELECT COALESCE(SUM(amount), 0) as pipeline_value FROM deals WHERE created_at <= '${endDate}' AND (closed_at IS NULL OR closed_at > '${endDate}')`),

            // --- Previous Quarter ---
            query(`SELECT COUNT(*) as count FROM deals WHERE stage = 1 AND closed_at BETWEEN '${prevStartDate}' AND '${prevEndDate}'`),
            query(`SELECT COUNT(*) as count FROM deals WHERE stage = 2 AND closed_at BETWEEN '${prevStartDate}' AND '${prevEndDate}'`),
            query(`SELECT COALESCE(AVG(amount), 0) as avg_size FROM deals WHERE stage = 1 AND closed_at BETWEEN '${prevStartDate}' AND '${prevEndDate}'`),
            query(`SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (closed_at::timestamp - created_at))/86400), 0) as avg_days FROM deals WHERE closed_at BETWEEN '${prevStartDate}' AND '${prevEndDate}'`),
            query(`SELECT COALESCE(SUM(amount), 0) as pipeline_value FROM deals WHERE created_at <= '${prevEndDate}' AND (closed_at IS NULL OR closed_at > '${prevEndDate}')`)
        ]);

        // Helper to process metrics
        const processMetrics = (wonRes: any, lostRes: any, avgRes: any, cycleRes: any, pipeRes: any) => {
            const won = Number(wonRes.rows[0].count || 0);
            const lost = Number(lostRes.rows[0].count || 0);
            const total = won + lost;
            return {
                winRate: total > 0 ? (won / total) * 100 : 0,
                avgDealSize: Number(avgRes.rows[0].avg_size || 0),
                avgSalesCycle: Number(cycleRes.rows[0].avg_days || 0),
                pipelineValue: Number(pipeRes.rows[0].pipeline_value || 0)
            };
        };

        const current = processMetrics(wonCurrent, lostCurrent, avgCurrent, cycleCurrent, pipeCurrent);
        const prev = processMetrics(wonPrev, lostPrev, avgPrev, cyclePrev, pipePrev);

        // Calculate Percentage Changes
        const calcChange = (curr: number, previous: number) => {
            if (previous === 0) return 0;
            return ((curr - previous) / previous) * 100;
        };
        
        // Special case for Sales Cycle: Variance in Days (Current - Previous), not percentage
        const cycleVariance = current.avgSalesCycle - prev.avgSalesCycle;

        const responseData = {
            winRate: { 
                value: Number(current.winRate.toFixed(2)), 
                change: Number(calcChange(current.winRate, prev.winRate).toFixed(2)) 
            },
            avgDealSize: { 
                value: Number(current.avgDealSize.toFixed(2)), 
                change: Number(calcChange(current.avgDealSize, prev.avgDealSize).toFixed(2)) 
            },
            avgSalesCycle: { 
                value: Number(current.avgSalesCycle.toFixed(1)), 
                change: Number(cycleVariance.toFixed(1)) 
            },
            pipelineValue: { 
                value: Number(current.pipelineValue.toFixed(2)), 
                change: Number(calcChange(current.pipelineValue, prev.pipelineValue).toFixed(2)) 
            },
            meta: {
                currentPeriod: { start: startDate, end: endDate },
                prevPeriod: { start: prevStartDate, end: prevEndDate }
            }
        };

        driverCache.set(cacheKey, responseData);
        console.log(`Serving drivers for Q${quarter} ${year} from DB`);

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};
