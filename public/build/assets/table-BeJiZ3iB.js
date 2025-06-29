import{j as e,m as x}from"./app-CgSwIAHK.js";import{c as p}from"./app-logo-icon-DGxN8R1F.js";function v({links:o}){return e.jsx("div",{className:"mt-4 flex justify-center gap-2",children:o.map((t,r)=>e.jsx("button",{onClick:()=>t.url&&x.visit(t.url),disabled:!t.url,className:`rounded px-3 py-1 text-sm hover:cursor-pointer ${t.active?"bg-blue-500 text-white":"bg-gray-100 text-black"}`,dangerouslySetInnerHTML:{__html:t.label}},r))})}/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"m21 8-4-4-4 4",key:"1c9v7m"}],["path",{d:"M17 4v16",key:"7dpous"}]],y=p("ArrowDownUp",m);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]],j=p("ArrowDown",g);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]],b=p("ArrowUp",u),w=({column:o,sortColumn:t,sortDirection:r,onSortChange:n,children:l})=>{const a=o===t,c={className:"w-4 h-4 text-gray-800 opacity-100",strokeWidth:1.8},i={className:"w-4 h-4 text-gray-800 opacity-70 group-hover:opacity-100 transition-opacity",strokeWidth:1};return e.jsxs("div",{className:"flex items-center justify-center",onClick:()=>n(o),children:[e.jsx("span",{children:l}),e.jsx("span",{className:"ml-2 flex-none",children:a?r==="asc"?e.jsx(j,{...c}):e.jsx(b,{...c}):e.jsx(y,{...i})})]})};function f({headers:o,data:t,sortColumn:r,sortDirection:n,onSort:l,onSelectAll:a,selectedIds:c,rowRender:i,emptyMessage:d="No data found."}){return e.jsxs("table",{className:"w-full border-collapse rounded-lg bg-white text-black shadow-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b bg-gray-100 text-gray-800",children:[a&&e.jsx("th",{className:"p-4",children:e.jsx("input",{type:"checkbox",onChange:s=>a(s.target.checked),checked:c&&t.length>0&&c.length===t.length})}),o.map(s=>e.jsx("th",{className:"p-4 text-sm font-semibold cursor-pointer group",children:s.sortable?e.jsx(w,{column:s.key,sortColumn:r,sortDirection:n,onSortChange:l,children:s.label}):e.jsx("span",{children:s.label})},s.key))]})}),e.jsx("tbody",{children:t.length>0?t.map((s,h)=>i(s,h)):e.jsx("tr",{children:e.jsx("td",{colSpan:o.length+(a?1:0),className:"p-4 text-center text-gray-600",children:d})})})]})}export{v as P,f as T};
