import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Upload, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  message: string;
  saved: number;
  skipped: number;
}

export function ImportSalesDataTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/sales/import-archive", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Import failed.");
      } else {
        setResult(data);
        toast({
          title: "Import Successful",
          description: data.message,
          className: "bg-green-50 border-green-200 text-green-800",
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message ?? "Unknown error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Archive Sales Data
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload historical sales records from an Excel file. Each row is upserted into the sales table by Date + Brand No + Size.
          </p>
        </div>
        <a
          href="/sales_import_template.xlsx"
          download="sales_import_template.xlsx"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          data-testid="link-download-sales-template"
        >
          <Download className="w-4 h-4" />
          Download Sample Template
        </a>
      </div>

      {/* Required columns reference */}
      <div className="bg-muted/40 rounded-lg border border-border p-4 text-sm">
        <p className="font-medium text-foreground mb-2">Required Excel Columns</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Sale Date", "Brand No", "Brand Name", "Size", "Qty/Case",
            "Opening Bal (Btls)", "New Stock (Cs)", "New Stock (Btls)",
            "Total Stock", "Cls Bal (Cs)", "Cls Bal (Btls)", "Breakage", "Invoice Date",
          ].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
            >
              {col}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          MRP is auto-looked up from your existing stock/MRP records. Sale Date supports DD/MM/YYYY or YYYY-MM-DD formats.
        </p>
      </div>

      {/* File picker */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        data-testid="dropzone-import-sales"
      >
        <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        {selectedFile ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-medium text-foreground">Click to select an Excel file</p>
            <p className="text-sm text-muted-foreground">.xlsx or .xls format only</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-import-sales-file"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          data-testid="button-import-sales-upload"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Importing..." : "Import Data"}
        </Button>
        {selectedFile && (
          <Button variant="outline" onClick={handleClear} data-testid="button-import-sales-clear">
            Clear
          </Button>
        )}
      </div>

      {/* Result / Error */}
      {result && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Import Complete</p>
            <p className="text-sm mt-0.5">{result.message}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span><strong>{result.saved}</strong> row(s) saved</span>
              {result.skipped > 0 && <span><strong>{result.skipped}</strong> row(s) skipped</span>}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Import Failed</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground border-t border-border pt-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Existing records for the same Brand No + Size + Sale Date will be overwritten. This action is irreversible. Verify data in the Sales page after import.
        </span>
      </div>
    </section>
  );
}
