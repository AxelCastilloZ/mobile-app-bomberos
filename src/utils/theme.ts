import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#D32F2F',
    secondary: '#FFA726',
    error: '#FF1744',
    surface: '#FFFFFF',
    background: '#F5F5F5',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#212121',
    onBackground: '#212121',
  },
  roundness: 8,
};