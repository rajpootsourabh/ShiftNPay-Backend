/* import { configureStore } from "@reduxjs/toolkit"
import userReducer from './userSlice'

const store = configureStore({
    reducer: {
        user: userReducer
    }
})

export default store */
// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
// import userReducer from '../features/user/userSlice';
import userReducer from './userSlice'

const store = configureStore({
    reducer: {
        user: userReducer,
    },
});

export default store;
