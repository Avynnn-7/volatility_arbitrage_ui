/**
 * ExportControls - UI component for export actions
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Camera, FileJson, Image } from 'lucide-react';

interface ExportControlsProps {
  onExportPNG: () => void;
  onExportJPEG: () => void;
  onExportJSON?: () => void;
  onCopyToClipboard?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ExportControls({
  onExportPNG,
  onExportJPEG,
  onExportJSON,
  onCopyToClipboard,
  disabled = false,
  className,
}: ExportControlsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          disabled={disabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportPNG}>
          <Image className="mr-2 h-4 w-4" />
          Export as PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportJPEG}>
          <Camera className="mr-2 h-4 w-4" />
          Export as JPEG
        </DropdownMenuItem>
        {onCopyToClipboard && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCopyToClipboard}>
              <Image className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </DropdownMenuItem>
          </>
        )}
        {onExportJSON && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExportJSON}>
              <FileJson className="mr-2 h-4 w-4" />
              Export Scene JSON
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline export buttons for tight spaces
 */
interface InlineExportButtonsProps {
  onExportPNG: () => void;
  onExportJPEG: () => void;
  disabled?: boolean;
  className?: string;
}

export function InlineExportButtons({
  onExportPNG,
  onExportJPEG,
  disabled = false,
  className,
}: InlineExportButtonsProps) {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportPNG}
        disabled={disabled}
      >
        <Image className="mr-2 h-4 w-4" />
        PNG
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportJPEG}
        disabled={disabled}
      >
        <Camera className="mr-2 h-4 w-4" />
        JPEG
      </Button>
    </div>
  );
}

export default ExportControls;
