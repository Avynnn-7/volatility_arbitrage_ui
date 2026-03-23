import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '@/components/data/file-upload';
import { WizardNavigation } from '../WizardNavigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTable } from '@/components/data/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, FileSpreadsheet, Database } from 'lucide-react';
import { toast } from 'sonner';
import type { QuoteInput } from '@/types';
import { SAMPLE_QUOTES } from '@/mocks/mockData';

interface Step1Props {
  onComplete: (data: { parsedQuotes: QuoteInput[]; fileName: string }) => void;
  initialData?: QuoteInput[];
}

const REQUIRED_COLUMNS = ['strike', 'maturity', 'impliedVol'];
const OPTIONAL_COLUMNS = ['optionType', 'bid', 'ask', 'delta', 'gamma', 'vega', 'theta'];

// Column name variations for flexible parsing
const COLUMN_VARIATIONS: Record<string, string[]> = {
  strike: ['strike', 'k', 'strikeprice', 'strike_price'],
  maturity: ['maturity', 't', 'expiry', 'tte', 'time_to_expiry', 'tenor', 'years'],
  impliedVol: ['impliedvol', 'implied_vol', 'iv', 'vol', 'volatility', 'sigma'],
  optionType: ['optiontype', 'option_type', 'type', 'cp', 'call_put'],
  bid: ['bid', 'bid_price', 'bidprice'],
  ask: ['ask', 'ask_price', 'askprice', 'offer'],
};

