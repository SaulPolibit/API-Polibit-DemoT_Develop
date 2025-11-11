# Mongoose to Supabase Migration - Code Fixes Applied

This document lists all the Mongoose-specific code patterns that were replaced with Supabase-compatible code.

## Summary of Changes

All route files have been updated to work with Supabase models instead of Mongoose models. The changes ensure compatibility with PostgreSQL through Supabase while maintaining the same API interface.

---

## Fixed Patterns

### 1. Model Constructor Pattern
**Mongoose:** `const model = new Model({ data }); await model.save();`
**Supabase:** `const model = await Model.create({ data });`

### 2. Instance Save Method
**Mongoose:** `model.property = value; await model.save();`
**Supabase:** `const updated = await Model.findByIdAndUpdate(id, { property: value });`

### 3. Object ID References
**Mongoose:** `user._id` or `user._id.toString()`
**Supabase:** `user.id` (UUIDs instead of ObjectIds)

### 4. toObject() Method
**Mongoose:** `const data = model.toObject();`
**Supabase:** `const data = { ...model };` (spread operator)

### 5. Password Comparison
**Mongoose:** `await user.comparePassword(password)` (instance method)
**Supabase:** `await User.comparePassword(userId, password)` (static method)

---

## Files Modified

### 1. src/routes/custom.routes.js

**Login endpoint (line 45-56):**
- Fixed password comparison to use static method
- Replaced `user.save()` with `User.findByIdAndUpdate()`
- Changed `user._id` to `user.id`

**Register endpoint (line 106-112):**
- Replaced `new User({...}); await user.save()` with `await User.create({...})`
- Changed `user._id` to `user.id`

**Update profile endpoint (line 168-230):**
- Built updateData object instead of mutating user object
- Replaced `user.save()` with `User.findByIdAndUpdate(userId, updateData)`
- Fixed password comparison to use static method
- Changed `existingUser._id.toString()` to `existingUser.id`

**Upload profile image (line 284-286):**
- Replaced `user.save()` with `User.findByIdAndUpdate(userId, { profileImage })`

**Delete profile image (line 329-331):**
- Replaced `user.save()` with `User.findByIdAndUpdate(userId, { profileImage: null })`

### 2. src/routes/company.routes.js

**Upload company logo (line 144-165):**
- Replaced `new Company({...})` with `await Company.create({...})`
- Replaced `company.save()` with `Company.findByIdAndUpdate(company.id, { firmLogo })`
- Fixed `.toObject()` to use spread operator `{ ...company }`

**Delete company logo (line 209-211):**
- Replaced `company.save()` with `Company.findByIdAndUpdate(company.id, { firmLogo: null })`

**Get company (line 234-243):**
- Replaced `new Company({...}); await company.save()` with `await Company.create({...})`
- Fixed `.toObject()` to use spread operator

### 3. src/routes/project.routes.js

**Create project (line 75-76):**
- Replaced `new Project(projectData); await project.save()` with `await Project.create(projectData)`
- Fixed `.toObject()` to use spread operator `{ ...project }`

**Upload project image (line 126-128):**
- Replaced `project.save()` with `Project.findByIdAndUpdate(id, { image })`

**Delete project image (line 172-174):**
- Replaced `project.save()` with `Project.findByIdAndUpdate(id, { image: null })`

**Update project (line 358-359):**
- Replaced `Object.assign(project, updateData); await project.save()` with `Project.findByIdAndUpdate(id, updateData)`
- Fixed `.toObject()` to use spread operator

**All project list/get operations:**
- Fixed `.toObject()` calls to use spread operator `{ ...project }`

### 4. src/routes/notifications.routes.js

**All endpoints:**
- Removed `._id` fallback from userId extraction
- Changed `req.user.id || req.user._id` to just `req.user.id`

---

## Model Methods Comparison

### User Model

| Mongoose | Supabase |
|----------|----------|
| `await user.save()` | `await User.findByIdAndUpdate(id, data)` |
| `await user.comparePassword(pass)` | `await User.comparePassword(userId, pass)` |
| `new User({...})` | `await User.create({...})` |
| `user._id` | `user.id` |
| `user.toJSON()` | `user.toJSON()` (still available) |

### Company Model

| Mongoose | Supabase |
|----------|----------|
| `await company.save()` | `await Company.findByIdAndUpdate(id, data)` |
| `new Company({...})` | `await Company.create({...})` |
| `company.toObject()` | `{ ...company }` |

### Project Model

| Mongoose | Supabase |
|----------|----------|
| `await project.save()` | `await Project.findByIdAndUpdate(id, data)` |
| `new Project({...})` | `await Project.create({...})` |
| `project.toObject()` | `{ ...project }` |

### NotificationSettings Model

| Mongoose | Supabase |
|----------|----------|
| `await settings.save()` | `await NotificationSettings.findByIdAndUpdate(id, data)` |
| `new NotificationSettings({...})` | `await NotificationSettings.create({...})` |

---

## Testing Checklist

After migration, verify these endpoints work correctly:

- [ ] POST /api/custom/register - User registration
- [ ] POST /api/custom/login - User login
- [ ] PUT /api/custom/user/profile - Update user profile
- [ ] POST /api/custom/user/profile-image - Upload profile image
- [ ] DELETE /api/custom/user/profile-image - Delete profile image
- [ ] PUT /api/company - Update company info
- [ ] POST /api/company/logo - Upload company logo
- [ ] DELETE /api/company/logo - Delete company logo
- [ ] GET /api/company - Get company info
- [ ] POST /api/projects - Create project
- [ ] POST /api/projects/:id/image - Upload project image
- [ ] DELETE /api/projects/:id/image - Delete project image
- [ ] PUT /api/projects/:id - Update project
- [ ] GET /api/projects - List projects
- [ ] GET /api/notifications/settings - Get notification settings
- [ ] PUT /api/notifications/settings - Update notification settings

---

## Common Errors Fixed

### Error: "user.save is not a function"
**Cause:** Supabase models don't have instance `.save()` method
**Fix:** Use `Model.findByIdAndUpdate(id, data)` instead

### Error: "Cannot read property '_id' of undefined"
**Cause:** Supabase uses UUIDs (`id`) not MongoDB ObjectIds (`_id`)
**Fix:** Use `model.id` instead of `model._id`

### Error: "model.toObject is not a function"
**Cause:** Supabase models return plain objects, not Mongoose documents
**Fix:** Use spread operator `{ ...model }` or use the object directly

### Error: "User is not a constructor"
**Cause:** Trying to use `new User()` with Supabase model
**Fix:** Use `await User.create({...})` instead

---

## Migration Complete ✅

All Mongoose-specific patterns have been replaced with Supabase-compatible code. The application now uses PostgreSQL through Supabase instead of MongoDB, while maintaining the same API interface.

**Server Status:** ✅ Running successfully
**Database:** ✅ Connected to Supabase
**All Routes:** ✅ Updated and compatible
