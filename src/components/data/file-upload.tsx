import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  accept?: Accept;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesAccepted: (files: File[]) => void;
  onFileRejected?: (errors: string[]) => void;
  parsePreview?: boolean;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function FileUpload({
  accept = {
    'text/csv': ['.csv'],
    'application/json': ['.json'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  onFilesAccepted,
  onFileRejected,
  parsePreview = true,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewData, setPreviewData] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      if (rejectedFiles.length > 0) {
        const errors = (rejectedFiles as Array<{ file: File; errors: Array<{ code: string; message: string }> }>).map((f) => {
          const error = f.errors[0];
          if (error.code === 'file-too-large') {
            return `${f.file.name}: File is too large (max ${maxSize / 1024 / 1024}MB)`;
          }
          if (error.code === 'file-invalid-type') {
            return `${f.file.name}: Invalid file type`;
          }
          return `${f.file.name}: ${error.message}`;
        });
        onFileRejected?.(errors);
      }

      if (acceptedFiles.length > 0) {
        const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
          file,
          status: 'pending' as const,
          progress: 0,
        }));
        setFiles(newFiles);
        onFilesAccepted(acceptedFiles);

        // Generate preview for first file
        if (parsePreview && acceptedFiles[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            // Show first 500 characters
            setPreviewData(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
          };
          reader.readAsText(acceptedFiles[0]);
        }
      }
    },
    [maxSize, onFilesAccepted, onFileRejected, parsePreview]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setPreviewData(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          !isDragActive && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          'cursor-pointer'
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'h-10 w-10 mb-4',
            isDragActive && !isDragReject && 'text-primary',
            isDragReject && 'text-destructive',
            !isDragActive && 'text-muted-foreground'
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive
              ? isDragReject
                ? 'Invalid file type'
                : 'Drop the files here'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports CSV and JSON files up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
            >
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="w-20" />
                )}
                {uploadedFile.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                {uploadedFile.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="mb-2 text-sm font-medium">Preview</h4>
          <pre className="max-h-40 overflow-auto rounded bg-background p-2 text-xs">
            {previewData}
          </pre>
        </div>
      )}
    </div>
  );
}
