
import React from 'react';
import { AppNavigator } from './src/components/navigation/AppNavigator';
import { Layout } from './src/components/common/Layout';

export default function App() {
  console.log('App component loaded with navigation');
  
  return (
    <Layout>
      <AppNavigator />
    </Layout>
  );
}