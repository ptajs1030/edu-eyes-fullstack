import{j as e}from"./app-_fKnajpV.js";import{c as i}from"./createLucideIcon-B9MnOiG9.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]],m=i("ArrowDownUp",h);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],b=i("ArrowDown",k);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],w=i("ArrowUp",j),u=({column:r,sortColumn:t,sortDirection:n,onSortChange:c,children:d})=>{const o=r===t,a={className:"w-3.5 h-3.5 text-slate-600",strokeWidth:2},l={className:"w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors",strokeWidth:2};return e.jsxs("div",{className:"flex items-center gap-1.5 cursor-pointer group",onClick:()=>c(r),children:[e.jsx("span",{children:d}),e.jsx("span",{className:"flex-none",children:o?n==="asc"?e.jsx(b,{...a}):e.jsx(w,{...a}):e.jsx(m,{...l})})]})};function v({headers:r,data:t,sortColumn:n,sortDirection:c,onSort:d,onSelectAll:o,selectedIds:a,rowRender:l,emptyMessage:p="No data found."}){return e.jsx("div",{className:"bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden shadow-sm",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-slate-100 dark:border-slate-700/50",children:[o&&e.jsx("th",{className:"px-5 py-4 w-12",children:e.jsx("input",{type:"checkbox",onChange:s=>o(s.target.checked),checked:a&&t.length>0&&a.length===t.length,className:"w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500/20 cursor-pointer bg-slate-50 dark:bg-slate-700"})}),r.map(s=>e.jsx("th",{className:"px-5 py-4 font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider whitespace-nowrap",children:s.sortable?e.jsx(u,{column:s.key,sortColumn:n,sortDirection:c,onSortChange:d,children:s.label}):e.jsx("span",{children:s.label})},s.key))]})}),e.jsx("tbody",{className:"divide-y divide-slate-50 dark:divide-slate-700/30",children:t.length>0?t.map((s,x)=>l(s,x)):e.jsx("tr",{children:e.jsx("td",{colSpan:r.length+(o?1:0),className:"px-5 py-12 text-center text-muted-foreground",children:p})})})]})})})}export{v as T};
