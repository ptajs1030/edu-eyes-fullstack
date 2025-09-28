import{j as t}from"./app-DwG0dwHx.js";import{c as p}from"./createLucideIcon-D0Ky7wV0.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]],m=p("ArrowDownUp",d);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],j=p("ArrowDown",y);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],k=p("ArrowUp",g),b=({column:o,sortColumn:s,sortDirection:n,onSortChange:a,children:i})=>{const r=o===s,c={className:"w-4 h-4 text-gray-800 opacity-100",strokeWidth:1.8},l={className:"w-4 h-4 text-gray-800 opacity-70 group-hover:opacity-100 transition-opacity",strokeWidth:1};return t.jsxs("div",{className:"flex items-center",onClick:()=>a(o),children:[t.jsx("span",{children:i}),t.jsx("span",{className:"ml-2 flex-none",children:r?n==="asc"?t.jsx(j,{...c}):t.jsx(k,{...c}):t.jsx(m,{...l})})]})};function N({headers:o,data:s,sortColumn:n,sortDirection:a,onSort:i,onSelectAll:r,selectedIds:c,rowRender:l,emptyMessage:h="No data found."}){return t.jsxs("table",{className:"w-full border-collapse rounded-lg bg-white text-black shadow-sm",children:[t.jsx("thead",{children:t.jsxs("tr",{className:"border-b bg-gray-100 text-gray-800 ",children:[r&&t.jsx("th",{className:"p-4 text-start",children:t.jsx("input",{type:"checkbox",onChange:e=>r(e.target.checked),checked:c&&s.length>0&&c.length===s.length})}),o.map(e=>t.jsx("th",{className:"p-4 text-sm font-semibold cursor-pointer group text-start",children:e.sortable?t.jsx(b,{column:e.key,sortColumn:n,sortDirection:a,onSortChange:i,children:e.label}):t.jsx("span",{children:e.label})},e.key))]})}),t.jsx("tbody",{children:s.length>0?s.map((e,x)=>l(e,x)):t.jsx("tr",{children:t.jsx("td",{colSpan:o.length+(r?1:0),className:"p-4 text-center text-gray-600",children:h})})})]})}export{N as T};
