const { createInterface } = require('readline')
const { lookup } = require('dns')
const translate = require('google-translate-api')

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = query => new Promise(resolve => {
  rl.question(query, answer => {
    resolve(answer)
  })
})

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
    let rawInput = await question(`${promptMessage}❯ `)
    let input = rawInput.trim().toLowerCase()

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