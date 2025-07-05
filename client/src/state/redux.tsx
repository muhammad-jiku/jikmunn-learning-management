'use client';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useRef } from 'react';
import {
  Provider,
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import storage from 'redux-persist/lib/storage';
import globalReducer from '.';
import { api } from './api';

/* REDUX PERSIST CONFIG */
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['global'], // Only persist global state
  blacklist: [api.reducerPath], // Don't persist API cache
};

/* REDUX STORE */
const rootReducer = combineReducers({
  global: globalReducer,
  [api.reducerPath]: api.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            'persist/PERSIST',
            'persist/REHYDRATE',
            'persist/PAUSE',
            'persist/PURGE',
            'persist/REGISTER',
            'persist/FLUSH',
            'api/executeMutation/pending',
            'api/executeMutation/fulfilled',
            'api/executeMutation/rejected',
          ],
          ignoredActionPaths: [
            'meta.arg.originalArgs.file',
            'meta.arg.originalArgs.formData',
            'payload.chapter.video',
            'meta.baseQueryMeta.request',
            'meta.baseQueryMeta.response',
          ],
          ignoredPaths: [
            'global.courseEditor.sections',
            'entities.videos.data',
            'meta.baseQueryMeta.request',
            'meta.baseQueryMeta.response',
          ],
        },
      }).concat(api.middleware),
  });
};

/* REDUX TYPES */
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/* PROVIDER */
export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    setupListeners(storeRef.current.dispatch);
  }
  const persistor = persistStore(storeRef.current);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
