import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to validate session on startup
export const validateSession = createAsyncThunk(
  'auth/validateSession',
  async (_, { rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/validate-session`, {
        method: 'GET',
        credentials: 'include', // Include cookies
      });
      
      if (response.status === 401) {
        // Not authenticated, clear localStorage
        localStorage.removeItem('currentUser');
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Failed to validate session');
      }
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      // Clear localStorage on error
      localStorage.removeItem('currentUser');
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout to call the server
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        return rejectWithValue('Failed to logout');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Check for saved user info on startup
const getUserFromStorage = () => {
  try {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error('Failed to parse user from localStorage', error);
    return null;
  }
};

const initialState = {
  user: getUserFromStorage(),
  isAuthenticated: false, // Default to false until validated
  loading: true, // Start with loading true to indicate validation in progress
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
      // Store user info in localStorage for persistence (but not the token)
      localStorage.setItem('currentUser', JSON.stringify(action.payload));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear localStorage
      localStorage.removeItem('currentUser');
    },
    signupStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signupSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    signupFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle session validation
      .addCase(validateSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          localStorage.setItem('currentUser', JSON.stringify(action.payload));
        } else {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem('currentUser');
        }
      })
      .addCase(validateSession.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
        localStorage.removeItem('currentUser');
      })
      // Handle logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        localStorage.removeItem('currentUser');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Still clear user data even if server call fails
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('currentUser');
      });
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  signupStart,
  signupSuccess,
  signupFailure,
} = authSlice.actions;

export default authSlice.reducer;