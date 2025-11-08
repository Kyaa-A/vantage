// 📎 File Field Component (Placeholder)
// File upload field - full implementation will be added in Epic 4

import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileIcon } from "lucide-react";
import type { FileUploadField } from "@vantage/shared";

interface FileFieldComponentProps {
  field: FileUploadField;
}

export function FileFieldComponent({ field }: FileFieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.help_text && (
        <p className="text-sm text-muted-foreground">{field.help_text}</p>
      )}

      <Alert className="border-dashed">
        <FileIcon className="h-4 w-4" />
        <AlertDescription>
          File upload integration will be added in Epic 4.0 (MOV Upload System).
          <br />
          <span className="text-muted-foreground text-xs mt-1 block">
            Supported types:{" "}
            {field.allowed_file_types?.join(", ") || "All file types"}
            {field.max_file_size_mb &&
              ` | Max size: ${field.max_file_size_mb}MB`}
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
}
