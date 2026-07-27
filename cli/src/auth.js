import fs from 'fs';
import path from 'path';
import os from 'os';
import { input, password, select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { supabase } from './supabase.js';
import { pauseBeforeExit } from './ui.js';

const configPath = path.join(os.homedir(), '.codevault_config.json');

export async function loadSavedSession() {
  if (fs.existsSync(configPath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (saved.access_token && saved.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: saved.access_token,
          refresh_token: saved.refresh_token
        });
        if (!error && data.session && data.user) {
          return data.user;
        }
      }
    } catch (e) {
      // Invalid saved token
    }
  }
  return null;
}

export function saveSession(session, user) {
  try {
    fs.writeFileSync(configPath, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: { id: user.id, email: user.email }
    }, null, 2), 'utf8');
  } catch (e) {
    // Ignore error
  }
}

export async function loginOrRegister() {
  console.log(chalk.cyan('\n--- CodeVault Authentication ---'));
  
  const action = await select({
    message: 'Welcome to CodeVault CLI. Please choose an action:',
    choices: [
      { name: '🔑 Login with existing account', value: 'login' },
      { name: '✨ Register a new account', value: 'register' },
      { name: '❌ Exit', value: 'exit' }
    ]
  });

  if (action === 'exit') {
    await pauseBeforeExit();
  }

  const email = await input({ message: '📧 Email:' });
  const pwd = await password({ message: '🔒 Password:' });

  const spinner = ora(action === 'login' ? 'Logging in...' : 'Registering...').start();

  if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd });
    spinner.stop();
    if (error) {
      console.log(chalk.red(`❌ Login failed: ${error.message}`));
      return await loginOrRegister();
    }
    saveSession(data.session, data.user);
    console.log(chalk.green(`✅ Successfully logged in as ${chalk.bold(data.user.email)}`));
    return data.user;
  } else {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pwd });
    spinner.stop();
    if (error) {
      console.log(chalk.red(`❌ Registration failed: ${error.message}`));
      return await loginOrRegister();
    }
    if (data.session && data.user) {
      saveSession(data.session, data.user);
      console.log(chalk.green(`✅ Successfully registered and logged in as ${chalk.bold(data.user.email)}`));
      return data.user;
    } else {
      console.log(chalk.yellow('ℹ️ Registration initiated. Please check your email for confirmation if required, or try logging in.'));
      return await loginOrRegister();
    }
  }
}

export function logout() {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  supabase.auth.signOut();
  console.log(chalk.yellow('✅ Logged out successfully.'));
}
