import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applyTokens, TWEAKS_DEFAULT } from "../theme/tweaksConfig";

const TweaksContext = createContext(null);

function safePostSetKeys(edits) {
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits }, "*");
    }
  } catch {
    /* ignore */
  }
}

export function TweaksProvider({ children, initial = TWEAKS_DEFAULT }) {
  const [values, setValues] = useState(initial);

  const setTweak = useCallback((keyOrEdits, val) => {
    const edits =
      typeof keyOrEdits === "object" && keyOrEdits !== null
        ? keyOrEdits
        : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    safePostSetKeys(edits);
  }, []);

  useEffect(() => {
    applyTokens(values);
  }, [values]);

  const value = useMemo(() => ({ tweaks: values, setTweak }), [values, setTweak]);

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>;
}

export function useTweaksContext() {
  const ctx = useContext(TweaksContext);
  if (!ctx) {
    throw new Error("useTweaksContext must be used within TweaksProvider");
  }
  return ctx;
}
