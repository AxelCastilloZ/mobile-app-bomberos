
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';


export type RootStackParamList = {
  Main: undefined;
  Emergency: undefined;
  Login: undefined;
};


export type TabParamList = {
  Home: undefined;
  Reports: undefined;
  Map: undefined;
  Admin: undefined;
  Profile: undefined;
};


export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;


export type CompositeNavigationProp = TabNavigationProp;