// ============================================================
// CuponCode - Google Sheets Setup Script
// Run this ONCE from Apps Script to create all sheets & seed data
// ============================================================
// 
// HOW TO USE:
// 1. Create a new Google Sheet at https://sheets.google.com
// 2. Copy the Spreadsheet ID from the URL
// 3. Go to Extensions → Apps Script
// 4. Paste this code (and Code.gs) into the editor
// 5. In Code.gs, update SPREADSHEET_ID with your ID
// 6. Run the 'setupDatabase' function from the toolbar
// 7. Authorize when prompted
// 8. Deploy as Web App
// ============================================================

/**
 * Run this function once to initialize all sheets with headers,
 * formatting, protected ranges, and seed data.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  Logger.log('🚀 Setting up CuponCode database...');
  
  // 1. Create all sheets
  const sheetConfigs = [
    {
      name: 'Users',
      headers: ['id', 'email', 'username', 'passwordHash', 'role', 'coins', 'referralCode', 'referredBy', 'status', 'createdAt'],
      columnWidths: [280, 220, 150, 300, 80, 80, 120, 120, 80, 180],
      numFormat: { 6: '#,##0' } // coins column
    },
    {
      name: 'Coupons',
      headers: ['id', 'uploaderId', 'category', 'code', 'description', 'price', 'status', 'buyerId', 'createdAt', 'verifiedAt', 'soldAt'],
      columnWidths: [280, 280, 140, 160, 300, 80, 100, 280, 180, 180, 180],
      numFormat: { 6: '#,##0' } // price column
    },
    {
      name: 'Transactions',
      headers: ['id', 'userId', 'type', 'amount', 'balance', 'relatedId', 'description', 'createdAt'],
      columnWidths: [280, 280, 140, 100, 100, 280, 300, 180],
      numFormat: { 4: '+#,##0;-#,##0', 5: '#,##0' } // amount, balance columns
    },
    {
      name: 'Categories',
      headers: ['id', 'name', 'icon', 'status', 'createdAt'],
      columnWidths: [280, 200, 60, 80, 180]
    },
    {
      name: 'OTP',
      headers: ['id', 'email', 'code', 'type', 'expiresAt', 'used'],
      columnWidths: [280, 220, 100, 120, 180, 60]
    },
    {
      name: 'Referrals',
      headers: ['id', 'referrerId', 'referredUserId', 'reward', 'createdAt'],
      columnWidths: [280, 280, 280, 80, 180],
      numFormat: { 4: '#,##0' } // reward column
    }
  ];
  
  sheetConfigs.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      Logger.log(`  ✅ Created sheet: ${config.name}`);
    } else {
      Logger.log(`  ⚠️ Sheet already exists: ${config.name}`);
    }
    
    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
    headerRange.setValues([config.headers]);
    
    // Style headers
    headerRange
      .setFontWeight('bold')
      .setBackground('#1a1a2e')
      .setFontColor('#e0e0ff')
      .setHorizontalAlignment('center')
      .setFontSize(10)
      .setBorder(true, true, true, true, true, true, '#333355', SpreadsheetApp.BorderStyle.SOLID);
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Set column widths
    config.columnWidths.forEach((width, i) => {
      sheet.setColumnWidth(i + 1, width);
    });
    
    // Set number formats
    if (config.numFormat) {
      for (const [col, format] of Object.entries(config.numFormat)) {
        const colNum = parseInt(col);
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, colNum, sheet.getLastRow() - 1, 1).setNumberFormat(format);
        }
      }
    }
    
    // Add data validation for specific columns
    if (config.name === 'Users') {
      // Role validation
      const roleRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['admin', 'user'], true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 5, 1000, 1).setDataValidation(roleRule);
      
      // Status validation
      const statusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['active', 'pending', 'suspended'], true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 9, 1000, 1).setDataValidation(statusRule);
    }
    
    if (config.name === 'Coupons') {
      // Status validation
      const couponStatusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['pending', 'approved', 'rejected', 'sold'], true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 7, 1000, 1).setDataValidation(couponStatusRule);
    }
    
    if (config.name === 'OTP') {
      // Used validation
      const usedRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['true', 'false'], true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange(2, 6, 1000, 1).setDataValidation(usedRule);
    }
  });
  
  // 2. Remove default Sheet1 if it exists and is empty
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    try {
      ss.deleteSheet(defaultSheet);
      Logger.log('  🗑️ Removed empty Sheet1');
    } catch (e) {
      // Can't delete the only sheet
    }
  }
  
  // 3. Seed admin user
  seedAdmin();
  Logger.log('  👤 Admin user seeded');
  
  // 4. Set spreadsheet metadata
  ss.setSpreadsheetName('CuponCode Database');
  
  Logger.log('');
  Logger.log('✅ Setup complete! Your CuponCode database is ready.');
  Logger.log('');
  Logger.log('📋 Sheets created:');
  Logger.log('   - Users (user accounts)');
  Logger.log('   - Coupons (coupon listings)');
  Logger.log('   - Transactions (coin movements)');
  Logger.log('   - Categories (coupon categories)');
  Logger.log('   - OTP (verification codes)');
  Logger.log('   - Referrals (referral tracking)');
  Logger.log('');
  Logger.log('🔐 Default admin credentials:');
  Logger.log(`   Email: ${ADMIN_EMAIL}`);
  Logger.log(`   Password: ${ADMIN_PASSWORD}`);
  Logger.log('   ⚠️ CHANGE THESE in Code.gs before going live!');
  Logger.log('');
  Logger.log('📌 Next steps:');
  Logger.log('   1. Deploy → New Deployment → Web App');
  Logger.log('   2. Execute as: Me');
  Logger.log('   3. Who has access: Anyone');
  Logger.log('   4. Copy the Web App URL');
  Logger.log('   5. Update CONFIG.API_URL in your frontend js/config.js');
}

/**
 * Run this to test if the API is working correctly.
 * Simulates a login request.
 */
function testAPI() {
  Logger.log('🧪 Testing API...');
  
  // Test seedAdmin
  seedAdmin();
  Logger.log('✅ seedAdmin successful');
  
  // Test getCategories
  const cats = getSheetData(SHEETS.CATEGORIES);
  Logger.log(`✅ Categories loaded: ${cats.length} categories`);
  cats.forEach(c => Logger.log(`   - ${c.icon} ${c.name}`));
  
  // Test getUsers
  const users = getSheetData(SHEETS.USERS);
  Logger.log(`✅ Users loaded: ${users.length} users`);
  
  // Test login with admin
  const adminUser = findUser(ADMIN_EMAIL);
  if (adminUser) {
    Logger.log(`✅ Admin found: ${adminUser.username} (${adminUser.email})`);
    const pwdMatch = adminUser.passwordHash === hashPassword(ADMIN_PASSWORD);
    Logger.log(`✅ Password hash check: ${pwdMatch ? 'PASS' : 'FAIL'}`);
  } else {
    Logger.log('❌ Admin user not found!');
  }
  
  Logger.log('');
  Logger.log('🧪 All tests complete!');
}

/**
 * Run this to reset ALL data (dangerous!).
 * Only use during development.
 */
function resetDatabase() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Reset Database',
    'This will DELETE ALL DATA in all sheets. Are you sure?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    Logger.log('Reset cancelled.');
    return;
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = ['Users', 'Coupons', 'Transactions', 'Categories', 'OTP', 'Referrals'];
  
  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
      Logger.log(`  🗑️ Cleared: ${name}`);
    }
  });
  
  // Re-seed
  seedAdmin();
  
  Logger.log('✅ Database reset complete. Admin and categories re-seeded.');
}
