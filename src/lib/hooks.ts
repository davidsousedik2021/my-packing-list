import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type SetState<T> = Dispatch<SetStateAction<T>>;

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: {
    sync?: boolean; // cross-tab sync (default true)
    serialize?: (v: T) => string; // default JSON.stringify
    deserialize?: (s: string) => T; // default JSON.parse
    version?: string; // optional schema version to invalidate old values
    onError?: (err: unknown) => void;
    validate?: (value: unknown) => value is T; // optional runtime validation
  }
): [T, SetState<T>, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = (s: string) => JSON.parse(s) as T,
    sync = true,
    version,
    onError,
    validate,
  } = options ?? {};

  const keyRef = useRef(key);

  const getDefault = useMemo(() => {
    return () =>
      typeof initialValue === "function"
        ? (initialValue as () => T)()
        : initialValue;
  }, [initialValue]);

  const read = (k: string): T => {
    if (typeof window === "undefined") return getDefault();

    try {
      const raw = window.localStorage.getItem(k);
      if (raw == null) return getDefault();

      let value: unknown;

      if (version) {
        const wrapped = JSON.parse(raw) as { __v?: string; data?: unknown };
        if (wrapped?.__v !== version) {
          window.localStorage.removeItem(k);
          return getDefault();
        }
        value = wrapped.data;
      } else {
        value = deserialize(raw) as unknown;
      }

      // ✅ Runtime validation (if provided)
      if (validate && !validate(value)) {
        window.localStorage.removeItem(k);
        return getDefault();
      }

      // ✅ Generic-safe array guard: if default is array, value must be array
      const def = getDefault() as unknown;
      if (Array.isArray(def) && !Array.isArray(value)) {
        window.localStorage.removeItem(k);
        return getDefault();
      }

      return value as T;
    } catch (err) {
      onError?.(err);
      try {
        window.localStorage.removeItem(k);
      } catch {}
      return getDefault();
    }
  };

  const [value, setValue] = useState<T>(() => read(key));

  // Persist on change
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (version) {
        const wrapped = { __v: version, data: value };
        window.localStorage.setItem(keyRef.current, JSON.stringify(wrapped));
      } else {
        window.localStorage.setItem(keyRef.current, serialize(value));
      }
    } catch (err) {
      onError?.(err);
    }
  }, [value, serialize, version, onError]);

  // Cross-tab sync
  useEffect(() => {
    if (!sync || typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== keyRef.current) return;

      try {
        if (e.newValue == null) {
          setValue(getDefault());
          return;
        }

        let next: unknown;

        if (version) {
          const wrapped = JSON.parse(e.newValue) as { __v?: string; data?: unknown };
          next = wrapped?.__v === version ? wrapped.data : getDefault();
        } else {
          next = deserialize(e.newValue) as unknown;
        }

        if (validate && !validate(next)) {
          setValue(getDefault());
          return;
        }

        const def = getDefault() as unknown;
        if (Array.isArray(def) && !Array.isArray(next)) {
          setValue(getDefault());
          return;
        }

        setValue(next as T);
      } catch (err) {
        onError?.(err);
        setValue(getDefault());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [deserialize, sync, version, getDefault, onError, validate]);

  const clear = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(keyRef.current);
      }
    } catch (err) {
      onError?.(err);
    }
    setValue(getDefault());
  };

  return [value, setValue, clear];
}
