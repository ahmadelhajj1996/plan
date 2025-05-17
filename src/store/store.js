import { configureStore } from '@reduxjs/toolkit';
import benim from './reducer'

// localStorage.js
export const loadState = () => {
  try {
    const serializedState = localStorage.getItem('appState');
    if (serializedState === null) {
      return undefined; // Let redux initialize with default state
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn('Failed to load state:', e);
    return undefined; // Let redux initialize with default state
  }
};

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('appState', serializedState);
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
};

const store = configureStore({
  reducer: {
    test: benim,
  },
  preloadedState: loadState(),
});

store.subscribe(() => {
  saveState(store.getState());
});

export default store;
