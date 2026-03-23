import { combineReducers } from '@reduxjs/toolkit'
import { volArbApi } from './api/volArbApi'
import { surfaceReducer } from './slices/surfaceSlice'
import { arbitrageReducer } from './slices/arbitrageSlice'
import { wizardReducer } from './slices/wizardSlice'
import { uiReducer } from './slices/uiSlice'

/**
 * Root reducer combining all slices
 */
export const rootReducer = combineReducers({
  // API slice (RTK Query)
  [volArbApi.reducerPath]: volArbApi.reducer,
  
  // Feature slices
  surface: surfaceReducer,
  arbitrage: arbitrageReducer,
  wizard: wizardReducer,
  ui: uiReducer,
})
