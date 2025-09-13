import React from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '../../utils/theme';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={theme.colors.primary}
        />
        <View style={styles.content}>
          {children}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
});