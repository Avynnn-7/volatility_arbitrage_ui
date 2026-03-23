import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { rootReducer } from './rootReducer'
import { volArbApi } from './api/volArbApi'

/**
 * Configure the Redux store
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(volArbApi.middleware),
  devTools: import.meta.env.MODE !== 'production',
})

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Export types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
