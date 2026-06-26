import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from your CODE VAULT .env.local file
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ ERROR: Missing Supabase URL or Service Role Key.");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY=your_secret_key to your .env.local file!");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetPassword() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: node reset-password.mjs <user_email> <new_password>");
    console.log("Example: node reset-password.mjs student1@fake.com NewPass123!");
    process.exit(1);
  }

  const email = args[0];
  const newPassword = args[1];

  console.log(`🔍 Looking for user with email: ${email}...`);

  try {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ ERROR: No user found with email ${email}`);
      process.exit(1);
    }

    console.log(`✅ Found user! ID: ${user.id}`);
    console.log(`🔐 Updating password...`);

    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    console.log(`🎉 SUCCESS! Password for ${email} has been forcefully changed.`);
    console.log(`They can now log in with the new password immediately.`);

  } catch (err) {
    console.error("❌ ERROR resetting password:", err.message);
  }
}

resetPassword();
