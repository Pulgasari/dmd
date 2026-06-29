// @dmd/worker/mod.ts

import { compileDMD } from "@dmd/core";

// Dieser Code läuft im Kontext des Web Workers
self.onmessage = (event: MessageEvent) => {
  const { dmdString } = event.data;
  
  if (typeof dmdString !== "string") {
    self.postMessage({ error: "Input must be a string." });
    return;
  }

  try {
    const htmlOrMd = compileDMD(dmdString);
    self.postMessage({ result: htmlOrMd });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
