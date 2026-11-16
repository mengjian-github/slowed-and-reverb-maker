"use client";

import { useMemo, useState } from "react";

// Platform floor (engine/src/dataset-search-floor.ts): the declared dataset-query
// capability as a working table filter. Re-emitted every build; do not edit.

type DatasetRow = { cells: string[]; status?: string; sourceUrl?: string };

export type DatasetSearchProps = {
  capabilityId: string;
  columns: string[];
  rows: DatasetRow[];
  searchColumns?: number[];
  statusFilter?: boolean;
  language?: string;
  caption?: string;
};

const STATUS_LABELS: Record<string, [string, string]> = {
  working: ["有效", "Current"],
  expired: ["已过期", "Expired"],
  unconfirmed: ["待核实", "Unconfirmed"],
};

function plainCell(value: unknown): string {
  return String(value ?? "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1");
}

export default function DatasetSearch(props: DatasetSearchProps) {
  const { capabilityId, columns, rows, searchColumns, statusFilter, language, caption } = props;
  const zh = String(language ?? "").trim().toLowerCase().startsWith("zh");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const statuses = useMemo(() => [...new Set(rows.map((row) => row.status).filter((value): value is string => Boolean(value)))], [rows]);
  const searchable = searchColumns && searchColumns.length ? searchColumns : columns.map((_, index) => index);
  const needle = query.trim().toLowerCase();
  const matches = rows.filter((row) => (!status || row.status === status)
    && (!needle || searchable.some((index) => plainCell(row.cells[index]).toLowerCase().includes(needle))));
  const statusLabel = (value: string) => (STATUS_LABELS[value] ? STATUS_LABELS[value][zh ? 0 : 1] : value);
  // A live filter always shows its current answer, so its state is "success":
  // with no data-state QA read "state=unknown", found no button, and failed the
  // surface on every copy page that carried it (Starter Feeding, 2026-10-28).
  return (
    <div className="dataset-search" data-capability={capabilityId} data-operation="dataset-query" data-state="success">
      <div className="dataset-search-controls">
        <label className="capability-field">
          <span className="capability-label">{zh ? "搜索" : "Search"}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={zh ? "输入关键词筛选表格" : "Type to filter the table"} />
        </label>
        {statusFilter && statuses.length > 1 ? (
          <label className="capability-field">
            <span className="capability-label">{zh ? "状态" : "Status"}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">{zh ? "全部" : "All"}</option>
              {statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
            </select>
          </label>
        ) : null}
        <output className="capability-output" data-tool-output aria-live="polite">
          {zh ? "共 " + matches.length + " 条" : matches.length + (matches.length === 1 ? " row" : " rows")}
        </output>
      </div>
      <table className="data-table" data-mobile-presentation="scroll">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {matches.map((row, rowIndex) => (
            <tr key={rowIndex} className={row.status ? "status-" + row.status : undefined}>
              {row.cells.map((cell, cellIndex) => (
                <td key={cellIndex} data-label={columns[cellIndex] || ""} data-status={row.status || undefined}>
                  {plainCell(cell)}
                  {cellIndex === 0 && row.sourceUrl ? <>{" "}<a className="row-source" href={row.sourceUrl} rel="nofollow noopener" target="_blank">{zh ? "来源" : "Source"}</a></> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {matches.length === 0 ? <p className="dataset-search-empty">{zh ? "没有匹配的行，换个关键词试试。" : "No rows match. Try another word."}</p> : null}
    </div>
  );
}
