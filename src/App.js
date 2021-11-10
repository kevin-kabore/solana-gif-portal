import * as React from 'react'
import twitterLogo from './assets/twitter-logo.svg'
import './App.css'
import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import kp from './keypair.json'

import idl from './idl.json'

// SystemProgram is a reference to the Solana runtime!
const {SystemProgram} = web3

// Create a keypair for the account that will hold the GIF data.
// let baseAccount = Keypair.generate() // returns some params we need to create the BaseAccount
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address)

// set our network to devnet
const network = clusterApiUrl('devnet')

// Controls how we want to acknowledge the transaction.is "done"
const opts = {
  // choose when to receive confirmation of successful transaction
  preflightCommitment: 'processed', // processed = acknowledged by one node
}

// Constants
const TWITTER_HANDLE = '2kabore4'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`
// For testing until we have the program deployed
// const TEST_GIFS = [
//   'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
//   'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
//   'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
//   'https://media2.giphy.com/media/F3tPNVyStwEq4/giphy.gif?cid=790b761170ef3c64abc598c7854dbd60c594f4e974b710cd&rid=giphy.gif&ct=g',
//   'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp',
//   'https://media2.giphy.com/media/MaXYVi4y8xqcFeotvt/giphy.gif?cid=ecf05e473ajb5uhxu7gdsmx69wkw9awa9xmh7g735xy1ffv6&rid=giphy.gif&ct=g',
//   'https://media4.giphy.com/media/xR0ouBaSOzrZWd4fXS/giphy.gif?cid=ecf05e47lsluww4c9trc14nu3f9dq9696ogrcxkml3a34661&rid=giphy.gif&ct=g',
// ]

const App = () => {
  const [walletAddress, setWalletAddress] = React.useState(null)
  const [inputValue, setInputValue] = React.useState('')
  // const [gifList, setGifList] = React.useState(TEST_GIFS)
  const [gifList, setGifList] = React.useState(null)

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    console.log('------checkIfWalletIsConnected()------')
    try {
      const {solana} = window
      if (solana && solana.isPhantom) {
        console.log('Phantom Wallet found!')

        /*
         * The solana object gives us a function that will allow us to connect
         * directly with the user's wallet!
         */
        const response = await solana.connect({onlyIfTrusted: true})
        console.log('response:', response)
        /*
         * The response object has a publicKey property that holds the
         * public key of the user's wallet. We can use this to get the
         * address of the user's wallet.
         */
        console.log('Connected with Public Key:', response.publicKey.toString())
        // Set the user's publicKey in state to be used later!
        setWalletAddress(response.publicKey.toString())
      } else {
        alert('Solana Object not found! Get a Phantom Wallet 👻')
      }
    } catch (error) {
      console.error('error:', error)
    }
  }

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    console.log('------connectWallet()------')
    const {solana} = window
    if (!solana) return
    try {
      const response = await solana.connect()
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    } catch (error) {
      console.error('error:', error)
    }
  }

  const disconnectWallet = async () => {
    console.log('------disconnectWallet()------')
    const {solana} = window
    if (!solana) return
    try {
      await solana.disconnect()
      console.log('Disconnecting wallet with Public Key:', walletAddress)

      setWalletAddress(null)
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const sendGif = async () => {
    console.log('------sendGif()------')
    if (!inputValue.length) {
      console.log('No gif url given.')
      return
    }
    console.log('gifUrl:', inputValue)

    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      })
      console.log('GIF sucesfully sent to program', inputValue)

      await getGifList()
    } catch (error) {
      console.log('Error sending Gif:', error)
    }
  }

  const upvoteGif = async gifUrl => {
    console.log('------upvoteGif()------')
    const provider = getProvider()
    const program = new Program(idl, programID, provider)
    try {
      await program.rpc.updateGifVotes(gifUrl, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      })

      await getGifList()
    } catch (error) {
      console.log('Error upvoting Gif:', error)
    }
  }

  // Provider = authenticated connection to the blockchain (solana in this case)
  const getProvider = () => {
    console.log('------getProvider()------')
    const connection = new Connection(network, opts.preflightCommitment)
    // to make a provider we need a connected wallet -
    // meaning the app has to be authorized by user to connect to their wallet
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment,
    )
    console.log('provider:', provider)
    return provider
  }

  const createGifAccount = async () => {
    console.log('------createGifAccount()------')
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      console.log('ping')
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      })
      console.log(
        'Created a new BaseAccount w/ address:',
        baseAccount.publicKey.toString(),
      )
      await getGifList()
    } catch (error) {
      console.log('Error creating BaseAccount account:', error)
    }
  }
  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  // const renderNotConnectedContainer = () => (
  //   <button
  //     className="cta-button connect-wallet-button"
  //     onClick={connectWallet}
  //   >
  //     Connect to Wallet
  //   </button>
  // )
  /**
   * Renders the connected container. Needs to handle:
   * 1. User has connected their wallet, but BaseAccount account has not been created.
   *    - Give them a button to create account.
   * 2. User has connected their wallet, and BaseAccount account has been created.
   *   - render the gifList
   */
  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }

    return (
      <div className="connected-container">
        <input
          type="text"
          placeholder="Enter gif link!"
          value={inputValue}
          onChange={({target: {value}}) => setInputValue(value)}
        />
        <button className="cta-button submit-gif-button" onClick={sendGif}>
          Submit
        </button>
        <div className="gif-grid">
          {/* We use index as the key instead, also, the src is now item.gifUrl */}
          {gifList.map((item, index) => (
            <div key={index}>
              <div className="gif-item">
                <img alt="gif" src={item.gifUrl} />
              </div>
              <div className="gif-item-details">
                <p>Owner: {item.userAddress.toString()}</p>
              </div>
              <div className="gif-item-details">
                <p>Votes: {item.votes.toString()}</p>
                <button
                  className="cta-button vote-gif-button"
                  onClick={async () => await upvoteGif(item.gifUrl)}
                >
                  Upvote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /*
   * Checks if wallet is connected to the window object when the component mounts
   */
  React.useEffect(() => {
    const walletListener = async e => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', walletListener)
    // cleanup function
    return () => {
      window.removeEventListener('load', walletListener)
    }
  }, [])

  /** Gets the list of gifs from our program base account */
  const getGifList = async () => {
    console.log('------getGifList()------')
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey,
      )
      console.log('program account:', account)
      setGifList(account.gifList)
      console.log('setGifList:', account.gifList)
    } catch (error) {
      console.log('error in getGifList:', error)
      setGifList(null)
    }
  }
  /*
   * Fetches and sets the gifs in state when the walletAddress first changes to defined
   */
  React.useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...')

      // call solana program here

      // set state with the gif list
      // setGifList(TEST_GIFS)

      getGifList()
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className="wallet-container">
        {!walletAddress ? null : (
          <button
            className="cta-button disconnect-wallet-button"
            onClick={disconnectWallet}
          >
            Disconnect Wallet
          </button>
        )}
      </div>

      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            Show the metaverse your spirit in a GIF ✨🦄
          </p>
          {
            // connected wallet
            walletAddress ? (
              renderConnectedContainer()
            ) : (
              <button
                className="cta-button connect-wallet-button"
                onClick={connectWallet}
              >
                Connect to Wallet
              </button>
            )
          }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <p className="footer-text">
            built by{' '}
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`@${TWITTER_HANDLE}`}</a>{' '}
            with{' '}
            <a
              className="footer-text"
              href={'https://twitter.com/_buildspace'}
              target="_blank"
              rel="noreferrer"
            >
              @_buildspace
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
