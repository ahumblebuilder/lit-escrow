# Vincent Authentication Debug Guide

## Error: "JWT is not app specific"

This error occurs when the JWT token from the frontend doesn't contain the correct app ID for your Vincent app.

## 🔍 **Debugging Steps**

### 1. **Check Environment Variables**

Ensure these environment variables are set correctly in your frontend:

```bash
VITE_APP_ID=8637850004  # Your Vincent app ID
VITE_BACKEND_URL=https://your-backend-url.com
VITE_REDIRECT_URI=https://your-frontend-url.com
```

### 2. **Check Browser Console**

After clicking "Connect with Vincent", check the browser console for:

```
Initiating Vincent authentication with app ID: 8637850004
Redirect URI: https://your-frontend-url.com
```

### 3. **Check JWT Content**

After authentication, check the console for JWT debugging info:

```
JWT token present: true
JWT length: 1234
JWT payload: { app: { id: 8637850004, version: 1 }, ... }
JWT app ID: 8637850004
Expected app ID: 8637850004
```

### 4. **Common Issues**

#### **Issue 1: Wrong App ID**

- **Problem**: JWT app ID doesn't match your app ID
- **Solution**: Ensure `VITE_APP_ID` is set to your Vincent app ID
- **Check**: Compare JWT app ID with expected app ID in console

#### **Issue 2: No App ID in JWT**

- **Problem**: JWT doesn't contain app information
- **Solution**: User needs to re-authenticate with your specific app
- **Check**: Look for `JWT app ID: undefined` in console

#### **Issue 3: Different App ID**

- **Problem**: User authenticated with a different Vincent app
- **Solution**: Clear browser storage and re-authenticate
- **Check**: JWT app ID is different from expected

#### **Issue 4: Authentication Not Complete**

- **Problem**: User didn't complete the Vincent authentication flow
- **Solution**: Ensure user goes through the full Vincent consent flow
- **Check**: User should see Vincent consent page

### 5. **Frontend Environment Setup**

Create a `.env.local` file in your frontend directory:

```bash
VITE_APP_ID=8637850004
VITE_BACKEND_URL=https://your-backend-url.com
VITE_REDIRECT_URI=https://your-frontend-url.com
VITE_EXPECTED_AUDIENCE=https://your-frontend-url.com
```

### 6. **Backend Environment Setup**

Ensure your backend has the correct app ID:

```bash
VINCENT_APP_ID=8637850004
```

### 7. **Vincent App Configuration**

In your Vincent app dashboard:

1. **App ID**: Should match `VITE_APP_ID` and `VINCENT_APP_ID`
2. **Allowed Origins**: Should include your frontend URL
3. **Redirect URIs**: Should include your frontend URL
4. **App Status**: Should be active and published

### 8. **Testing Steps**

1. **Clear Browser Storage**:

   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Check Environment Variables**:

   ```javascript
   console.log('App ID:', import.meta.env.VITE_APP_ID);
   ```

3. **Re-authenticate**:

   - Click "Connect with Vincent"
   - Complete the full authentication flow
   - Check console for JWT debugging info

4. **Verify JWT Content**:
   - JWT should contain `app.id` matching your app ID
   - JWT should be valid and not expired

### 9. **Common Solutions**

#### **Solution 1: Re-authenticate**

```javascript
// Clear auth and re-authenticate
localStorage.clear();
// Then click "Connect with Vincent" again
```

#### **Solution 2: Check App ID Match**

```javascript
// In browser console
console.log('Frontend App ID:', import.meta.env.VITE_APP_ID);
console.log('JWT App ID:' /* from JWT payload */);
```

#### **Solution 3: Verify Vincent App Settings**

- Check Vincent app dashboard
- Ensure app is published and active
- Verify allowed origins and redirect URIs

### 10. **Expected Flow**

1. User clicks "Connect with Vincent"
2. Redirects to Vincent consent page
3. User grants permission to your app
4. Redirects back to your frontend
5. JWT contains your app ID
6. Backend accepts the JWT

If any step fails, check the console logs for specific error messages.
