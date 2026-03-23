import { useCallback } from 'react';
import { saveAs } from 'file-saver';

interface UseChartExportOptions {
  filename?: string;
}

export function useChartExport(options: UseChartExportOptions = {}) {
  const { filename = 'chart' } = options;

  const exportToPNG = useCallback(
    async (elementId: string) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return;
      }

      try {
        // Dynamic import to avoid bundling html2canvas if not needed
        const { default: html2canvas } = await import('html2canvas');
        
        const canvas = await html2canvas(element, {
          backgroundColor: '#0f172a', // surface-900
          scale: 2, // Higher quality
          logging: false,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `${filename}-${Date.now()}.png`);
          }
        });
      } catch (error) {
        console.error('Error exporting chart:', error);
      }
    },
    [filename]
  );

  const exportToSVG = useCallback(
    async (elementId: string) => {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with id "${elementId}" not found`);
        return;
      }

      try {
        const svgElement = element.querySelector('svg');
        if (!svgElement) {
          console.error('No SVG element found');
          return;
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, `${filename}-${Date.now()}.svg`);
      } catch (error) {
        console.error('Error exporting SVG:', error);
      }
    },
    [filename]
  );

  const exportToCSV = useCallback(
    (data: Record<string, unknown>[], headers?: string[]) => {
      if (data.length === 0) {
        console.error('No data to export');
        return;
      }

      const actualHeaders = headers || Object.keys(data[0]);
      
      const csvContent = [
        actualHeaders.join(','),
        ...data.map((row) =>
          actualHeaders.map((header) => {
            const value = row[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}-${Date.now()}.csv`);
    },
    [filename]
  );

  const exportToJSON = useCallback(
    (data: unknown, pretty = true) => {
      const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${filename}-${Date.now()}.json`);
    },
    [filename]
  );

  return { 
    exportToPNG, 
    exportToSVG, 
    exportToCSV, 
    exportToJSON 
  };
}
