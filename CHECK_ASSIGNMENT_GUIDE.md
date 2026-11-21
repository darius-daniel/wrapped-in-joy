# Check Assignment Feature - User Guide

## Overview

The "Check Assignment" page allows any participant to look up who they're gifting to by entering their phone number.

## Access the Page

**URL:** `http://localhost:3000/check-assignment`

**Or click these links:**
- From signup success message: "Check your assignment later"
- From signup form: "Already registered? Check your assignment"

---

## How to Use

### Step 1: Visit the Page
Navigate to `/check-assignment`

### Step 2: Enter Your Phone Number
Use the **exact same phone number** you used when registering.

### Step 3: Click "Check Assignment"

### Step 4: View Your Assignment

---

## What You'll See

### Scenario A: You've Been Assigned

```
┌─────────────────────────────────────────┐
│         Your Assignment                 │
│                                         │
│  You are:                               │
│  Alice                                  │
│  Serial #1                              │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│  You will be gifting to:                │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │  Bob                              │ │
│  │  Serial #2                        │ │
│  │  +234 803 222 2222                │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Check Another Number]                 │
└─────────────────────────────────────────┘
```

### Scenario B: Not Assigned Yet (First Participant Before Second Signs Up)

```
┌─────────────────────────────────────────┐
│         Your Assignment                 │
│                                         │
│  You are:                               │
│  Alice                                  │
│  Serial #1                              │
│                                         │
│  ────────────────────────────────────   │
│                                         │
│             ⏳                          │
│                                         │
│  You'll be notified once you're         │
│  assigned to someone!                   │
│                                         │
│  Check back later or we'll notify you!  │
│                                         │
│  [Check Another Number]                 │
└─────────────────────────────────────────┘
```

### Scenario C: Phone Number Not Found

```
┌─────────────────────────────────────────┐
│      Check Your Assignment              │
│                                         │
│  Enter your phone number to see who     │
│  you're gifting to                      │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ No registration found with this   ║ │
│  ║ phone number                      ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  Your Phone/WhatsApp Number:            │
│  [+234 999 999 9999____]                │
│  Use the same number you registered     │
│  with                                   │
│                                         │
│  [Check Assignment]                     │
│                                         │
│  Haven't registered yet? Sign up here   │
└─────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: First Participant Checking Before Second Signs Up

**When:** Alice is the first to register  
**Action:** Alice visits `/check-assignment` and enters her phone  
**Result:** "You'll be notified once you're assigned to someone!"  
**What to do:** Check back after more people sign up, or wait for notification

### Use Case 2: First Participant Checking After Second Signs Up

**When:** Bob has registered and selected Alice  
**Action:** Alice visits `/check-assignment` again  
**Result:** "You will be gifting to: Bob, Serial #2, +234 803 222 2222"  
**What to do:** Note down Bob's details, plan your gift!

### Use Case 3: Regular Participant Checking

**When:** Charlie registered and selected someone  
**Action:** Charlie visits `/check-assignment` and enters his phone  
**Result:** Shows who Charlie selected (should be the same info from signup success)  
**What to do:** Confirm or refresh your memory about who you're gifting to

### Use Case 4: Someone Forgot Who They're Gifting To

**When:** Days after registration, can't remember  
**Action:** Visit `/check-assignment`, enter phone  
**Result:** Shows their assignment  
**What to do:** Take a screenshot for reference!

### Use Case 5: Wrong Phone Number

**When:** Types phone number incorrectly  
**Action:** Enters phone, gets "No registration found"  
**Result:** Error message  
**What to do:** 
- Check for typos
- Make sure you're using the exact format you registered with
- Try with/without country code
- If still fails, contact organizer

---

## Tips for Participants

### ✅ Do's

1. **Use the exact phone number** you registered with
2. **Include the country code** if you registered with it
3. **Check back later** if not assigned yet (first participant)
4. **Screenshot the result** so you don't forget
5. **Check multiple times** if you're unsure

### ❌ Don'ts

1. **Don't panic** if not assigned yet - check back later
2. **Don't share** others' assignments - keep it secret!
3. **Don't change** the phone number format (if you registered with spaces, use spaces)

---

## Phone Number Format Matching

The system looks for an **exact match**. These are DIFFERENT:

- `+234 803 123 4567` ≠ `08031234567`
- `+234-803-123-4567` ≠ `+234 803 123 4567`
- `(234) 803-123-4567` ≠ `+234 803 123 4567`

**Solution:** Use the exact format you entered during registration.

---

## Troubleshooting

### "No registration found with this phone number"

**Possible causes:**
1. You haven't registered yet → Go to `/signup`
2. Phone number format is different → Try different format
3. Typo in phone number → Double-check and try again
4. Registered with a different number → Try that number

**Solutions:**
```
Try these variations:
- With country code: +234 803 123 4567
- Without country code: 08031234567
- With different spacing: +234-803-123-4567
- With parentheses: +234 (803) 123 4567
```

### "You'll be notified once you're assigned"

**This is normal for the first participant!**

**What it means:** You're Serial #1, waiting for Serial #2 to register

**What to do:**
1. Wait for second person to sign up
2. Check back in a few hours/days
3. Or wait for notification from organizer

### Page Won't Load

**Possible causes:**
1. Server is down
2. Wrong URL
3. Network issue

**Solutions:**
1. Check URL is correct: `/check-assignment`
2. Try refreshing the page
3. Check your internet connection
4. Contact organizer

---

## For Organizers: How to Direct People

### In WhatsApp Group
```
🎁 Gift Exchange Update!

