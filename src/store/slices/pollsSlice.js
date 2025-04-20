import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  polls: [],
  loading: false,
  error: null,
  selectedPoll: null
};

export const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    fetchPollsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPollsSuccess: (state, action) => {
      state.loading = false;
      state.polls = action.payload;
      state.error = null;
    },
    fetchPollsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedPoll: (state, action) => {
      state.selectedPoll = action.payload;
    },
    createPollStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createPollSuccess: (state, action) => {
      state.loading = false;
      state.polls.push(action.payload);
      state.error = null;
    },
    createPollFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchPollsStart,
  fetchPollsSuccess,
  fetchPollsFailure,
  setSelectedPoll,
  createPollStart,
  createPollSuccess,
  createPollFailure,
} = pollsSlice.actions;

export default pollsSlice.reducer;