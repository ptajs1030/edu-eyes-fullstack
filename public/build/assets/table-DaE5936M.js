import{j as e}from"./app-CaMNOWat.js";import{c as l}from"./createLucideIcon-CNPavvpf.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]],m=l("ArrowDownUp",x);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],j=l("ArrowDown",y);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],u=l("ArrowUp",w),b=({column:s,sortColumn:r,sortDirection:n,onSortChange:a,children:i})=>{const t=s===r,c={className:"w-4 h-4 text-gray-800 opacity-100",strokeWidth:1.8},d={className:"w-4 h-4 text-gray-800 opacity-70 group-hover:opacity-100 transition-opacity",strokeWidth:1};return e.jsxs("div",{className:"flex items-center",onClick:()=>a(s),children:[e.jsx("span",{children:i}),e.jsx("span",{className:"ml-2 flex-none",children:t?n==="asc"?e.jsx(j,{...c}):e.jsx(u,{...c}):e.jsx(m,{...d})})]})};function N({headers:s,data:r,sortColumn:n,sortDirection:a,onSort:i,onSelectAll:t,selectedIds:c,rowRender:d,emptyMessage:p="No data found."}){return e.jsx("div",{className:"bg-white rounded-xl border border-border overflow-hidden shadow-sm",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-border",children:[t&&e.jsx("th",{className:"px-5 py-4 w-12",children:e.jsx("input",{type:"checkbox",onChange:o=>t(o.target.checked),checked:c&&r.length>0&&c.length===r.length,className:"w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"})}),s.map(o=>e.jsx("th",{className:"px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap",children:o.sortable?e.jsx(b,{column:o.key,sortColumn:n,sortDirection:a,onSortChange:i,children:o.label}):e.jsx("span",{children:o.label})},o.key))]})}),e.jsx("tbody",{className:"divide-y divide-slate-50",children:r.length>0?r.map((o,h)=>d(o,h)):e.jsx("tr",{children:e.jsx("td",{colSpan:s.length+(t?1:0),className:"px-5 py-12 text-center text-muted-foreground",children:p})})})]})})})}export{N as T};
