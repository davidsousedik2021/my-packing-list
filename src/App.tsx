import { useState } from "react";
import ItemList from "@/components/item-list";
import ThemeToggle from "@/components/theme-toggle";

export default function App() {
  const [stats, setStats] = useState({ packed: 0, total: 0 });

  return (
    <div className="app">
      <div className="window">
        <div className="window__top">
          <div className="dots" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>

          <div />

          <div className="counter">
            {stats.packed} / {stats.total} items packed
          </div>
        </div>

        <div className="window__body">
          <ThemeToggle />
          <ItemList onStatsChange={(packed, total) => setStats({ packed, total })} />
        </div>
      </div>
    </div>
  );
}