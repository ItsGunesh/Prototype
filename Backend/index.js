import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Razorpay credentials
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
// console.log('Razorpay Key ID:', key_id);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Sample PIN for demonstration purposes (In real systems, securely manage PINs)
const userPin = '1234'; 

// Step 1: Verify PIN before proceeding
app.post('/verifyPin', (req, res) => {
    const { pin } = req.body;

    if (pin === userPin) {
        res.json({ success: true, message: 'PIN Verified' });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect PIN' });
    }
});

// Step 2: Check if contact exists on Razorpay
const checkContactExists = async (person) => {
    try {
        const response = await axios.get('https://api.razorpay.com/v1/fund_accounts', {
            auth: {
                username: key_id,
                password: key_secret
            }
        });

        const contacts = response.data.items;

        // Find contact by matching person's name in bank account or wallet
        const contact = contacts.find(c => {
            if (c.account_type === 'bank_account' && c.bank_account && c.bank_account.name.toLowerCase() === person.toLowerCase()) {
                return true;
            }
            if (c.account_type === 'wallet' && c.wallet && c.wallet.name.toLowerCase() === person.toLowerCase()) {
                return true;
            }
            return false;
        });

        return contact ? contact.id : null;
    } catch (error) {
        console.error('Error checking contact:', error);
        return null;
    }
};

// Step 3: Process payment
app.post('/processPayment', async (req, res) => {
    const { amount, person } = req.body;

    // Check if contact exists
    const contactId = await checkContactExists(person);
    // console.log('Contact ID:', contactId);

    if (!contactId) {
        return res.status(404).json({ success: false, message: `Contact ${person} does not exist.` });
    }

    const fundAccountId = contactId;
    // console.log("amount :" ,amount)

    // If contact exists, initiate payout
    try {
        const payoutResponse = await axios({
            method: 'POST',
            url: 'https://api.razorpay.com/v1/payouts',
            auth: {
                username: key_id,
                password: key_secret
            },
            data: {
                account_number: process.env.ACCOUNT_NUMBER,
                fund_account_id: fundAccountId,
                amount: amount * 100, // Amount in paisa (smallest unit)
                currency: 'INR',
                mode: 'NEFT', // Can be changed to IMPS, RTGS, etc.
                purpose: 'refund',
                queue_if_low_balance: true, 
                reference_id: `Txn-${Date.now()}`, // Unique reference ID
                narration: 'Payment Transfer',
                notes: {
                    note1: 'Important note',
                    note2: 'Transaction details'
                }
            }
        });

        // console.log('Payment Response:', payoutResponse.data);
        res.json({
            success: true,
            message: `₹${amount} sent to ${person} successfully.`,
            payoutResponse: payoutResponse.data
        });
    } catch (error) {
        console.error('Error initiating payout:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Transaction failed.', 
            error: error.response ? error.response.data : error.message 
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
