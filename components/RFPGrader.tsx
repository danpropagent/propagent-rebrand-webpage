import React, { useState, useRef } from 'react';

type GradeMode = 'rfp' | 'response';

interface FileState {
  files: File[];
}

const VALID_EXTENSIONS = ['pdf', 'docx', 'txt'];
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

const RFP_DIMENSIONS = [
  'Scope and deliverables precision',
  'Evaluation criteria transparency',
  'Technical requirements and drawings',
  'Fair competition and true discriminators',
  'Purpose, outcomes, and project context',
  'Schedule realism and milestones',
  'Internal consistency',
  'Commercial terms and risk allocation',
  'Innovation flexibility and trade-offs',
  'Compliance requirements',
  'Submission instructions and format',
  'Communication and Q&A process',
];

const filterFiles = (incoming: FileList | File[]): File[] => {
  return Array.from(incoming).filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return !!ext && VALID_EXTENSIONS.includes(ext) && file.size <= MAX_TOTAL_BYTES;
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
    const totalBytes = [...rfpFiles.files, ...responseFiles.files]
      .reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setSubmitStatus({
        type: 'error',
        message: 'Please keep the combined upload at or below 20 MB.',
      });
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
      const response = await fetch('/api/gradeRfp', {
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
    <main className="grader-section" id="main-content">
      <div className="container">
        <header className="grader-header" data-direct-answer>
          <div className="section-eyebrow">Free RFP Grader</div>
          <h1>Grade an RFP, or grade a <span className="text-agent-gradient">response to one.</span></h1>
          <p className="lede">
            Propagent's RFP Grader assesses an RFP across 12 quality dimensions or compares a draft response against its source RFP for compliance and fit. It turns the documents into a decision-ready report delivered by email for human review.
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
                aria-pressed={mode === 'rfp'}
              >
                <span className="mode-title">Grade my RFP</span>
                <span className="mode-desc">Analyze the quality, clarity, and completeness of your RFP document.</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('response')}
                className={`grader-mode-btn ${mode === 'response' ? 'is-active' : ''}`}
                aria-pressed={mode === 'response'}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  rfpInputRef.current?.click();
                }
              }}
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
              <p className="grader-dropzone-hint">PDF, DOCX, or TXT · 20 MB combined per submission</p>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    responseInputRef.current?.click();
                  }
                }}
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
                <p className="grader-dropzone-hint">PDF, DOCX, or TXT · 20 MB combined per submission</p>
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

          <p className="grader-data-use">
            Your email address and uploaded files are submitted to Propagent to generate and deliver the requested report. See the <a href="/security/">security and procurement guide</a>.
          </p>

          <div className="grader-submit-row">
            <p className="grader-help">Submission is processed asynchronously. Expect results within a few minutes.</p>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting || !isFormValid()}>
              {isSubmitting ? 'Submitting…' : 'Submit for grading →'}
            </button>
          </div>
        </form>

        <div className="grader-content">
          <section className="grader-content-section" aria-labelledby="grader-modes-heading">
            <div className="grader-content-head">
              <div className="section-eyebrow">Two grading modes</div>
              <h2 id="grader-modes-heading">Start with the document you need to understand.</h2>
            </div>
            <div className="grader-summary-grid">
              <article className="grader-summary-card">
                <span className="grader-card-kicker">RFP quality</span>
                <h3>Grade the RFP itself</h3>
                <p>Assess clarity, completeness, ambiguity, commercial risk, submission instructions, and the conditions that shape bidder response quality.</p>
              </article>
              <article className="grader-summary-card">
                <span className="grader-card-kicker">Response fit</span>
                <h3>Grade a response against the RFP</h3>
                <p>Compare a draft response with the source solicitation to surface compliance gaps, weak coverage, clarity issues, and areas requiring human attention.</p>
              </article>
            </div>
          </section>

          <section className="grader-content-section" aria-labelledby="grader-report-heading">
            <div className="grader-content-head">
              <div className="section-eyebrow">Inside the report</div>
              <h2 id="grader-report-heading">Twelve dimensions, plus the risks between them.</h2>
              <p>The RFP-quality report evaluates the following dimensions and adds ambiguity, killer-clause, improvement-priority, and bid/no-bid context.</p>
            </div>
            <ol className="grader-dimension-grid">
              {RFP_DIMENSIONS.map((dimension) => <li key={dimension}>{dimension}</li>)}
            </ol>
          </section>

          <aside className="grader-human-note" aria-labelledby="human-decision-heading">
            <span className="grader-card-kicker">Human decision</span>
            <h2 id="human-decision-heading">A sharper read, not an automatic verdict.</h2>
            <p>The grader organizes evidence, gaps, and pursuit risk so a proposal leader, capture team, procurement team, or executive can decide what to fix, clarify, pursue, or decline.</p>
          </aside>

          <section className="grader-content-section" aria-labelledby="grader-faq-heading">
            <div className="grader-content-head">
              <div className="section-eyebrow">FAQ</div>
              <h2 id="grader-faq-heading">How the RFP Grader works.</h2>
            </div>
            <div className="grader-faq-list">
              <details>
                <summary>What is the Propagent RFP Grader?</summary>
                <p>It is a free tool for assessing an RFP's quality or comparing a draft response against the source RFP. It emails a structured report for human review.</p>
              </details>
              <details>
                <summary>What can I grade?</summary>
                <p>Upload an RFP for a quality and clarity assessment, or upload an RFP with a draft response for a compliance and fit comparison.</p>
              </details>
              <details>
                <summary>What does the RFP report cover?</summary>
                <p>The report covers 12 dimensions: scope precision, evaluation transparency, technical requirements, fair competition, project context, schedule realism, internal consistency, commercial risk, innovation flexibility, compliance requirements, submission instructions, and the communication process.</p>
              </details>
              <details>
                <summary>Does it make the final bid or no-bid decision?</summary>
                <p>No. It provides structured decision support. Your proposal, capture, procurement, or leadership team makes the final decision.</p>
              </details>
              <details>
                <summary>Which files can I upload?</summary>
                <p>PDF, DOCX, and TXT files are supported, with a 20 MB combined limit per submission.</p>
              </details>
              <details>
                <summary>How are submitted files used?</summary>
                <p>Your email address and uploaded files are submitted to Propagent to generate and deliver the requested report. See the <a href="/security/">security and procurement guide</a>.</p>
              </details>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RFPGrader;
