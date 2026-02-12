import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/lib/hooks";
import ResetButton from "./reset-button";
import type { Item } from "@/types";
import { SEED } from "@/seed";

type SortKey = "default" | "alpha" | "packed" | "unpacked";

const sortItems = (items: Item[], sortBy: SortKey) => {
  switch (sortBy) {
    case "alpha":
      return [...items].sort((a, b) => a.label.localeCompare(b.label));
    case "packed":
      return [...items].sort((a, b) => Number(b.packed) - Number(a.packed));
    case "unpacked":
      return [...items].sort((a, b) => Number(a.packed) - Number(b.packed));
    default:
      return items;
  }
};

const makeId = () => Math.random().toString(36).slice(2, 9);

// ✅ runtime validator for Item[]
const isItemArray = (v: unknown): v is Item[] =>
  Array.isArray(v) &&
  v.every(
    (x) =>
      x &&
      typeof x === "object" &&
      typeof (x as any).id === "string" &&
      typeof (x as any).label === "string" &&
      typeof (x as any).packed === "boolean"
  );

export default function ItemList({
  onStatsChange,
}: {
  onStatsChange?: (packed: number, total: number) => void;
}) {
  // ✅ IMPORTANT: keep version so old values don’t break the app
  const [items, setItems, clearItems] = useLocalStorage<Item[]>(
    "items",
    () => SEED,
    { version: "1", validate: isItemArray }
  );

  const [draft, setDraft] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const inputRef = useRef<HTMLInputElement>(null);

  const packedCount = useMemo(() => items.filter((i) => i.packed).length, [items]);
  const total = items.length;
  const sorted = useMemo(() => sortItems(items, sortBy), [items, sortBy]);

  useEffect(() => {
    onStatsChange?.(packedCount, total);
  }, [packedCount, total, onStatsChange]);

  const addItem = () => {
    const label = draft.trim();
    if (!label) return;

    setItems((prev) => [{ id: makeId(), label, packed: false }, ...prev]);
    setDraft("");
    inputRef.current?.focus();
  };

  const togglePacked = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, packed: !i.packed } : i)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const markAll = (packed: boolean) =>
    setItems((prev) => prev.map((i) => (i.packed === packed ? i : { ...i, packed })));

  const removeAll = () => setItems([]);
  const resetToInitial = () => clearItems();

  return (
    <>
      {/* LEFT PANEL */}
      <section className="panel">
        <div className="panel__section toolbar">
          <div className="counter">
            <strong>{packedCount}</strong> / <strong>{total}</strong> items packed
          </div>

          <div className="sort">
            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort items"
            >
              <option value="default">Sort by default</option>
              <option value="alpha">Sort by alphabetical</option>
              <option value="packed">Sort by packed first</option>
              <option value="unpacked">Sort by unpacked first</option>
            </select>
          </div>
        </div>

        <ul className="list">
          {sorted.map((item) => (
            <li key={item.id} className={`row ${item.packed ? "row--checked" : ""}`}>
              <div className="row__left">
                <input
                  className="check"
                  type="checkbox"
                  checked={item.packed}
                  onChange={() => togglePacked(item.id)}
                  aria-label={item.packed ? "Mark as incomplete" : "Mark as complete"}
                />
                <span className="label">{item.label}</span>
              </div>

              <button
                type="button"
                className="remove"
                title="Remove"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.label}`}
              >
                ✕
              </button>
            </li>
          ))}

          {sorted.length === 0 && (
            <li className="row">
              <span className="label" style={{ color: "var(--text-muted)" }}>
                No items yet.
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* RIGHT PANEL */}
      <aside className="panel">
        <div className="panel__section">
          <div className="form">
            <input
              ref={inputRef}
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Type an item…"
              aria-label="New item"
            />
            <button type="button" className="btn btn-primary" onClick={addItem}>
              Add to list
            </button>
          </div>
        </div>

        <div className="panel__section actions">
          <button className="btn btn-primary" onClick={() => markAll(true)}>
            Mark all as complete
          </button>
          <button className="btn btn-primary" onClick={() => markAll(false)}>
            Mark all as incomplete
          </button>
          <ResetButton onReset={resetToInitial}>Reset to initial</ResetButton>
          <button className="btn btn-primary" onClick={removeAll}>
            Remove all items
          </button>
        </div>
      </aside>
    </>
  );
}
