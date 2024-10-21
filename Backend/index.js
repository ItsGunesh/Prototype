import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const key_id = process.env.RAZORPAY_KEY_ID;
console.log(key_id);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Function to check if contact exists on Razorpay
const checkContactExists = async (person) => {
    try {
        const response = await axios.get('https://api.razorpay.com/v1/fund_accounts', {
            auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_KEY_SECRET
            }
        });

        let contacts = response.data.items;

        // Find contact by comparing the person's name with both bank account and wallet names
        let contact = contacts.find(c => {
            if (c.account_type === 'bank_account' && c.bank_account && c.bank_account.name.toLowerCase() === person.toLowerCase()) {
                return true;
            }
            if (c.account_type === 'wallet' && c.wallet && c.wallet.name.toLowerCase() === person.toLowerCase()) {
                return true;
            }
            return false;
        });

        // Return the ID if contact found, otherwise return null
        return contact ? contact.id : null;
    } catch (error) {
        console.error('Error checking contact:', error);
        return null;
    }
};

// Route to process payment
app.post('/processPayment', async (req, res) => {
    const { amount, person } = req.body;

    // Check if contact exists
    let contactId = await checkContactExists(person);
    console.log('Contact ID:', contactId);

    

    if (!contactId) {
        return res.json({ success: false, message: `Contact ${person} does not exist.` });
    }

    const fid = contactId;

    // If contact exists, initiate payout
    try {
        const payoutResponse = await axios({
            method: 'POST',
            url: 'https://api.razorpay.com/v1/payouts',
            auth: {
                username: process.env.RAZORPAY_KEY_ID,
                password: process.env.RAZORPAY_KEY_SECRET
            },
            data: {
                account_number: process.env.ACCOUNT_NUMBER,
                fund_account_id: fid,
                amount: amount*100,
                currency: "INR",
                mode: "NEFT",
                purpose: "refund",
                queue_if_low_balance: true, 
                reference_id: "Acme Transaction ID 12345",
                narration: "Acme Corp Fund Transfer",
                notes:{
                  random_key_1: "Make it so.",
                  random_key_2: "Tea. Earl Grey. Hot."
                }
            }
        });

        console.log("Payment Response:", payoutResponse.data);
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