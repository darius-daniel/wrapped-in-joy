# Notifying the First Participant

## The Problem

When the first person signs up, they don't know who they're gifting to yet. They need to be informed after the second participant registers.

## Solution Implemented: "Check Your Assignment" Page ✅

I've created a self-service page where anyone can check their assignment by entering their phone number.

### How It Works

1. **Participant visits:** `http://localhost:3000/check-assignment`
2. **Enters their phone number** (the one they registered with)
3. **Sees their assignment:**
   - If assigned: Shows name, phone, serial number of recipient
   - If not assigned yet: Shows "Waiting for assignment" message

### For the First Participant

**Scenario:**
1. Alice signs up first (Serial #1)
2. Alice visits `/check-assignment` and enters her phone
3. **Before Bob signs up:** "You'll be notified once you're assigned to someone!"
4. Bob signs up and selects Alice (Serial #2)
5. Alice visits `/check-assignment` again
6. **After Bob signs up:** "You will be gifting to: Bob, Serial #2, +234..."

### Access Points

The check assignment page is linked from:
- Success message after registration: "Check your assignment later"
- Signup form bottom: "Already registered? Check your assignment"
- Direct URL: `/check-assignment`

### Security Note

This uses phone number as a simple authentication. Anyone with the phone number can check that person's assignment. For 200 trusted participants, this should be fine. If you need more security, see "Option 4" below.

---

## Alternative Notification Methods

### Option 2: WhatsApp Notification (Manual)

Since you have everyone's WhatsApp number, you can manually message them:

**After second person signs up:**
```
Hi Alice! 👋

You've been assigned in the gift exchange!

You will be gifting to:
Bob
Serial #2
+234 803 222 2222

Check anytime at: [your-domain]/check-assignment
```

**Pros:**
- Personal touch
- Guaranteed delivery
- Can answer questions immediately

**Cons:**
- Manual work
- Requires monitoring new signups

### Option 3: Automated WhatsApp (Requires Setup)

Use WhatsApp Business API to send automated messages:

**Setup needed:**
```bash
# Install WhatsApp library
pnpm add whatsapp-web.js

# Or use a service like Twilio
pnpm add twilio
```

**Code example:**
```typescript
// In app/actions.ts, after creating second participant:
async function notifyFirstParticipant(firstParticipant, secondParticipant) {
  const message = `Hi ${firstParticipant.name}! 
  
You've been assigned in the gift exchange!
You will be gifting to: ${secondParticipant.name}

Check anytime at: ${process.env.APP_URL}/check-assignment`;

  await sendWhatsAppMessage(firstParticipant.phoneNumber, message);
}
```

**Pros:**
- Fully automated
- Instant notification
- Professional

**Cons:**
- Requires WhatsApp Business API setup
- May have costs
- Needs phone number verification

### Option 4: Email Notification (If you add email field)

Add an email field to registration and send emails:

**Setup:**
```bash
pnpm add nodemailer
# Or use services like SendGrid, Resend, etc.
```

**Pros:**
- Easy to implement
- No API approval needed
- Good for record keeping

**Cons:**
- Requires adding email to signup form
- May go to spam
- People check WhatsApp more frequently

### Option 5: SMS Notification (Requires Twilio/similar)

Send SMS when assignment is made:

**Setup:**
```bash
pnpm add twilio
```

**Code example:**
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function notifyViasSMS(phoneNumber: string, message: string) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
}
```

**Pros:**
- Reliable delivery
- Works on all phones
- Professional

**Cons:**
- Costs money per SMS
- Requires Twilio account
- Setup overhead

---

## Recommended Approach for Your Use Case

For ~200 participants, I recommend a **hybrid approach**:

### 1. Self-Service (Primary) ✅ Already Implemented
- Use the `/check-assignment` page
- People can check anytime
- No ongoing maintenance

### 2. Initial Notification (Secondary)
Choose ONE:
- **Manual WhatsApp message** to the first participant after second signs up
- **Group announcement** in your WhatsApp group: "Everyone can now check their assignments at [link]"
- **Automated WhatsApp** if you want to scale this for future events

---

## Implementation: Add Automated WhatsApp Notification

If you want to add automated WhatsApp notifications, here's how:

### Using Twilio (Easiest)

**1. Sign up for Twilio:**
- Go to twilio.com
- Get a WhatsApp-enabled number
- Copy your Account SID and Auth Token

**2. Install Twilio:**
```bash
pnpm add twilio
```

**3. Add to .env:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**4. Create notification helper:**

```typescript
// lib/notifications.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function notifyWhatsApp(
  to: string,
  recipientName: string,
  recipientSerial: number,
  recipientPhone: string
) {
  const message = `🎁 Gift Exchange Update!

You've been assigned!

You will be gifting to:
${recipientName}
Serial #${recipientSerial}
${recipientPhone}

Check anytime at: ${process.env.NEXT_PUBLIC_APP_URL}/check-assignment`;

  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });
    console.log(`WhatsApp sent to ${to}`);
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    // Don't fail the signup if notification fails
  }
}
```

**5. Add to signup action:**

```typescript
// In app/actions.ts, after updating first participant:
import { notifyWhatsApp } from '@/lib/notifications';

