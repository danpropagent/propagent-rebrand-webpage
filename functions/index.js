
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin SDK
admin.initializeApp();
setGlobalOptions({maxInstances: 10});

const app = express();

// Add middleware to enable CORS and parse JSON bodies
app.use(cors({origin: true}));
app.use(express.json());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/", async (req, res) => {
  const {email, userType} = req.body;

  if (!email) {
    logger.error("No email provided in request body:", req.body);
    return res.status(400).send("No email provided");
  }

  logger.info(`Received demo request for email: ${email}`);

  try {
    /*
    // Save the request to Firestore
    const requests = admin.firestore().collection("demo_requests");
    const writeResult = await requests.add({
      email: email,
      userType: userType || "unspecified",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    logger.info(`Request saved to Firestore with ID: ${writeResult.id}`);
    */

    // Send email notification
    const mailOptions = {
      from: `Propagent Demo <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Sends email to yourself
      subject: "New Propagent Demo Request",
      html: `<p>You have received a new demo request:</p>
               <ul>
                 <li><b>Email:</b> ${email}</li>
                 <li><b>User Type:</b> ${userType || "unspecified"}</li>
               </ul>`,
    };

    await transporter.sendMail(mailOptions);
    logger.info("Email notification sent successfully.");

    const successMessage = "Demo request received and email sent!";
    return res.status(200).send({message: successMessage});
  } catch (error) {
    logger.error("Error processing request:", error);
    return res.status(500).send("Error processing request.");
  }
});

// Grant the function access to the specified secrets
const options = {secrets: ["EMAIL_USER", "EMAIL_PASS"]};
exports.api = onRequest(options, app);

// Export the RFP grader function
exports.gradeRfp = require("./rfpGrader").gradeRfp;
