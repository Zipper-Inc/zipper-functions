'use client' 
import React from "react";
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";

export const LegedStateProvider = () => {
  enableReactTracking({ auto: true });

  return <React.Fragment />
}