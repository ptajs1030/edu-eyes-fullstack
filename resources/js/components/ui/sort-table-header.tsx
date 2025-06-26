import { ArrowDown, ArrowUp, ArrowDownUp } from 'lucide-react'; // Import ikon

interface SortableTableHeaderProps {
  column: string;
  sortColumn: string;
  sortDirection: string;
  onSortChange: (column: string) => void;
  children: React.ReactNode;
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({ column, sortColumn, sortDirection, onSortChange, children }) => {
const isActive = column === sortColumn

// className dan strokeWidth dinamis
  const activeIconProps = {
    className: 'w-4 h-4 text-gray-800 opacity-100',
    strokeWidth: 1.8,
  }
  const inactiveIconProps = {
    className: 'w-4 h-4 text-gray-800 opacity-70 group-hover:opacity-100 transition-opacity',
    strokeWidth: 1,
  }

  return (
    <div className="flex items-center justify-center" onClick={() => onSortChange(column)}>
      <span>{children}</span>
      <span className="ml-2 flex-none">
        {isActive
          ? sortDirection === 'asc'
            ? <ArrowDown   {...activeIconProps} />
            : <ArrowUp {...activeIconProps} />
          : <ArrowDownUp {...inactiveIconProps} />
        }
      </span>
    </div>
  )


}

export default SortableTableHeader;
