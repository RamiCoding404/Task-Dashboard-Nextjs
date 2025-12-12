"use client";
import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import store from "@/store";

import { ReactQueryProvider } from "@/providers/QueryProvider";
import { hydrateAuth } from "@/store/authSlice";

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  useEffect(() => {
    try {
      dispatch(hydrateAuth());
    } catch {}
  }, [dispatch]);

  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ProvidersContent>{children}</ProvidersContent>
    </Provider>
  );
}