function findColumnMatch(headers: string[], targetCol: string): string | null {
  const variations = COLUMN_VARIATIONS[targetCol] || [targetCol];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  
  for (const variation of variations) {
    const normalizedVar = variation.replace(/[^a-z0-9]/g, '');
    const index = normalizedHeaders.findIndex(h => h === normalizedVar);
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
}

export function Step1DataUpload({ onComplete, initialData }: Step1Props) {
  const [parsedData, setParsedData] = useState<QuoteInput[] | null>(initialData || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateData = useCallback((rows: Record<string, unknown>[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (rows.length === 0) {
      errors.push('File contains no data rows');
      return { valid: false, errors };
    }

    // Check required columns
    const firstRow = rows[0];
    const columns = Object.keys(firstRow);
    
    for (const col of REQUIRED_COLUMNS) {
      const found = findColumnMatch(columns, col);
      if (!found) {
        errors.push(`Missing required column: ${col}`);
      }
    }

    // Validate data types
    if (errors.length === 0) {
      let invalidRows = 0;
      const columns = Object.keys(rows[0]);
      const strikeCol = findColumnMatch(columns, 'strike');
      const maturityCol = findColumnMatch(columns, 'maturity');
      const volCol = findColumnMatch(columns, 'impliedVol');

      rows.forEach((row) => {
        const strike = parseFloat(String(strikeCol ? row[strikeCol] : 0));
        const maturity = parseFloat(String(maturityCol ? row[maturityCol] : 0));
        const vol = parseFloat(String(volCol ? row[volCol] : 0));

        if (isNaN(strike) || strike <= 0) invalidRows++;
        else if (isNaN(maturity) || maturity <= 0) invalidRows++;
        else if (isNaN(vol) || vol <= 0 || vol > 5) invalidRows++;
      });

      if (invalidRows > 0) {
        errors.push(`${invalidRows} rows have invalid or missing data`);
      }
    }

    return { valid: errors.length === 0, errors };
  }, []);

  const normalizeData = useCallback((rows: Record<string, unknown>[]): QuoteInput[] => {
    const columns = Object.keys(rows[0]);
    const strikeCol = findColumnMatch(columns, 'strike');
    const maturityCol = findColumnMatch(columns, 'maturity');
    const volCol = findColumnMatch(columns, 'impliedVol');
    const typeCol = findColumnMatch(columns, 'optionType');
    const bidCol = findColumnMatch(columns, 'bid');
    const askCol = findColumnMatch(columns, 'ask');

    return rows
      .map(row => {
        const strike = parseFloat(String(strikeCol ? row[strikeCol] : 0));
        const maturity = parseFloat(String(maturityCol ? row[maturityCol] : 0));
        const impliedVol = parseFloat(String(volCol ? row[volCol] : 0));
        
        if (isNaN(strike) || isNaN(maturity) || isNaN(impliedVol)) {
          return null;
        }

        const quote: QuoteInput = {
          strike,
          maturity,
          impliedVol,
        };

        // Add optional fields
        if (typeCol && row[typeCol]) {
          const type = String(row[typeCol]).toLowerCase();
          quote.optionType = type.startsWith('c') ? 'call' : type.startsWith('p') ? 'put' : undefined;
        }
        if (bidCol && row[bidCol]) {
          const bid = parseFloat(String(row[bidCol]));
          if (!isNaN(bid)) quote.bid = bid;
        }
        if (askCol && row[askCol]) {
          const ask = parseFloat(String(row[askCol]));
          if (!isNaN(ask)) quote.ask = ask;
        }

        return quote;
      })
      .filter((row): row is QuoteInput => row !== null);
  }, []);

  const handleFilesAccepted = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    setValidationErrors([]);

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      // Parse JSON
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const rows = Array.isArray(json) ? json : json.data || json.options || json.quotes || [];
          
          const { valid, errors } = validateData(rows);
          
          if (valid) {
            const normalized = normalizeData(rows);
            setParsedData(normalized);
            toast.success(`Loaded ${normalized.length} data points`);
          } else {
            setValidationErrors(errors);
            toast.error('Validation failed');
          }
        } catch {
          setValidationErrors(['Invalid JSON format']);
          toast.error('Failed to parse JSON');
        }
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } else {
      // Parse CSV
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data;
          
          const { valid, errors } = validateData(rows);
          
          if (valid) {
            const normalized = normalizeData(rows);
            setParsedData(normalized);
            toast.success(`Loaded ${normalized.length} data points`);
          } else {
            setValidationErrors(errors);
            toast.error('Validation failed');
          }
          setIsProcessing(false);
        },
        error: (err) => {
          setValidationErrors([`CSV parsing error: ${err.message}`]);
          toast.error('Failed to parse CSV');
          setIsProcessing(false);
        },
      });
    }
  }, [validateData, normalizeData]);

  const handleFileRejected = useCallback((errors: string[]) => {
    setValidationErrors(errors);
    toast.error(errors[0]);
  }, []);

  const isValid = parsedData !== null && parsedData.length > 0 && validationErrors.length === 0;

  const handleContinue = () => {
    if (isValid && parsedData && fileName) {
      onComplete({ parsedQuotes: parsedData, fileName });
    }
  };

  // Preview columns for DataTable
  const previewColumns = [
    { 
      accessorKey: 'strike', 
      header: 'Strike',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => 
        `$${row.getValue('strike').toFixed(2)}`
    },
    { 
      accessorKey: 'maturity', 
      header: 'Maturity',
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => 
        `${row.getValue('maturity').toFixed(3)}Y`
    },
    { 
      accessorKey: 'impliedVol', 
      header: 'IV', 
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => 
        `${(row.getValue('impliedVol') * 100).toFixed(2)}%` 
    },
    { 
      accessorKey: 'optionType', 
      header: 'Type',
      cell: ({ row }: { row: { getValue: (key: string) => string | undefined } }) => {
        const type = row.getValue('optionType');
        return type ? (
          <Badge variant={type === 'call' ? 'default' : 'secondary'}>
            {type.toUpperCase()}
          </Badge>
        ) : '-';
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-surface-100">Step 1: Upload Option Data</h2>
        <p className="text-surface-400 mt-1">
          Upload a CSV or JSON file containing your option chain data.
        </p>
      </div>

      {/* Required columns info */}
      <Alert variant="info">
        <FileSpreadsheet className="h-4 w-4" />
        <AlertTitle>Required Columns</AlertTitle>
        <AlertDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            {REQUIRED_COLUMNS.map(col => (
              <Badge key={col} variant="default">{col}</Badge>
            ))}
            <span className="text-surface-400 mx-2">Optional:</span>
            {OPTIONAL_COLUMNS.slice(0, 4).map(col => (
              <Badge key={col} variant="outline">{col}</Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* File upload */}
      <FileUpload
        accept={{
          'text/csv': ['.csv'],
          'application/json': ['.json'],
        }}
        maxSize={50 * 1024 * 1024} // 50MB
        onFilesAccepted={handleFilesAccepted}
        onFileRejected={handleFileRejected}
        parsePreview={false}
      />

      {/* OR separator + Sample Data */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-surface-700/50" />
        <span className="text-sm text-surface-500 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-surface-700/50" />
      </div>

      <div className="flex flex-col items-center gap-2 p-6 rounded-lg border border-dashed border-surface-600/50 bg-surface-800/30">
        <p className="text-sm text-surface-400 mb-2">
          No file? Try the app with sample options data.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="px-8 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/30 hover:border-primary-400/50 hover:from-primary-500/20 hover:to-accent-500/20 transition-all"
          onClick={() => {
            setParsedData(SAMPLE_QUOTES);
            setFileName('sample_quotes (built-in)');
            setValidationErrors([]);
            toast.success(`Loaded ${SAMPLE_QUOTES.length} sample data points`);
          }}
        >
          <Database className="mr-2 h-5 w-5 text-primary-400" />
          Load Sample Data
        </Button>
        <p className="text-xs text-surface-500 mt-1">
          20 option quotes across 4 maturities × 5 strikes
        </p>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {isValid && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Data Loaded Successfully</AlertTitle>
          <AlertDescription>
            {parsedData?.length} data points loaded from {fileName}
          </AlertDescription>
        </Alert>
      )}

      {/* Data preview */}
      {parsedData && parsedData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-surface-200">Data Preview (first 10 rows)</h3>
          <DataTable
            columns={previewColumns}
            data={parsedData.slice(0, 10)}
            showToolbar={false}
            showPagination={false}
          />
          {parsedData.length > 10 && (
            <p className="text-sm text-surface-500">
              ... and {parsedData.length - 10} more rows
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <WizardNavigation
        showBack={false}
        onNext={handleContinue}
        nextDisabled={!isValid}
        nextLoading={isProcessing}
        nextLabel="Continue to Configuration"
      />
    </div>
  );
}
