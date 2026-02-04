import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, 
  IconButton, Button, ButtonGroup, AppBar, Toolbar, Badge,
  Divider, List, ListItem, ListItemIcon, ListItemText, Grid
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import TrendChart from './TrendChart';
import Sparkline from './Sparkline';
import { 
  fetchSummary, fetchDrivers, fetchRiskFactors, fetchRecommendations, fetchTrend,
  type SummaryData, type DriversData, type RiskFactor, type Recommendation, type TrendDataPoint 
} from '../api';

const Dashboard: React.FC = () => {
  const [quarter, setQuarter] = useState('1');
  const [year] = useState('2025');
  
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [drivers, setDrivers] = useState<DriversData | null>(null);
  const [risks, setRisks] = useState<RiskFactor[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const s = await fetchSummary(quarter, year);
        setSummary(s);
        
        const d = await fetchDrivers(quarter, year);
        setDrivers(d);

        const r = await fetchRiskFactors();
        setRisks(r);

        const rec = await fetchRecommendations();
        setRecommendations(rec);

        const t = await fetchTrend();
        setTrend(t);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };
    loadData();
  }, [quarter, year]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', pb: 4 }}>
      {/* 1. Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'primary.main' }}>
            SkyGeni
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        
        {/* 2. Summary Section */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #1E1E1E 0%, #252525 100%)' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">QTD Revenue</Typography>
                    <Typography variant="h4">{summary ? formatCurrency(summary.quarterlyRevenue) : '...'}</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'gray' }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Target</Typography>
                    <Typography variant="h5" color="textSecondary">{summary ? formatCurrency(summary.quarterlyTarget) : '...'}</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ bgcolor: 'gray' }} />
                  <Box>
                     <Typography variant="body2" color="textSecondary">Progress</Typography>
                     <Typography variant="h5" color={summary && summary.percentage >= 0 ? 'success.main' : 'error.main'}>
                       {summary ? `${summary.percentage > 0 ? '+' : ''}${summary.percentage}%` : '...'} to Goal
                     </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ mr: 2 }}>Quarter</Typography>
                <ButtonGroup variant="outlined" size="small">
                  {['1', '2', '3', '4'].map(q => (
                    <Button 
                      key={q} 
                      variant={quarter === q ? 'contained' : 'outlined'}
                      onClick={() => setQuarter(q)}
                    >
                      Q{q}
                    </Button>
                  ))}
                </ButtonGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 3. Main Grid */}
        <Grid container spacing={4}>
          
          {/* Column 1: Revenue Drivers */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Revenue Drivers</Typography>
                <Divider sx={{ mb: 2 }} />
                
                {drivers && (
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Metric 1 */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Pipeline Value</Typography>
                          <Typography variant="h6">{formatCurrency(drivers.pipelineValue.value)}</Typography>
                        </Box>
                        <Sparkline color="#00E5FF" trend="up" />
                      </Box>
                      
                      {/* Metric 2 */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Win Rate</Typography>
                          <Typography variant="h6">{drivers.winRate.value}%</Typography>
                        </Box>
                        <Sparkline color="#FF5252" trend="down" />
                      </Box>
                      
                      {/* Metric 3 */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Avg Deal Size</Typography>
                          <Typography variant="h6">{formatCurrency(drivers.avgDealSize.value)}</Typography>
                        </Box>
                        <Sparkline color="#7C4DFF" trend="up" />
                      </Box>

                      {/* Metric 4 */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Sales Cycle</Typography>
                          <Typography variant="h6">{drivers.avgSalesCycle.value} Days</Typography>
                        </Box>
                        <Sparkline color="#FFAB40" trend="up" />
                      </Box>
                   </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Column 2: Top Risk Factors */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Top Risk Factors</Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {risks.map((risk, idx) => (
                    <ListItem key={idx} alignItems="flex-start">
                      <ListItemIcon>
                        <WarningAmberIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={risk.text} 
                        secondary={risk.type === 'stuck_deals' ? 'High Priority' : 'Attention Needed'}
                        primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                  {risks.length === 0 && <Typography color="textSecondary">No critical risks detected.</Typography>}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Column 3: Recommended Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
               <CardContent>
                 <Typography variant="h6" gutterBottom>Recommended Actions</Typography>
                 <Divider sx={{ mb: 2 }} />
                 <List>
                   {recommendations.map((rec, idx) => (
                     <ListItem key={idx}>
                       <ListItemIcon>
                         <CheckCircleOutlineIcon color="success" />
                       </ListItemIcon>
                        <ListItemText 
                          primary={rec.text} 
                        />
                     </ListItem>
                   ))}
                 </List>
               </CardContent>
            </Card>
          </Grid>

        </Grid>

        {/* 4. Revenue Trend */}
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue Trend (Last 6 Months)</Typography>
              <Box sx={{ height: 250, mt: 2 }}>
                <TrendChart data={trend} />
              </Box>
            </CardContent>
          </Card>
        </Box>

      </Container>
    </Box>
  );
};

export default Dashboard;
