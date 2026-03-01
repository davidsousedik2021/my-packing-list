import React from "react";
import type { Item } from "@/types";

type Props = {
  item: Item;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

function ItemRow({ item, onToggle, onRemove }: Props) {
  return (
    <li className={`row ${item.packed ? "row--checked" : ""}`}>
      <div className="row__left">
        <input
          className="check"
          type="checkbox"
          checked={item.packed}
          onChange={() => onToggle(item.id)}
          aria-label={item.packed ? "Mark as incomplete" : "Mark as complete"}
        />
        <span className="label">{item.label}</span>
      </div>

      <button
        type="button"
        className="remove"
        title="Remove"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.label}`}
      >
        ✕
      </button>
    </li>
  );
}

export default React.memo(ItemRow);