Want to check who you're gifting to?
Visit: [your-domain]/check-assignment

Enter your phone number and you'll see your assignment!

Haven't registered? Sign up at: [your-domain]/signup
```

### In Email
```
Subject: Check Your Gift Exchange Assignment

Hi everyone!

You can now check your gift exchange assignment anytime by visiting:
[your-domain]/check-assignment

Just enter the phone number you registered with, and you'll see:
- Your serial number
- Who you're gifting to
- Their contact information

If you haven't registered yet, sign up at:
[your-domain]/signup

Happy gifting! 🎁
```

### QR Code
Generate a QR code pointing to `/check-assignment` and share it:
- In printed flyers
- In WhatsApp group
- On social media

---

## Privacy & Security

### What Information is Visible?

When you check your assignment, you see:
- ✅ Your own name and serial number
- ✅ Your recipient's name, serial number, and phone
- ❌ NOT who is gifting to YOU (that's the secret!)
- ❌ NOT other people's assignments

### Can Anyone Check My Assignment?

**Yes**, if they know your phone number. This is intentional for convenience.

**For 200 trusted participants**, this should be fine.

**If you need more security:**
- See NOTIFICATIONS.md for options to add PIN codes or email verification
- Contact organizer to implement additional authentication

---

## Testing Checklist

### As First Participant
- [ ] Register as first person
- [ ] Check assignment immediately → Should show "waiting"
- [ ] Wait for second person to register
- [ ] Check assignment again → Should show second person's details

### As Regular Participant
- [ ] Register (not first)
- [ ] Check assignment after registration → Should match signup success message
- [ ] Check assignment days later → Should still show same person

### Edge Cases
- [ ] Try wrong phone number → Should show error
- [ ] Try unregistered number → Should show error
- [ ] Check assignment multiple times → Should show same result

---

## Future Enhancements

Potential improvements:
1. **Auto-refresh**: Page checks for updates automatically
2. **QR Code**: Each participant gets unique QR code for faster access
3. **Push Notifications**: Browser notification when assigned
4. **Assignment History**: Show when you were assigned
5. **Gift Status**: Mark gift as purchased/delivered
6. **Wishlist**: See recipient's preferences

---

## Summary

**Purpose:** Let participants check who they're gifting to anytime

**URL:** `/check-assignment`

**How:** Enter phone number → See assignment

**For First Participant:**
- Before second signs up: "Waiting for assignment"
- After second signs up: Shows second participant's details

**Simple, self-service, works immediately!** 🎁
