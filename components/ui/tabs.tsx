// Tabs — controlled tab set with roving tabindex, no dependency.
// Props: tabs (required array of { value: string; label: string; content:
//   ReactNode }), value (string, required — active tab), onValueChange
//   ((value: string) => void, required), className merged via cn().
// Keyboard: ArrowRight/ArrowLeft move between tabs (wrapping), Home/End jump
//   to the first/last tab; only the active tab is in the tab order
//   (tabIndex 0 vs -1). Panels are role="tabpanel" wired with aria-labelledby.
// Usage:
//   const [tab, setTab] = useState("overview");
//   <Tabs tabs={[{ value: "overview", label: "Overview", content: <p>...</p> }]} value={tab} onValueChange={setTab} />
// Style rule: token classes only (border-line, bg-surface, bg-accent-soft for
//   the active tab, outline-accent focus ring).

"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.value === value);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    const nextTab = tabs[next];
    if (!nextTab) return;
    onValueChange(nextTab.value);
    listRef.current
      ?.querySelector<HTMLElement>(`[data-tab-value="${nextTab.value}"]`)
      ?.focus();
  };

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1 rounded-control border border-line bg-surface-alt p-1"
      >
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`tab-${tab.value}`}
              data-tab-value={tab.value}
              aria-selected={active}
              aria-controls={`tabpanel-${tab.value}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "min-h-9 rounded-control px-3 py-1.5 text-sm font-semibold",
                active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                "motion-safe:transition-colors",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) =>
        tab.value === value ? (
          <div
            key={tab.value}
            role="tabpanel"
            id={`tabpanel-${tab.value}`}
            aria-labelledby={`tab-${tab.value}`}
            tabIndex={0}
            className="mt-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {tab.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
