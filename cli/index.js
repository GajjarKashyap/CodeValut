import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { loadSavedSession, loginOrRegister, logout } from './src/auth.js';
import { calculateTodayPasskey, getTodayPasskey } from './src/passkey.js';
import { showBanner, showPasskeyStatus, showAdminPasskeyCard, showManual, pauseBeforeExit } from './src/ui.js';
import { fetchSessions, selectAndShowSession, browseBySubject, searchSessions } from './src/sessions.js';

process.on('uncaughtException', async err => {
  await pauseBeforeExit(err);
});

process.on('unhandledRejection', async err => {
  await pauseBeforeExit(err);
});

async function main() {
  showBanner();

  let user = await loadSavedSession();
  if (user) {
    console.log(chalk.green(`✅ Welcome back, ${chalk.bold(user.email)}`));
  } else {
    user = await loginOrRegister();
  }

  const todayKey = await getTodayPasskey();
  const isAdmin = user?.email?.trim()?.toLowerCase() === 'admin@admin.com';

  console.log('');
  let enteredPasskey = '';
  let isValidKey = false;

  if (isAdmin) {
    showAdminPasskeyCard(todayKey);
    enteredPasskey = todayKey;
    isValidKey = true;
  } else {
    enteredPasskey = await input({
      message: chalk.yellow.bold('🔑 Enter Daily Passkey to view ALL database sessions\n') +
               chalk.dim('   (Or press Enter to skip and view ONLY your created sessions):')
    });
    isValidKey = enteredPasskey && enteredPasskey.trim().toUpperCase() === todayKey;
    showPasskeyStatus(enteredPasskey, isValidKey);
  }

  const sessions = await fetchSessions(enteredPasskey, todayKey);

  await mainMenuLoop(user, isAdmin, sessions, todayKey);
}

async function mainMenuLoop(user, isAdmin, sessions, todayKey) {
  const choices = [
    { name: `📂 Browse Sessions by Subject (Java / MongoDB) [${sessions.length} available]`, value: 'browse' },
    { name: '🔍 Search Sessions by Title or Topic', value: 'search' },
    { name: '👁️ View Session Details (Quick Select)', value: 'view' },
    { name: '📖 Read CLI Manual & Help Guide', value: 'manual' }
  ];

  if (isAdmin) {
    choices.push({ name: '🔑 Show Today\'s Daily Passkey (Admin Only)', value: 'show_key' });
  }

  choices.push({ name: '🚪 Logout / Exit', value: 'logout' });

  const action = await select({
    message: chalk.cyan.bold('--- Main Menu --- Choose an option (Use ↑/↓ keys):'),
    choices,
    pageSize: 10
  });

  if (action === 'browse') {
    await browseBySubject(sessions);
    await mainMenuLoop(user, isAdmin, sessions, todayKey);
  } else if (action === 'search') {
    await searchSessions(sessions);
    await mainMenuLoop(user, isAdmin, sessions, todayKey);
  } else if (action === 'view') {
    await selectAndShowSession(sessions);
    await mainMenuLoop(user, isAdmin, sessions, todayKey);
  } else if (action === 'manual') {
    showManual();
    await select({ message: 'Press Enter to return to main menu:', choices: [{ name: '⬅️ Back to Main Menu', value: 'back' }] });
    await mainMenuLoop(user, isAdmin, sessions, todayKey);
  } else if (action === 'show_key' && isAdmin) {
    showAdminPasskeyCard(todayKey);
    await select({ message: 'Press Enter to return to main menu:', choices: [{ name: '⬅️ Back to Main Menu', value: 'back' }] });
    await mainMenuLoop(user, isAdmin, sessions, todayKey);
  } else if (action === 'logout') {
    logout();
    await pauseBeforeExit();
  }
}

main().catch(async err => {
  await pauseBeforeExit(err);
});
