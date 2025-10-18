// Email notification service for bill status updates

// Use local API in development, deployed API in production
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api'  // Local development
  : 'https://us-central1-nfc-finance-app.cloudfunctions.net/api'; // Firebase Functions deployment

export const sendEmailNotification = async (emailData) => {
  try {
    const response = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const emailTemplates = {
  billSubmitted: (bill, user) => ({
    to: user.email,
    subject: 'Bill Submitted Successfully',
    html: `
      <h2>Bill Submission Confirmation</h2>
      <p>Dear ${user.firstName || 'User'},</p>
      <p>Your bill has been successfully submitted for review.</p>
      <h3>Bill Details:</h3>
      <ul>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
        <li><strong>Category:</strong> ${bill.category}</li>
        <li><strong>Bill Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</li>
      </ul>
      <p>You will receive an email notification once your bill is reviewed.</p>
      <p>Thank you!</p>
    `
  }),

  billApproved: (bill, user) => ({
    to: user.email,
    subject: 'Bill Approved',
    html: `
      <h2>Bill Approved</h2>
      <p>Dear ${user.firstName || 'User'},</p>
      <p>Great news! Your bill has been approved.</p>
      <h3>Bill Details:</h3>
      <ul>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
        <li><strong>Settlement Date:</strong> ${new Date(bill.dateOfSettlement).toLocaleDateString()}</li>
      </ul>
      <p>The reimbursement will be processed shortly.</p>
      <p>Thank you!</p>
    `
  }),

  billRejected: (bill, user, remarks) => ({
    to: user.email,
    subject: 'Bill Rejected',
    html: `
      <h2>Bill Rejected</h2>
      <p>Dear ${user.firstName || 'User'},</p>
      <p>Unfortunately, your bill has been rejected.</p>
      <h3>Bill Details:</h3>
      <ul>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
      </ul>
      <h3>Reason for Rejection:</h3>
      <p>${remarks}</p>
      <p>If you have questions, please contact the finance team.</p>
      <p>Thank you!</p>
    `
  }),

  billNeedsUpdate: (bill, user, remarks) => ({
    to: user.email,
    subject: 'Bill Needs Update',
    html: `
      <h2>Bill Returned for Update</h2>
      <p>Dear ${user.firstName || 'User'},</p>
      <p>Your bill has been returned and needs to be updated before approval.</p>
      <h3>Bill Details:</h3>
      <ul>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
      </ul>
      <h3>Update Required:</h3>
      <p>${remarks}</p>
      <p>Please log in to update your bill and resubmit it.</p>
      <p>Thank you!</p>
    `
  }),

  draftReminder: (bill, user) => ({
    to: user.email,
    subject: 'Draft Bill Reminder',
    html: `
      <h2>Draft Bill Reminder</h2>
      <p>Dear ${user.firstName || 'User'},</p>
      <p>You have a draft bill that has been idle for more than 7 days.</p>
      <h3>Draft Details:</h3>
      <ul>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
        <li><strong>Created:</strong> ${new Date(bill.entryDate).toLocaleDateString()}</li>
      </ul>
      <p>Please complete and submit your bill to avoid any delays.</p>
      <p>Thank you!</p>
    `
  }),

  adminNewSubmission: (bill, admin) => ({
    to: admin.email,
    subject: 'New Bill Submission',
    html: `
      <h2>New Bill Submission</h2>
      <p>Dear Admin,</p>
      <p>A new bill has been submitted for review.</p>
      <h3>Bill Details:</h3>
      <ul>
        <li><strong>Submitted by:</strong> ${bill.personName}</li>
        <li><strong>Description:</strong> ${bill.description}</li>
        <li><strong>Amount:</strong> ₹${Number(bill.amount).toLocaleString()}</li>
        <li><strong>Category:</strong> ${bill.category}</li>
      </ul>
      <p>Please review the bill in the admin dashboard.</p>
    `
  }),

  adminWeeklyDigest: (stats, admin) => ({
    to: admin.email,
    subject: 'Weekly Bills Digest',
    html: `
      <h2>Weekly Bills Summary</h2>
      <p>Dear Admin,</p>
      <p>Here's your weekly summary of bill activities:</p>
      <h3>This Week:</h3>
      <ul>
        <li><strong>New Submissions:</strong> ${stats.newSubmissions}</li>
        <li><strong>Approved:</strong> ${stats.approved}</li>
        <li><strong>Rejected:</strong> ${stats.rejected}</li>
        <li><strong>Pending:</strong> ${stats.pending}</li>
        <li><strong>Total Amount Approved:</strong> ₹${stats.totalApproved.toLocaleString()}</li>
      </ul>
      <p>Please check the dashboard for detailed analytics.</p>
    `
  })
};