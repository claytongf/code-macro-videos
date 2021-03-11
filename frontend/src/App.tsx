import { Box, CssBaseline, MuiThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from './components/SnackbarProvider';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import Breadcrumbs from './components/Breadcrumbs';
import { Navbar } from './components/Navbar';
import AppRouter from './routes/AppRouter';
import theme from './theme';
import Spinner from './components/Spinner';
import LoadingContext from './components/loading/LoadingContext';

function App() {
  return (
      <React.Fragment>
          <LoadingContext.Provider value={true}>
          <MuiThemeProvider theme={theme}>
            <SnackbarProvider>
                <CssBaseline/>
                <BrowserRouter>
                    <Spinner/>
                    <Navbar/>
                    <Box paddingTop={'70px'}>
                        <Breadcrumbs/>
                        <AppRouter/>
                    </Box>
                </BrowserRouter>
            </SnackbarProvider>
          </MuiThemeProvider>
          </LoadingContext.Provider>
      </React.Fragment>
  );
}

export default App;
