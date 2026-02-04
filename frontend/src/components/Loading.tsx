import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading: React.FC = () => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <CircularProgress color="primary" size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading Dashboard...
      </Typography>
    </Box>
  );
};

export default Loading;
