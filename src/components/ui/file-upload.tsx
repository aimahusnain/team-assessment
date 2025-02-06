import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconUpload, IconFile, IconTrash } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({
  onChange,
  accept = ".csv,.xlsx,.xls",
  multiple = false,
  disabled = false,
}: {
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    const filteredFiles = multiple 
      ? [...files, ...newFiles] 
      : newFiles;
    
    setFiles(filteredFiles);
    if (onChange) {
      onChange(filteredFiles);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    if (onChange) {
      onChange(updatedFiles);
    }
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    noClick: true,
    accept: accept ? { 'file/*': accept.split(',') } : {},
    disabled,
    onDrop: handleFileChange,
  });

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      {...getRootProps()} 
      className={cn(
        "w-full transition-all duration-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <motion.div
        onClick={handleClick}
        whileHover={!disabled ? "animate" : undefined}
        className={cn(
          "group/file block rounded-lg cursor-pointer w-full relative overflow-hidden",
          "border-2 border-dashed border-neutral-300 dark:border-neutral-700",
          "hover:border-green-500 dark:hover:border-green-400",
          "transition-all duration-300",
          disabled && "pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            const selectedFiles = e.target.files 
              ? Array.from(e.target.files) 
              : [];
            handleFileChange(selectedFiles);
          }}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="p-6 text-center">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <IconUpload 
                className={cn(
                  "h-12 w-12 text-neutral-400 group-hover/file:text-green-500",
                  "transition-colors duration-300"
                )} 
              />
              <p className="text-neutral-600 dark:text-neutral-300">
                {isDragActive 
                  ? "Drop files here" 
                  : `Drag and drop ${multiple ? 'files' : 'a file'} or click to upload`}
              </p>
              <p className="text-xs text-neutral-500">
                Supported formats: {accept}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800",
                    "rounded-md shadow-sm"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <IconFile 
                      className="h-6 w-6 text-green-500 dark:text-green-400" 
                    />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className={cn(
                      "text-red-500 hover:bg-red-50 p-1 rounded-full",
                      "transition-colors duration-300"
                    )}
                  >
                    <IconTrash className="h-5 w-5" />
                  </button>
                </motion.div>
              ))}
              {!multiple && files.length > 0 && (
                <p className="text-xs text-neutral-500 mt-2">
                  Click to replace the file
                </p>
              )}
              {multiple && (
                <button 
                  onClick={handleClick}
                  className={cn(
                    "mt-3 px-4 py-2 text-sm bg-green-500 text-white rounded-md",
                    "hover:bg-green-600 transition-colors duration-300"
                  )}
                >
                  Add More Files
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FileUpload;