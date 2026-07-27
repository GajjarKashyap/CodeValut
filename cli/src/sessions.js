import ora from 'ora';
import chalk from 'chalk';
import { select, input } from '@inquirer/prompts';
import { supabase } from './supabase.js';
import { showSessionDetails } from './ui.js';

export async function fetchSessions(passkey, todayPasskeyString) {
  const spinner = ora('Fetching sessions from database...').start();
  try {
    const { data, error } = await supabase.rpc('get_cli_sessions', {
      p_passkey: passkey || null
    });
    
    spinner.stop();
    if (!error && data) {
      return data;
    }
  } catch (e) {
    spinner.stop();
  }

  // Fallback if RPC not executed or error: standard query
  const spinnerFallback = ora('Loading sessions...').start();
  const { data, error } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
  spinnerFallback.stop();
  
  if (error) {
    console.log(chalk.red(`❌ Error fetching sessions: ${error.message}`));
    return [];
  }
  
  // If passkey matches today's key exactly, return all returned sessions
  if (passkey && passkey.trim().toUpperCase() === todayPasskeyString) {
    return data || [];
  } else {
    // Otherwise return only current user's sessions or shared
    const { data: { user } } = await supabase.auth.getUser();
    return (data || []).filter(s => s.user_id === user?.id || s.is_shared);
  }
}

export async function selectAndShowSession(sessions) {
  if (!sessions || sessions.length === 0) {
    console.log(chalk.yellow('\nNo sessions found to display.'));
    return;
  }

  const choices = sessions.map(s => ({
    name: `[${(s.subject || 'general').toUpperCase()}] ${s.title || 'Untitled'} - ${chalk.dim(s.topic || 'No topic')}`,
    value: s
  }));
  choices.push({ name: '⬅️ Back to main menu', value: 'back' });

  const selected = await select({
    message: 'Select a practical session to inspect details:',
    choices,
    pageSize: 15
  });

  if (selected === 'back') return;

  showSessionDetails(selected);

  await select({
    message: 'Press Enter when done inspecting:',
    choices: [{ name: '⬅️ Back to list', value: 'done' }]
  });

  await selectAndShowSession(sessions);
}

export async function browseBySubject(sessions) {
  const filter = await select({
    message: 'Select Subject Filter:',
    choices: [
      { name: `🌐 All Practicals (${sessions.length})`, value: 'all' },
      { name: `☕ Java Practicals (${sessions.filter(s => s.subject === 'java').length})`, value: 'java' },
      { name: `🍃 MongoDB Practicals (${sessions.filter(s => s.subject === 'mongodb').length})`, value: 'mongodb' },
      { name: '⬅️ Back to main menu', value: 'back' }
    ]
  });

  if (filter === 'back') return;

  const filtered = filter === 'all'
    ? sessions
    : sessions.filter(s => s.subject === filter);

  await selectAndShowSession(filtered);
}

export async function searchSessions(sessions) {
  const keyword = await input({ message: '🔍 Enter keyword to search (Title, Topic, or Aim):' });
  if (!keyword.trim()) return;

  const q = keyword.toLowerCase().trim();
  const matched = sessions.filter(s => 
    (s.title && s.title.toLowerCase().includes(q)) ||
    (s.topic && s.topic.toLowerCase().includes(q)) ||
    (s.definition && s.definition.toLowerCase().includes(q)) ||
    (s.code && s.code.toLowerCase().includes(q))
  );

  console.log(chalk.cyan(`\nFound ${matched.length} practical(s) matching "${keyword}"\n`));
  await selectAndShowSession(matched);
}
