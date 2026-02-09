import React, { useState, useRef } from 'react';

type GradeMode = 'rfp' | 'response';

interface FileState {
  files: File[];
}

const RFPGrader: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<GradeMode>('rfp');
  const [rfpFiles, setRfpFiles] = useState<FileState>({ files: [] });
  const [responseFiles, setResponseFiles] = useState<FileState>({ files: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const rfpInputRef = useRef<HTMLInputElement>(null);
  const responseInputRef = useRef<HTMLInputElement>(null);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateFiles = (): boolean => {
    if (mode === 'rfp') {
      return rfpFiles.files.length > 0;
    } else {
      return rfpFiles.files.length > 0 && responseFiles.files.length > 0;
    }
  };

  const isFormValid = (): boolean => {
    return validateEmail(email) && validateFiles();
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

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validTypes = ['pdf', 'docx', 'txt'];
      const isValidType = ext && validTypes.includes(ext);
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      return isValidType && isValidSize;
    });

    if (bucket === 'rfp') {
      setRfpFiles({ files: [...rfpFiles.files, ...droppedFiles] });
    } else {
      setResponseFiles({ files: [...responseFiles.files, ...droppedFiles] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, bucket: 'rfp' | 'response') => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const validTypes = ['pdf', 'docx', 'txt'];
        const isValidType = ext && validTypes.includes(ext);
        const isValidSize = file.size <= 100 * 1024 * 1024;
        return isValidType && isValidSize;
      });

      if (bucket === 'rfp') {
        setRfpFiles({ files: [...rfpFiles.files, ...selectedFiles] });
      } else {
        setResponseFiles({ files: [...responseFiles.files, ...selectedFiles] });
      }
    }
  };

  const removeFile = (bucket: 'rfp' | 'response', index: number) => {
    if (bucket === 'rfp') {
      const newFiles = rfpFiles.files.filter((_, i) => i !== index);
      setRfpFiles({ files: newFiles });
    } else {
      const newFiles = responseFiles.files.filter((_, i) => i !== index);
      setResponseFiles({ files: newFiles });
    }
  };

  // Helper function to convert File to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Convert all files to base64
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

      const payload = {
        email,
        mode,
        rfpFiles: rfpFilesData,
        responseFiles: responseFilesData,
      };

      const response = await fetch('https://graderfp-nzrxc3sypq-uc.a.run.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses gracefully
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        // Backend returned non-JSON (empty or plain text)
        throw new Error(
          `Server error: Unable to process response (Status ${response.status})`
        );
      }

      if (!response.ok) {
        // Display specific error from server if available
        const errorMessage = result.details || result.error || 'Submission failed';
        throw new Error(errorMessage);
      }

      setSubmitStatus({
        type: 'success',
        message: result.message || 'Your RFP is being analyzed. You will receive the results via email shortly.'
      });

      // Reset form
      setEmail('');
      setRfpFiles({ files: [] });
      setResponseFiles({ files: [] });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred while submitting your request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (newMode: GradeMode) => {
    setMode(newMode);
    setRfpFiles({ files: [] });
    setResponseFiles({ files: [] });
    setSubmitStatus(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <section id="rfp-grader" className="min-h-screen py-32 px-6 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-brand font-bold mb-6 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
            RFP AI GRADER
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Automate the grading of RFPs for quality and clarity, or evaluate RFP responses for compliance and fit using advanced AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-bold uppercase tracking-widest text-neon-blue">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-6 py-4 bg-black/50 border-2 border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-neon-blue focus:outline-none transition-colors duration-300"
              required
            />
            <p className="text-xs text-gray-500">Results will be sent to this email address</p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-widest text-neon-purple">
              Grading Mode *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleModeChange('rfp')}
                className={`p-6 rounded-lg border-2 transition-all duration-300 text-left ${
                  mode === 'rfp'
                    ? 'border-neon-purple bg-neon-purple/10'
                    : 'border-gray-800 bg-black/50 hover:border-gray-700'
                }`}
              >
                <div className="text-lg font-bold mb-2">Grade My RFP</div>
                <div className="text-sm text-gray-400">
                  Analyze the quality, clarity, and completeness of your RFP document
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('response')}
                className={`p-6 rounded-lg border-2 transition-all duration-300 text-left ${
                  mode === 'response'
                    ? 'border-neon-blue bg-neon-blue/10'
                    : 'border-gray-800 bg-black/50 hover:border-gray-700'
                }`}
              >
                <div className="text-lg font-bold mb-2">Grade My Response</div>
                <div className="text-sm text-gray-400">
                  Compare your response against the original RFP for compliance and fit
                </div>
              </button>
            </div>
          </div>

          {/* File Upload Areas */}
          <div className="space-y-6">
            {/* RFP Files Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-widest text-white">
                {mode === 'rfp' ? 'Upload Your RFP Documents *' : 'Upload the Original RFP *'}
              </label>
              <div
                onDragOver={(e) => handleDragOver(e, 'rfp')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'rfp')}
                onClick={() => rfpInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging === 'rfp'
                    ? 'border-neon-purple bg-neon-purple/10'
                    : 'border-gray-700 hover:border-gray-600 bg-black/30'
                }`}
              >
                <input
                  ref={rfpInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileSelect(e, 'rfp')}
                  className="hidden"
                  key={`rfp-${mode}`}
                />
                <div className="text-4xl mb-4">📄</div>
                <div className="text-gray-300 mb-2">
                  Drag & drop files here or click to browse
                </div>
                <div className="text-sm text-gray-500">
                  PDF, DOCX, TXT (Max 100MB per file)
                </div>
              </div>

              {/* RFP Files List */}
              {rfpFiles.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {rfpFiles.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/50 border border-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <div className="text-sm font-medium text-white">{file.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('rfp', index)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response Files Upload (Only shown in response mode) */}
            {mode === 'response' && (
              <div className="space-y-2">
                <label className="block text-sm font-bold uppercase tracking-widest text-white">
                  Upload Your Response Proposal *
                </label>
                <div
                  onDragOver={(e) => handleDragOver(e, 'response')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'response')}
                  onClick={() => responseInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragging === 'response'
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-gray-700 hover:border-gray-600 bg-black/30'
                  }`}
                >
                  <input
                    ref={responseInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => handleFileSelect(e, 'response')}
                    className="hidden"
                    key={`response-${mode}`}
                  />
                  <div className="text-4xl mb-4">📝</div>
                  <div className="text-gray-300 mb-2">
                    Drag & drop files here or click to browse
                  </div>
                  <div className="text-sm text-gray-500">
                    PDF, DOCX, TXT (Max 100MB per file)
                  </div>
                </div>

                {/* Response Files List */}
                {responseFiles.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {responseFiles.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/50 border border-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📎</span>
                          <div>
                            <div className="text-sm font-medium text-white">{file.name}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile('response', index)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Message */}
          {submitStatus && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success'
                ? 'bg-green-900/30 border border-green-700 text-green-400'
                : 'bg-red-900/30 border border-red-700 text-red-400'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className={`w-full py-6 rounded-lg font-bold uppercase tracking-widest text-lg transition-all duration-300 ${
              isFormValid() && !isSubmitting
                ? 'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-lg hover:shadow-neon-purple/50'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Submit for Grading'}
          </button>

          {/* Info Text */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Your documents will be analyzed using advanced AI.</p>
            <p>Results typically arrive within 5-10 minutes via email.</p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RFPGrader;
