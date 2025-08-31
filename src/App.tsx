import React, { useState } from 'react';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Paper,
  Tabs,
  Tab,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  useTheme
} from '@mui/material';
import { 
  CameraAlt, 
  School, 
  List, 
  Storage 
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ImageUpload from './components/ImageUpload';
import StudyMode from './components/StudyMode';
import WordList from './components/WordList';
import FirebaseStatus from './components/FirebaseStatus';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const currentTheme = useTheme();
  const isMobile = useMediaQuery(currentTheme.breakpoints.down('md'));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const navigationItems = [
    { label: "単語帳登録", icon: <CameraAlt />, component: <ImageUpload /> },
    { label: "学習モード", icon: <School />, component: <StudyMode /> },
    { label: "単語一覧", icon: <List />, component: <WordList /> },
    { label: "設定", icon: <Storage />, component: <FirebaseStatus /> }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        flexGrow: 1, 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              component="div" 
              sx={{ flexGrow: 1 }}
            >
              📚 英単語学習アプリ
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container 
            maxWidth="lg" 
            sx={{ 
              mt: isMobile ? 1 : 2,
              px: isMobile ? 1 : 2,
              pb: isMobile ? 10 : 2
            }}
          >
            {!isMobile ? (
              <Paper sx={{ width: '100%' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="navigation tabs"
                  centered
                  variant="fullWidth"
                >
                  {navigationItems.map((item, index) => (
                    <Tab 
                      key={index}
                      label={item.label}
                      icon={item.icon}
                      iconPosition="start"
                      sx={{ minHeight: 64 }}
                    />
                  ))}
                </Tabs>
                
                {navigationItems.map((item, index) => (
                  <TabPanel key={index} value={tabValue} index={index}>
                    {item.component}
                  </TabPanel>
                ))}
              </Paper>
            ) : (
              <Box sx={{ mt: 1 }}>
                {navigationItems[tabValue].component}
              </Box>
            )}
          </Container>
        </Box>

        {isMobile && (
          <Paper 
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} 
            elevation={3}
          >
            <BottomNavigation
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              showLabels
            >
              {navigationItems.map((item, index) => (
                <BottomNavigationAction
                  key={index}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App
