import type { ColumnDef } from '@tanstack/react-table';
import { cn, formatNumber, formatVolatility, formatCurrency, formatMaturity } from '@/lib/utils';
import { DataTable } from '@/components/data/data-table';
import { DataTableColumnHeader } from '@/components/data/data-table-column-header';
import { Badge } from '@/components/ui/badge';

interface OptionChainRow {
  strike: number;
  maturity: number;
  callBid: number | null;
  callAsk: number | null;
  callIV: number | null;
  callDelta: number | null;
  putBid: number | null;
  putAsk: number | null;
  putIV: number | null;
  putDelta: number | null;
}

interface OptionChainTableProps {
  data: OptionChainRow[];
  spotPrice: number;
  onRowClick?: (row: OptionChainRow) => void;
  className?: string;
}

export function OptionChainTable({
  data,
  spotPrice,
  onRowClick,
  className,
}: OptionChainTableProps) {
  const getMoneyness = (strike: number): 'itm' | 'atm' | 'otm' => {
    const ratio = strike / spotPrice;
    if (ratio < 0.98) return 'itm';
    if (ratio > 1.02) return 'otm';
    return 'atm';
  };

  const columns: ColumnDef<OptionChainRow>[] = [
    // Call side
    {
      accessorKey: 'callBid',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bid" />,
      cell: ({ row }) => {
        const value = row.getValue('callBid') as number | null;
        return value !== null ? (
          <span className="text-green-600 dark:text-green-400">{formatCurrency(value)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'callAsk',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ask" />,
      cell: ({ row }) => {
        const value = row.getValue('callAsk') as number | null;
        return value !== null ? (
          <span className="text-red-600 dark:text-red-400">{formatCurrency(value)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'callIV',
      header: ({ column }) => <DataTableColumnHeader column={column} title="IV" />,
      cell: ({ row }) => {
        const value = row.getValue('callIV') as number | null;
        return value !== null ? formatVolatility(value) : '-';
      },
    },
    {
      accessorKey: 'callDelta',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Δ" />,
      cell: ({ row }) => {
        const value = row.getValue('callDelta') as number | null;
        return value !== null ? formatNumber(value, 2) : '-';
      },
    },
    // Strike column (center)
    {
      accessorKey: 'strike',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Strike" className="text-center" />
      ),
      cell: ({ row }) => {
        const strike = row.getValue('strike') as number;
        const moneyness = getMoneyness(strike);
        return (
          <div className="flex justify-center">
            <Badge variant={moneyness} className="font-mono">
              {formatCurrency(strike)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'maturity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry" />,
      cell: ({ row }) => formatMaturity(row.getValue('maturity') as number),
    },
    // Put side
    {
      accessorKey: 'putDelta',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Δ" />,
      cell: ({ row }) => {
        const value = row.getValue('putDelta') as number | null;
        return value !== null ? formatNumber(value, 2) : '-';
      },
    },
    {
      accessorKey: 'putIV',
      header: ({ column }) => <DataTableColumnHeader column={column} title="IV" />,
      cell: ({ row }) => {
        const value = row.getValue('putIV') as number | null;
        return value !== null ? formatVolatility(value) : '-';
      },
    },
    {
      accessorKey: 'putBid',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Bid" />,
      cell: ({ row }) => {
        const value = row.getValue('putBid') as number | null;
        return value !== null ? (
          <span className="text-green-600 dark:text-green-400">{formatCurrency(value)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'putAsk',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ask" />,
      cell: ({ row }) => {
        const value = row.getValue('putAsk') as number | null;
        return value !== null ? (
          <span className="text-red-600 dark:text-red-400">{formatCurrency(value)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
  ];

  return (
    <div className={cn('', className)}>
      <div className="mb-4 flex justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2">
          <Badge variant="call">CALLS</Badge>
          <span className="text-muted-foreground">←</span>
        </div>
        <div className="font-medium">Spot: {formatCurrency(spotPrice)}</div>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">→</span>
          <Badge variant="put">PUTS</Badge>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="strike"
        searchPlaceholder="Search by strike..."
        exportFilename="option_chain"
        onRowClick={onRowClick}
      />
    </div>
  );
}
