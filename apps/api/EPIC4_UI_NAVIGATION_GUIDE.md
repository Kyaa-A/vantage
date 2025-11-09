# Epic 4.0: UI Navigation Guide - How to Find File Upload Fields

## 🎯 Current State

Currently, **only 1 indicator** has the file upload feature:
- **Indicator #278**: "MOV Upload Test Indicator"
- **Governance Area**: Financial Administration and Sustainability

---

## 📱 Normal User Navigation Flow

### **Option 1: Through My Assessments (Recommended)**

1. **Login** as BLGU user
   - URL: `http://localhost:3000/login`
   - Use: `test1@example.com` / your password

2. **Go to "My Assessments"**
   - Click "My Assessments" in left sidebar

3. **Click on Your Assessment**
   - You'll see Assessment #68 (or your assessment)
   - Click to open it

4. **Browse Governance Areas**
   - Scroll through the list of governance areas
   - Find **"Financial Administration and Sustainability"**
   - Expand it to see indicators

5. **Click on the Indicator**
   - Look for **"MOV Upload Test Indicator"**
   - Click to open the assessment form

6. **Fill the Form & Upload Files**
   - Scroll down to find the file upload section
   - Drag and drop files or click to browse
   - Upload your documents

### **Option 2: Through Dashboard Navigation**

1. **Go to Dashboard**
   - Click "Dashboard" in left sidebar

2. **View Assessment Progress**
   - See completion metrics
   - Click "Start Assessment" or "Continue Assessment"

3. **Navigate to Indicators**
   - Use the indicator navigation list
   - Click on indicators to complete them
   - Look for ones with file upload fields

---

## 🔧 Adding File Upload to Real Indicators

### **Step 1: List Indicators Without File Upload**

```bash
cd /home/asnari/Project/vantage/apps/api
uv run python add_file_upload_to_indicator.py list
```

**Output:**
```
📋 Indicators WITHOUT file_upload field:

    1. Indicator Name 1
    2. Indicator Name 2
    3. Indicator Name 3
    ...

Total: X indicators without file_upload
```

### **Step 2: Add File Upload to a Specific Indicator**

```bash
# Add file upload to indicator ID 15 (example)
uv run python add_file_upload_to_indicator.py 15
```

**Output:**
```
✅ Successfully added file_upload field to indicator 15
   Section: Section Name
   Field ID: mov_files
   Field Order: 3
```

### **Step 3: Verify in UI**

1. Refresh your browser
2. Navigate to the indicator you just updated
3. You should now see the file upload field!

---

## 🎯 Which Indicators Should Have File Upload?

Typically, file upload fields should be added to indicators that require **Means of Verification (MOV)** documents, such as:

- **Financial Documents**: Budget reports, financial statements
- **Governance Documents**: Ordinances, resolutions, meeting minutes
- **Compliance Documents**: Certificates, permits, licenses
- **Project Documents**: Photos, videos, receipts
- **Policy Documents**: Guidelines, manuals, procedures

### **Batch Add File Upload to Multiple Indicators**

Create a script to add file upload to multiple indicators at once:

```bash
# Add to indicators 10, 15, 20, 25
for id in 10 15 20 25; do
    uv run python add_file_upload_to_indicator.py $id
done
```

---

## 📊 Finding Indicators in the UI

### **By Governance Area:**

The application organizes indicators by **Governance Areas**:

1. **Financial Administration and Sustainability**
2. **Disaster Preparedness**
3. **Peace and Order**
4. **Business-Friendliness and Competitiveness**
5. **Environmental Management**
6. **Health Compliance and Safety**
7. **Social Protection and Sensitivity**

Each governance area contains multiple indicators. You'll need to:
1. Expand the governance area
2. Browse the list of indicators
3. Click on the indicator you want to assess
4. Fill out the form (including file upload if present)

---

## 🔍 Quick Test Navigation

**Fastest way to test file upload right now:**

```
Direct URL: http://localhost:3000/blgu/assessment/68/indicator/278
```

**OR** through UI:
```
Login → My Assessments → Assessment #68 →
Financial Administration and Sustainability →
MOV Upload Test Indicator
```

---

## 💡 Production Deployment Checklist

Before deploying to production:

1. **Identify which indicators need file upload**
   - Review with DILG team
   - Check MOV requirements per indicator

2. **Add file upload fields**
   - Use `add_file_upload_to_indicator.py`
   - Test each indicator

3. **Create user documentation**
   - Screenshot guide for BLGU users
   - Video tutorial for file upload process

4. **Test with real users**
   - BLGU users upload real MOV files
   - Assessors verify they can view files
   - Validators check access permissions

---

## 🎓 For Testing/Demo Purposes

If you want to **create more test indicators** with file upload:

```bash
# Option 1: Use the existing script
cd /home/asnari/Project/vantage/apps/api
uv run python create_test_file_upload_indicator.py

# Option 2: Add to existing indicator
uv run python add_file_upload_to_indicator.py <indicator_id>
```

This will create/update indicators that you can use to demo the file upload feature to stakeholders.
