import React, { useState, useRef } from 'react';

type GradeMode = 'rfp' | 'response';

interface FileState {
  files: File[];
}

const VALID_EXTENSIONS = ['pdf', 'docx', 'txt'];
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB

const filterFiles = (incoming: FileList | File[]): File[] => {
  return Array.from(incoming).filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return !!ext && VALID_EXTENSIONS.includes(ext) && file.size <= MAX_FILE_BYTES;
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const RFPGrader: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<GradeMode>('rfp');
  const [rfpFiles, setRfpFiles] = useState<FileState>({ files: [] });
  const [responseFiles, setResponseFiles] = useState<FileState>({ files: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const rfpInputRef = useRef<HTMLInputElement>(null);
  const responseInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isFormValid = (): boolean => {
    if (!validateEmail(email)) return false;
    if (mode === 'rfp') return rfpFiles.files.length > 0;
    return rfpFiles.files.length > 0 && responseFiles.files.length > 0;
  };

  const handleDragOver = (e: React.DragEvent, bucket: string) => {
    e.preventDefault();
    setIsDragging(bucket);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
  };

  const handleDrop = (e: React.DragEvent, bucket: 'rfp' | 'response') => {
    e.preventDefault();
    setIsDragging(null);
    const dropped = filterFiles(e.dataTransfer.files);
    if (bucket === 'rfp') {
      setRfpFiles({ files: [...rfpFiles.files, ...dropped] });
    } else {
      setResponseFiles({ files: [...responseFiles.files, ...dropped] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, bucket: 'rfp' | 'response') => {
    if (!e.target.files) return;
    const selected = filterFiles(e.target.files);
    if (bucket === 'rfp') {
      setRfpFiles({ files: [...rfpFiles.files, ...selected] });
    } else {
      setResponseFiles({ files: [...responseFiles.files, ...selected] });
    }
  };

  const removeFile = (bucket: 'rfp' | 'response', index: number) => {
    if (bucket === 'rfp') {
      setRfpFiles({ files: rfpFiles.files.filter((_, i) => i !== index) });
    } else {
      setResponseFiles({ files: responseFiles.files.filter((_, i) => i !== index) });
    }
  };

  const handleModeChange = (newMode: GradeMode) => {
    setMode(newMode);
    setRfpFiles({ files: [] });
    setResponseFiles({ files: [] });
    setSubmitStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const rfpFilesData = await Promise.all(
        rfpFiles.files.map(async (file) => ({
          name: file.name,
          content: await readFileAsBase64(file),
          mimeType: file.type,
        }))
      );
      const responseFilesData = mode === 'response'
        ? await Promise.all(
            responseFiles.files.map(async (file) => ({
              name: file.name,
              content: await readFileAsBase64(file),
              mimeType: file.type,
            }))
          )
        : [];

      const payload = { email, mode, rfpFiles: rfpFilesData, responseFiles: responseFilesData };
      const response = await fetch('https://graderfp-nzrxc3sypq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let result: any;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server error: unable to process response (status ${response.status})`);
      }
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Submission failed');
      }

      setSubmitStatus({
        type: 'success',
        message: result.message || 'Your submission is being analyzed. Results will arrive by email shortly.',
      });
      setEmail('');
      setRfpFiles({ files: [] });
      setResponseFiles({ files: [] });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const rfpLabel = mode === 'rfp' ? 'Upload your RFP documents' : 'Upload the original RFP';

  return (
    <section className="grader-section">
      <div className="container">
        <header className="grader-header">
          <div className="section-eyebrow">RFP Grader</div>
          <h1>Grade an RFP, or grade a <span className="text-agent-gradient">response to one.</span></h1>
          <p className="lede">
            Upload an RFP for a quality and clarity read, or pair it with a draft response for compliance and fit. Results land in your inbox.
          </p>
        </header>

        <form className="grader-form" onSubmit={handleSubmit}>
          <div className="grader-field">
            <label className="grader-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="grader-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              required
              autoComplete="email"
            />
            <p className="grader-help">Results will be sent to this email address.</p>
          </div>

          <div className="grader-field">
            <span className="grader-label">Grading mode</span>
            <div className="grader-mode">
              <button
                type="button"
                onClick={() => handleModeChange('rfp')}
                className={`grader-mode-btn ${mode === 'rfp' ? 'is-active' : ''}`}
              >
                <span className="mode-title">Grade my RFP</span>
                <span className="mode-desc">Analyze the quality, clarity, and completeness of your RFP document.</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('response')}
                className={`grader-mode-btn ${mode === 'response' ? 'is-active' : ''}`}
              >
                <span className="mode-title">Grade my response</span>
                <span className="mode-desc">Compare your response against the original RFP for compliance and fit.</span>
              </button>
            </div>
          </div>

          <div className="grader-field">
            <span className="grader-label">{rfpLabel}</span>
            <div
              className={`grader-dropzone ${isDragging === 'rfp' ? 'is-dragging' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'rfp')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'rfp')}
              onClick={() => rfpInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={rfpInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleFileSelect(e, 'rfp')}
                style={{ display: 'none' }}
                key={`rfp-${mode}`}
              />
              <p className="grader-dropzone-title">Drop files here, or click to browse</p>
              <p className="grader-dropzone-hint">PDF, DOCX, or TXT · up to 100MB each</p>
            </div>
            {rfpFiles.files.length > 0 && (
              <ul className="grader-files">
                {rfpFiles.files.map((file, idx) => (
                  <li className="grader-file" key={`${file.name}-${idx}`}>
                    <span className="grader-file-info">
                      <span className="grader-file-name">{file.name}</span>
                      <span className="grader-file-size">{formatFileSize(file.size)}</span>
                    </span>
                    <button type="button" className="grader-file-remove" onClick={() => removeFile('rfp', idx)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {mode === 'response' && (
            <div className="grader-field">
              <span className="grader-label">Upload your response documents</span>
              <div
                className={`grader-dropzone ${isDragging === 'response' ? 'is-dragging' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'response')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'response')}
                onClick={() => responseInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={responseInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileSelect(e, 'response')}
                  style={{ display: 'none' }}
                  key={`response-${mode}`}
                />
                <p className="grader-dropzone-title">Drop files here, or click to browse</p>
                <p className="grader-dropzone-hint">PDF, DOCX, or TXT · up to 100MB each</p>
              </div>
              {responseFiles.files.length > 0 && (
                <ul className="grader-files">
                  {responseFiles.files.map((file, idx) => (
                    <li className="grader-file" key={`${file.name}-${idx}`}>
                      <span className="grader-file-info">
                        <span className="grader-file-name">{file.name}</span>
                        <span className="grader-file-size">{formatFileSize(file.size)}</span>
                      </span>
                      <button type="button" className="grader-file-remove" onClick={() => removeFile('response', idx)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {submitStatus && (
            <div className={`grader-status ${submitStatus.type === 'success' ? 'is-success' : 'is-error'}`}>
              {submitStatus.message}
            </div>
          )}

          <div className="grader-submit-row">
            <p className="grader-help">Submission is processed asynchronously. Expect results within a few minutes.</p>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? 'Submitting…' : 'Submit for grading →'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RFPGrader;
