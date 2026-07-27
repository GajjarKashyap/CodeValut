import chalk from 'chalk';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import { input } from '@inquirer/prompts';

export async function pauseBeforeExit(err = null) {
  if (err) {
    try {
      fs.writeFileSync(path.join(process.cwd(), 'codevault_error.log'), String(err && err.stack ? err.stack : err), 'utf8');
      console.error(chalk.red(`\n❌ Fatal Error: ${err && err.message ? err.message : err}\nDiagnostic trace saved to codevault_error.log.`));
    } catch (e) {
      console.error(chalk.red(`\n❌ Fatal Error: ${err && err.message ? err.message : err}`));
    }
  }
  try {
    await input({
      message: chalk.yellow.bold('\n⏎ Press [Enter] key to close the terminal window...')
    });
  } catch (e) {
    console.log('\nPress [Enter] key or Ctrl+C to close the window...');
    await new Promise(r => setTimeout(r, 60000));
  }
  process.exit(err ? 1 : 0);
}

export function showBanner() {
  const logo = chalk.cyan.bold(
` ██████╗ ██████╗ ██████╗ ███████╗██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██║     ██║   ██║██║  ██║█████╗  ██║   ██║███████║██║   ██║██║     ██║   
██║     ██║   ██║██║  ██║██╔══╝  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
╚██████╗╚██████╔╝██████╔╝███████╗ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   `
  );
  const title = chalk.white.bold('Terminal Practical Reference & Lab Companion v1.4.0 (EXE Edition)');
  const shortcuts = chalk.dim('Shortcut Tips: [↑/↓] Navigate Menu | [Enter] Select | [Ctrl+C] Cancel / Exit');

  console.log(boxen(`${logo}\n\n                 ${title}\n             ${shortcuts}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: 'CodeVault Lab CLI',
    titleAlignment: 'center'
  }));
}

export function showManual() {
  const guide = [
    chalk.yellow.bold('📖 CODEVAULT CLI MANUAL & LAB GUIDE\n'),
    chalk.cyan.bold('1. What is CodeVault CLI?'),
    chalk.white('This terminal application is built specifically for college and lab computers.'),
    chalk.white('It lets you access all classroom Java & MongoDB practical codes without opening a web browser.'),
    '',
    chalk.cyan.bold('2. How does the Daily Passkey Work?'),
    chalk.white('• ') + chalk.bold.green('With Today\'s Daily Passkey:') + chalk.white(' You get full access to view EVERY practical created across the classroom/database.'),
    chalk.white('• ') + chalk.bold.yellow('Without Passkey (Or skipped):') + chalk.white(' You enter Restricted Mode and only see sessions created by your own login account.'),
    chalk.white('• ') + chalk.bold.magenta('Lab Admins:') + chalk.white(' Automatically see today\'s passkey card to write on the classroom whiteboard.'),
    '',
    chalk.cyan.bold('3. Keyboard Navigation & Shortcuts'),
    chalk.white('• ') + chalk.bold('Arrow Keys (↑/↓):') + chalk.white(' Move selection cursor up and down.'),
    chalk.white('• ') + chalk.bold('Enter Key (↵):') + chalk.white(' Confirm menu selection or move past prompts.'),
    chalk.white('• ') + chalk.bold('Ctrl + C:') + chalk.white(' Instantly exit any prompt or return/terminate the application safely.'),
    chalk.white('• ') + chalk.bold('⬅️ Back option:') + chalk.white(' Every menu list includes a back button at the bottom to return to previous screens.'),
    '',
    chalk.cyan.bold('4. Copying Code in Terminal'),
    chalk.white('Simply highlight/select the code text with your mouse inside the terminal window and press right-click (or Enter in Windows terminal) to copy to your clipboard!')
  ].join('\n');

  console.log(boxen(guide, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'yellow',
    title: 'User Manual & Guide',
    titleAlignment: 'center'
  }));
}

export function showPasskeyStatus(passkey, isValid) {
  if (isValid) {
    console.log(boxen(chalk.green.bold('🔓 MASTER ACCESS UNLOCKED\n') + chalk.white('Showing ALL practical sessions across the database using Today\'s Daily Passkey.'), {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'double',
      borderColor: 'green'
    }));
  } else {
    console.log(boxen(chalk.yellow.bold('🔒 RESTRICTED ACCESS MODE\n') + chalk.white('Showing ONLY sessions created by you.') + chalk.dim('\n(Enter valid Daily Passkey when prompted to unlock all classroom sessions)'), {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'yellow'
    }));
  }
}

export function showAdminPasskeyCard(key) {
  console.log(boxen(
    chalk.magenta.bold('👑 ADMIN COMMAND CENTER - TODAY\'s PASSKEY\n\n') +
    chalk.white('Passkey: ') + chalk.bgMagenta.black.bold(`  ${key}  `) + chalk.green(' [ACTIVE]\n\n') +
    chalk.dim('Share this exact code on the classroom whiteboard.\nStudents can enter this code in CLI to view all lab practicals today.'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'magenta'
    }
  ));
}

export function showSessionDetails(session) {
  const subjectBadge = session.subject === 'java'
    ? chalk.bgHex('#FF6B00').black.bold(' JAVA ')
    : chalk.bgHex('#00ED64').black.bold(' MONGODB ');

  const cleanDef = (session.definition || 'No definition provided.').replace(/\r/g, '');
  const cleanCode = (session.code || 'No code provided.').replace(/\r/g, '');
  const cleanOutput = (session.output || '').replace(/\r/g, '').trim();
  const cleanNotes = (session.notes || '').replace(/\r/g, '').trim();

  const header = `${subjectBadge} ${chalk.bold.white(session.title || 'Untitled Practical')}\n` +
                 `${chalk.dim('Topic:')} ${chalk.cyan(session.topic || 'General')} | ${chalk.dim('Author:')} ${chalk.white(session.user_email || 'Student')}`;

  const aimSection = chalk.yellow.bold('📋 AIM / DEFINITION:\n') + chalk.white(cleanDef);

  console.log('\n' + boxen(`${header}\n\n---\n\n${aimSection}`, {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: session.subject === 'java' ? 'yellow' : 'green'
  }));

  console.log(chalk.cyan.bold('   ══════════════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('   💻 CODE PAYLOAD:'));
  console.log(chalk.cyan.bold('   ══════════════════════════════════════════════════════════════════════════════'));

  const codeLines = cleanCode.split('\n');
  codeLines.forEach((line, idx) => {
    const lineNum = chalk.dim(String(idx + 1).padStart(4, ' ') + ' │ ');
    console.log('   ' + lineNum + chalk.green(line));
  });

  console.log(chalk.cyan.bold('   ══════════════════════════════════════════════════════════════════════════════'));

  if (cleanOutput) {
    console.log('');
    console.log(boxen(chalk.magenta.bold('⚡ TERMINAL OUTPUT:\n') + chalk.white(cleanOutput), {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 1 },
      borderStyle: 'classic',
      borderColor: 'magenta'
    }));
  }

  if (cleanNotes) {
    console.log(boxen(chalk.blue.bold('📝 NOTES:\n') + chalk.white(cleanNotes), {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'blue'
    }));
  }
}