// After line where first participant is updated
if (firstParticipant && firstParticipant.selectedNumber === null) {
  await db.orm.public.Participant.where({
    id: firstParticipant.id,
  }).update({
    selectedNumber: newSerialNumber,
    updatedAt: new Date(),
  });

  // Send WhatsApp notification
  await notifyWhatsApp(
    firstParticipant.phoneNumber,
    trimmedName, // second participant's name
    newSerialNumber,
    trimmedPhone
  );
}
```

---

## Monitoring Assignments

### Simple Admin Query

You can check who's been assigned in the database:

```sql
-- Check if first participant has been assigned
SELECT 
  "serialNumber",
  "name",
  "phoneNumber",
  CASE 
    WHEN "selectedNumber" IS NULL THEN 'Not assigned yet'
    ELSE 'Assigned to #' || "selectedNumber"
  END as status
FROM "Participant"
WHERE "serialNumber" = 1;

-- See all assignments
SELECT 
  p1."serialNumber" as "From",
  p1."name" as "Giver",
  p1."selectedNumber" as "To",
  p2."name" as "Receiver"
FROM "Participant" p1
LEFT JOIN "Participant" p2 ON p1."selectedNumber" = p2."serialNumber"
ORDER BY p1."serialNumber";
```

---

## Testing the Check Assignment Feature

### Test 1: Before Assignment
```bash
1. Register first participant (Alice, +234 111)
2. Visit /check-assignment
3. Enter: +234 111
4. Should see: "You'll be notified once you're assigned to someone!"
```

### Test 2: After Assignment
```bash
1. Register second participant (Bob, +234 222, selects Alice)
2. Visit /check-assignment
3. Enter: +234 111 (Alice's number)
4. Should see: "You will be gifting to: Bob, Serial #2, +234 222"
```

### Test 3: Wrong Number
```bash
1. Visit /check-assignment
2. Enter: +234 999 (not registered)
3. Should see: "No registration found with this phone number"
```

---

## User Flow Diagram

```
First Participant (Alice)
    ↓
Registers → Gets Serial #1
    ↓
Visits /check-assignment
    ↓
Enters phone number
    ↓
Sees: "Waiting for assignment..."
    ↓
[Later: Bob registers]
    ↓
Alice visits /check-assignment again
    ↓
Sees: "You're gifting to Bob"
```

---

## Future Enhancements

1. **Real-time Updates**: WebSocket to push notification to browser when assigned
2. **QR Code**: Generate unique QR code for each participant to check faster
3. **Email Reminders**: "Don't forget to check your assignment!"
4. **Push Notifications**: Browser push notifications when assigned
5. **Assignment History**: Show when they were assigned (timestamp)

---

## Summary

**Current Solution (✅ Implemented):**
- Self-service `/check-assignment` page
- Participants can check anytime by entering phone number
- Simple, no setup required, works immediately

**Recommended Next Step:**
1. Test the check assignment page
2. If needed, add manual WhatsApp notification for first participant
3. If scaling to future events, consider automated WhatsApp via Twilio

**Cost:**
- Check assignment page: $0 (free)
- Manual WhatsApp: $0 (free)
- Automated WhatsApp (Twilio): ~$0.005 per message

For your use case with 200 participants, the check assignment page should be sufficient. You can always add automated notifications later if needed!
