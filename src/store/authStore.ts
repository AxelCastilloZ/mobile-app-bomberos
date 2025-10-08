import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { AuthState, MobileUser } from '../types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthStore extends AuthState {
  // Actions
  setAuth: (token: string, user: MobileUser) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<MobileUser>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Set auth (login/register)
  setAuth: async (token: string, user: MobileUser) => {
    try {
      // Save to SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      // Update state
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Clear SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      // Clear state
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  },

  // Load session (on app start)
  loadSession: async () => {
    try {
      set({ isLoading: true });

      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as MobileUser;
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading session:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Set loading
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Update user (for completing profile)
  updateUser: async (userData: Partial<MobileUser>) => {
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error('No user to update');

      const updatedUser = { ...currentUser, ...userData };

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));

      set({ user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
}));
