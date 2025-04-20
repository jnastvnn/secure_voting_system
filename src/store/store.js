import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pollsReducer from './slices/pollsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    polls: pollsReducer,
  },
});