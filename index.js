import { createInterface } from 'readline';
import { lookup } from 'dns';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = query => new Promise(resolve => rl.question(query, resolve));

const checkInternet = () => new Promise((resolve, reject) => {
  lookup('google.com', (error) => {
    if (error && error.code === 'ENOTFOUND') {
      error.message = `Internet not available (${error.code})`;
      return reject(error);
    }
    resolve();
  });
});

const createCLIGenerator = (state) => async function* (promptMessage = '') {
  let nextState = { ...state };
  while (true) {
    const rawInput = await question(`${promptMessage}❯ `);
    const input = rawInput.trim().toLowerCase();

    if (input === ':exit') {
      const answer = await question('Are you sure you want to exit? (yes|no): ');
      if (answer.match(/^y(es)?$/i)) {
        break;
      }
      continue;
    }

    if (input === ':update:origin') {
      nextState.from = await question(`Select origin language (eg. 'en' or 'english'): `);
    }

    if (input === ':update:target') {
      nextState.to = await question(`Select target language (eg. 'es' or 'spanish'): `);
    }

    nextState.input = input;

    yield nextState;
  }
}

async function main() {
  console.log('Welcome to the translate CLI!\n');

  try {
    await checkInternet();

    const translate = await import('google-translate-api');

    let state = {
      input: null,
      from: await question(`Select origin language (eg. 'en' or 'english'): `),
      to:   await question(`Select target language (eg. 'es' or 'spanish'): `)
    };

    console.log([
      '',
      '[type :exit to exit the CLI]',
      '[type :update:origin to change origin language]',
      '[type :update:target to change target language]',
      ''
    ].join('\n'));

    const CLIGenerator = createCLIGenerator({ ...state });

    for await (const nextState of CLIGenerator()) {
      if (nextState.from === state.from && nextState.to === state.to) {
        let { text } = await translate(nextState.input, { ...nextState });
        console.log(text);
      }
      state = { ...nextState };
    }

    console.log('\nChao! 👋');
  } catch (error) {
    console.error(`\nError: ${error.message}`);
  } finally {
    rl.close();
  }
}

main();