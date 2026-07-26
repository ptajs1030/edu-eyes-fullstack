import { ArrowDown, ArrowUp, ArrowDownUp } from 'lucide-react';

interface SortableTableHeaderProps {
  column: string;
  sortColumn: string;
  sortDirection: string;
  onSortChange: (column: string) => void;
  children: React.ReactNode;
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({ column, sortColumn, sortDirection, onSortChange, children }) => {
  const isActive = column === sortColumn;

  const activeIconProps = {
    className: 'w-3.5 h-3.5 text-slate-600',
    strokeWidth: 2,
  };
  const inactiveIconProps = {
    className: 'w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors',
    strokeWidth: 2,
  };

  return (
    <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => onSortChange(column)}>
      <span>{children}</span>
      <span className="flex-none">
        {isActive
          ? sortDirection === 'asc'
            ? <ArrowDown {...activeIconProps} />
            : <ArrowUp {...activeIconProps} />
          : <ArrowDownUp {...inactiveIconProps} />
        }
      </span>
    </div>
  );
};

export default SortableTableHeader;
