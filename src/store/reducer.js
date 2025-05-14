import { createSlice } from '@reduxjs/toolkit';


const initialState = {
  value: 0,
  language: "en",
  auth : 0 ,     
  current : new Date().getMonth()
};

const benim = createSlice({
  name: 'benim',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    reset: (state) => {
      state.value = 0;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setCurrent: (state, action) => {
      state.current = action.payload;
    },
    authenticated: (state) => {
      state.auth = 1; 
    },
    loggedOut:(state) => 
    {
      state.auth = 0;
    },


  },
});



export const { increment, decrement, reset, setLanguage , setCurrent  , authenticated , loggedOut } = benim.actions;
export default benim.reducer;

