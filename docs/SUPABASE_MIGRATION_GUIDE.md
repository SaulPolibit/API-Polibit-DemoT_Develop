# Supabase Migration Guide

This guide will help you complete the migration from MongoDB to Supabase PostgreSQL.

## Progress

✅ Supabase client installed
✅ Environment variables configured
✅ Database configuration updated
✅ SQL schema created
✅ Supabase model helpers created
⏳ Pending: Apply schema and update routes

---

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Project name**: Your choice
   - **Database password**: Save this securely!
   - **Region**: Choose closest to your users
4. Wait ~2 minutes for project creation

---

## Step 2: Get Your Credentials

1. Once your project is ready, go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (also starts with `eyJ...`) - Keep this secret!

---

## Step 3: Update Your .env File

Open your `.env` file and replace the placeholder values:

\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**Important**: Never commit these values to Git!

---

## Step 4: Run the SQL Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `docs/supabase-schema.sql`
5. Paste into the query editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Verify all tables were created:
   - Go to **Table Editor** in the sidebar
   - You should see: users, companies, refresh_tokens, notification_settings, smart_contracts, projects

---

## Step 5: Update Your Routes to Use Supabase Models

You have two options:

### Option A: Direct Replacement (Recommended)

Replace your Mongoose model imports with Supabase models:

**Before (Mongoose):**
\`\`\`javascript
const User = require('../models/user');
const Company = require('../models/company');
\`\`\`

**After (Supabase):**
\`\`\`javascript
const { User, Company } = require('../models/supabase');
\`\`\`

The Supabase models provide the same interface as Mongoose models, so most code will work without changes:

- `User.findById(id)`
- `User.findOne({ email })`
- `User.create({ ... })`
- `User.findByIdAndUpdate(id, data)`
- `Company.findByUserId(userId)`
- etc.

### Option B: Gradual Migration

Keep both models temporarily and migrate route by route:

\`\`\`javascript
const MongoUser = require('../models/user'); // Old
const { User: SupabaseUser } = require('../models/supabase'); // New

// Use SupabaseUser in your routes
\`\`\`

---

## Step 6: Update Route Files

Here are the files that need to be updated:

1. **src/routes/company.routes.js**
   - Replace: `const Company = require('../models/company');`
   - With: `const { Company } = require('../models/supabase');`

2. Any other routes that use User, Company, or other models

Example update for `company.routes.js`:

\`\`\`javascript
// OLD:
const Company = require('../models/company');

// NEW:
const { Company } = require('../models/supabase');

// The rest of the code stays the same!
// The Supabase Company model has the same methods as Mongoose
\`\`\`

---

## Step 7: Test Your Application

1. Start your server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Check the console for:
   \`\`\`
   ✅ Supabase Connected: https://xxxxx.supabase.co
   \`\`\`

3. Test your endpoints:
   - GET /health - Should show "ok"
   - Test company endpoints
   - Test any user authentication endpoints

---

## Step 8: Data Migration (If Needed)

If you have existing data in MongoDB that needs to be migrated:

1. **Export from MongoDB:**
   \`\`\`bash
   mongoexport --uri="mongodb://mongo_user:mongo_password123@localhost:27017/node" --collection=users --out=users.json
   mongoexport --uri="mongodb://mongo_user:mongo_password123@localhost:27017/node" --collection=companies --out=companies.json
   \`\`\`

2. **Transform and Import:**
   - You'll need to transform the data (ObjectId → UUID, field names to snake_case)
   - Create a migration script or import via Supabase dashboard

---

## Step 9: Remove MongoDB Dependencies (Optional)

Once everything is working with Supabase:

1. **Stop MongoDB service**
2. **Remove Mongoose from package.json:**
   \`\`\`bash
   npm uninstall mongoose
   \`\`\`
3. **Delete old model files:**
   - `src/models/user.js`
   - `src/models/company.js`
   - etc.
4. **Remove MongoDB env variables from .env**

---

## Key Differences: Mongoose vs Supabase Models

| Feature | Mongoose | Supabase |
|---------|----------|----------|
| IDs | ObjectId (24 char) | UUID (36 char) |
| Field names | camelCase | snake_case (converted automatically) |
| Schema validation | In model | In database + manually in model |
| Middleware (hooks) | Built-in | Manual implementation |
| Population | `.populate()` | Manual joins or separate queries |

---

## Troubleshooting

### "Missing Supabase credentials"
- Check your `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Restart your server after updating `.env`

### "Table does not exist"
- Run the SQL schema from Step 4
- Verify tables exist in Supabase dashboard

### "Cannot find module '../models/supabase'"
- Make sure you created the files in `src/models/supabase/`
- Check the file paths are correct

### "Password comparison failed"
- Password hashing is built into the User model
- Same bcrypt library, should work the same as Mongoose

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL vs MongoDB](https://www.postgresql.org/about/)

---

## Next Steps

1. Create Supabase project and get credentials
2. Update `.env` with your credentials
3. Run the SQL schema in Supabase
4. Update route imports to use Supabase models
5. Test your application
6. Optionally migrate existing data
7. Remove MongoDB when ready

**Need Help?**
If you encounter any issues, check the Supabase logs in your dashboard under **Logs** → **Postgres Logs**.
