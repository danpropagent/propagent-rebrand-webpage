const express = require("express");
const {exec} = require("child_process");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

// Increase JSON body limit for large files
app.use(express.json({limit: "100mb"}));

// Convert DOCX to PDF endpoint
app.post("/convert", async (req, res) => {
  try {
    const {content, fileName} = req.body; // content is base64 string

    // Write DOCX content to temp file
    const timestamp = Date.now();
    const tempDocx = `/tmp/${timestamp}_${fileName}`;
    const buffer = Buffer.from(content, "base64");
    fs.writeFileSync(tempDocx, buffer);

    // Convert using LibreOffice
    await new Promise((resolve, reject) => {
      exec(
          `libreoffice --headless --convert-to pdf --outdir /tmp` +
          ` "${tempDocx}"`,
          (error, stdout, stderr) => {
            if (error) {
              console.error("LibreOffice error:", stderr);
              reject(error);
            } else {
              resolve();
            }
          },
      );
    });

    // Read converted PDF
    const pdfFileName = fileName.replace(".docx", ".pdf");
    const tempPdf = `/tmp/${timestamp}_${pdfFileName}`;
    const pdfBuffer = fs.readFileSync(tempPdf);
    const pdfBase64 = pdfBuffer.toString("base64");

    // Cleanup temp files
    fs.unlinkSync(tempDocx);
    fs.unlinkSync(tempPdf);

    // Return base64 PDF content
    res.json({
      content: pdfBase64,
      fileName: pdfFileName,
      mimeType: "application/pdf",
    });
  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).json({
      error: "Conversion failed",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({status: "healthy"});
});

app.listen(PORT, () => console.log(`Converter listening on port ${PORT}`));
