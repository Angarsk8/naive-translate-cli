import { createInterface } from 'readline'
import { lookup } from 'dns'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = query => new Promise(resolve => rl.question(query, resolve))

const checkInternet = () => new Promise((resolve, reject) => {
  lookup('google.com', error => {
    if (error && error.code === 'ENOTFOUND') {
      error.message = `Internet not available (${error.code})`
      return reject(error)
    }
    resolve()
  })
})

async function* CLIGenerator(promptMessage = '') {
  while (true) {
    const rawInput = await question(`${promptMessage}❯ `)
    const input = rawInput.trim().toLowerCase()

    if (input === ':exit') {
      const answer = await question('Are you sure you want to exit? (yes|no): ')
      if (answer.match(/^y(es)?$/i)) {
        break
      }
      continue
    }

    yield input
  }
}

async function main() {
  console.log('Welcome to the translate CLI!\n')

  try {
    await checkInternet()

    const translate = await import('google-translate-api')

    const from = await question('Select origin language (eg. \'en\' or \'english\'): ')
    const to   = await question('Select target language (eg. \'es\' or \'spanish\'): ')

    console.log('\n[type \':exit\' to exit the CLI]\n')

    for await (let input of CLIGenerator()) {
      let { text } = await translate(input, { from, to })
      console.log(text)
    }

    console.log('\nChao! 👋')
  } catch (error) {
    console.error(`\nError: ${error.message}`)
  } finally {
    rl.close()
  }
}

main()