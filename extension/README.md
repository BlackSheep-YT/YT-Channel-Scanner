# YouTube Channel Scanner & CSV Exporter (Chrome Extension)

Scan any YouTube channel and list down all **Videos**, **Shorts**, and **Live Streams** in **Date Wise** order (including **Members-Only videos without needing a membership**) and export directly to a structured **CSV file**.

---

## 🚀 How to Install in Google Chrome

1. **Open Extensions Page:**
   - In Google Chrome, open a new tab and go to:  
     `chrome://extensions/`

2. **Enable Developer Mode:**
   - Turn **ON** the **"Developer mode"** toggle switch in the top-right corner of the Extensions page.

3. **Load the Extension:**
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select this `extension` directory (containing `manifest.json`).

4. **Scan Any Channel:**
   - Open any YouTube channel (e.g., `https://www.youtube.com/@mkbhd` or `https://www.youtube.com/@LinusTechTips`).
   - Click the **Extension icon** in your Chrome toolbar.
   - Choose tabs to scan (**Videos**, **Shorts**, **Live**), select your depth, and click **"Scan Channel"**.
   - Click **"Download CSV"** to export your formatted spreadsheet!

---

## 📊 CSV Export Format

The output CSV strictly includes the requested fields:

```csv
Video Title,Video Link,Video Date,Video Category,Video Access Type,Membership Level
"Exclusive BTS Stream","https://www.youtube.com/watch?v=xyz","2026-09-08","Live","Members-only","Members only"
"New Tech Review","https://www.youtube.com/watch?v=abc","2026-09-10","Video","Public","Public"
```

- **Video Category**: `Video`, `Shorts`, or `Live`
- **Video Access Type**: `Public` or `Members-only`
- **Membership Level**: `Public`, `Members only`, or custom Tier name
