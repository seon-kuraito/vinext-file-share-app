"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

// Shape of the /api/upload JSON body; url and expiresAt only arrive on success
type UploadResult = {
  success: boolean;
  message?: string;
  url?: string;
  expiresAt?: string;
};

type CopyStatus = "idle" | "copied" | "failed";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  // Dropzone always hands over an array; multiple: false keeps it at one entry
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const droppedFile = acceptedFiles[0];

      setFile(droppedFile);

      // A new file makes the previous link stale, so clear it and its copy state
      setUploadResult(null);
      setCopyStatus("idle");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setCopyStatus("idle");

    try {
      // multipart/form-data: the browser writes the boundary, so set no Content-Type
      const formData = new FormData();

      // The server reads name, size and type off this File; client copies are not trusted
      formData.append("file", file);
      formData.append("expiration", "7"); // Lifetime in days, read by the server

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // fetch rejects only on network failure: 4xx and 5xx still resolve
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      // A cast, not a check: this trusts the server to keep the contract
      const json = await res.json() as UploadResult;

      setUploadResult(json);

      if (json.success) {
        // Clear the file input after successful upload
        setFile(null);
      }
    } catch (error) {
      // Catches both the status error above and a network failure
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      // Runs on both paths, so the button never stays disabled
      setIsUploading(false);
    }
  };

  const handleCopy = async (url: string) => {
    // The Clipboard API is absent outside a secure context
    if (!navigator.clipboard) {
      setCopyStatus("failed");

      return;
    }

    try {
      await navigator.clipboard.writeText(url);

      setCopyStatus("copied");
    } catch {
      // A denied permission rejects the promise
      setCopyStatus("failed");
    }
  };

  // Narrow once here, so the JSX below needs no non-null assertion
  const shareUrl = uploadResult?.success ? uploadResult.url : undefined;

  // The drag state outranks the picked filename on the drop target
  const dropzoneLabel = isDragActive
    ? "Drop the file here."
    : file?.name ?? "Please drag and drop a file here.";

  return (
    <main>
      <section>
        {/* getRootProps supplies the drag handlers, the click target and the a11y attributes */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "#4a90d9" : "#cccccc"}`,
            padding: "20px",
            textAlign: "center",
          }}
        >
          {/* The real file input; react-dropzone hides it and opens it on click */}
          <input {...getInputProps()} />
          <p>{dropzoneLabel}</p>
        </div>

        {file && (
          <div>
            <h3>File Details:</h3>
            <p>Name: {file.name}</p>
            <p>Size: {file.size} bytes</p>
            <p>Type: {file.type}</p>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {/* A failed result carries a message and no link */}
        {uploadResult && !uploadResult.success && (
          <p role="alert">
            Upload failed: {uploadResult.message ?? "Unknown error"}
          </p>
        )}

        {shareUrl && (
          <div>
            <h3>Upload Successful!</h3>
            <input
              readOnly
              type="text"
              value={shareUrl}
              onClick={(e) => e.currentTarget.select()}
            />
            <button type="button" onClick={() => handleCopy(shareUrl)}>
              Copy URL
            </button>
            {copyStatus === "copied" && (
              <p>Copied.</p>
            )}
            {copyStatus === "failed" && (
              <p>Copy failed. Select the URL and copy it by hand.</p>
            )}
            {uploadResult?.expiresAt && (
              <p>Expires at: {new Date(uploadResult.expiresAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
