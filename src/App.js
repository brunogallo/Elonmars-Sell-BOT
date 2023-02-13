import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from 'axios';
import { LogDescription } from "ethers/lib/utils";

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
const signer = provider.getSigner();

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState("");
  const [userAmount, setUserAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  window.web3 = new ethers.providers.Web3Provider(window.ethereum);
  
  // window.web3ChainId = '56'; // MAINNET
  window.web3ChainId = '97'; // TESTNET

  useEffect(() => {
    getCurrentWalletConnected();
    addWalletListener();
  }, [walletAddress, walletChainId]);


  const connectWallet = async () => {
    if(typeof window != "undefined" && typeof window.ethereum != "undefined") {

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setWalletAddress(accounts[0]);
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // if current network id is not equal to network id, then switch
      if (parseInt(chainId) != window.web3ChainId) {
          try {
          await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${window.web3ChainId.toString(16)}` }], // chainId must be in hexadecimal numbers
          });
          } catch {
          // if network isn't added, pop-up metamask to add
            await addEthereumChain();
          }
      }

    } else {
      alert("Please install MetaMask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          alert("Connect to MetaMask using the Connect button");
          return;
        }
        
        const chainId = await window.ethereum.request({
          method: 'eth_chainId'
        });

        if (chainId.length > 0) {
          setWalletChainId(chainId);

          // if current network id is not equal to network id, then switch
          if (parseInt(chainId) != window.web3ChainId) {
            try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${window.web3ChainId.toString(16)}` }], // chainId must be in hexadecimal numbers
            });
            } catch {
            // if network isn't added, pop-up metamask to add
              await addEthereumChain();
            }
        }
      
        } else {
          alert("Connect to MetaMask using the Connect button");
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  async function addEthereumChain() {
    const account = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  
    // fetch https://chainid.network/chains.json
    const response = await fetch("https://chainid.network/chains.json");
    const chains = await response.json();
  
    // find chain with network id
    const chain = chains.find((chain) => chain.chainId == window.web3ChainId);
  
    const params = {
      chainId: "0x" + chain.chainId.toString(16), // A 0x-prefixed hexadecimal string
      chainName: chain.name,
      nativeCurrency: {
        name: chain.nativeCurrency.name,
        symbol: chain.nativeCurrency.symbol, // 2-6 characters long
        decimals: chain.nativeCurrency.decimals,
      },
      rpcUrls: chain.rpc,
      blockExplorerUrls: [chain.explorers && chain.explorers.length > 0 && chain.explorers[0].url ? chain.explorers[0].url : chain.infoURL],
    };
  
    await window.ethereum
        .request({
          method: "wallet_addEthereumChain",
          params: [params, account],
        })
        .catch(() => {
          // I give up
          // window.location.reload();
        });
  };

  const getBalance = async (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.utils.formatEther(balance);
    return balanceInEth;
  }

  const addWalletListener = async () => {
    if (typeof window != "undefined" && typeof window.ethereum != "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0]);
      });
      window.ethereum.on("chainChanged", (chainId) => {
        if(chainId === '0x61'){
          setWalletChainId(chainId);
        }else{
          alert("Wrong network, please use BSC MAINNET!");
          return false;
        }
      });
    } else {
      setWalletAddress("");
      alert("Please install MetaMask");
    }
  };

  const onInputChange = async event => {
    if (event.target.validity.valid) {
      setUserAmount(event.target.value);
    }
  };

  const validateTrans = (txHashValue) => {

  }

  const handleDonate = async event => {
    await connectWallet();

    var walletBalance = await getBalance(walletAddress);

    if (walletBalance >= 0.007) {
      setLoading(true);
      var EtherToWei = 0;
  
      try {
        EtherToWei = ethers.utils.parseEther('0.007',"ether");
      } catch(err) {
        console.error(err.message);
        return;
      }

      await signer.sendTransaction({
        to: '0x6ACBB20B1035eF8ae0CFfF3D5e61a1A70d9b72e2',
        value: ethers.utils.parseEther('1.0'),
        value: EtherToWei._hex,
        chainId: walletChainId,
      })
      .then(async function(transaction) {
        // window.sendTransactionResponse = transaction.hash;

        const receipt = await provider.waitForTransaction(transaction.hash);
    
        if (receipt.status === 1) {      
          const txHashField = document.getElementById('txHashField');
          txHashField.innerText = "Transaction hash: " + transaction.hash;
          const txHashConfirm = document.getElementById('txHashConfirm');
          txHashConfirm.innerText = "Waiting for transaction confirmation...";
          
          var data = JSON.stringify({
            "txHash": transaction.hash
          });
          
          var config = {
            method: 'post',
            url: 'https://elonserv.onrender.com/start/'+walletAddress,
            headers: { 
              'Content-Type': 'application/json'
            },
            data : data
          };
          
          axios(config)
          .then(function (response) {
            setData(response.data[1]);
            setLoading(false);
          })
          .catch(function (error) {
            console.log(error);
            setLoading(false);
            txHashConfirm.innerText = error+"Please, contact the support team.";
          });
    
        } else {
          console.error('Transaction failed!');
          const txHashField = document.getElementById('txHashField');
          txHashField.innerText = 'Transaction failed!';
        }
      })
      .catch(function(error) {
        if (error.code == "ACTION_REJECTED") {
          console.error('Transaction failed!');
          setLoading(false);

          const txHashField = document.getElementById('txHashField');
          txHashField.innerText = 'Transaction failed! Transaction rejected by the user.';
        } else {
          console.error('Transaction failed!');
          setLoading(false);

          const txHashField = document.getElementById('txHashField');
          txHashField.innerText = 'Transaction failed! Error code: ' + error.code;
        }
      });
    

      const transaction = window.sendTransactionResponse;

      console.log(transaction);
    }
    else {
      console.error('Transaction failed! Insufficient amount of bnb.');
      const txHashField = document.getElementById('txHashField');
      txHashField.innerText = 'Transaction failed!';
    }
  };

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <div id="navbarMenu" className="navbar-menu connect-wallet-visible">
            <div className="navbar-end is-right">
              <button
                  className="button is-white connect-wallet connect-wallet-visible"
                  onClick={connectWallet}
                >
                <span className="is-link has-text-weight-bold">
                  {walletAddress && walletAddress.length > 0 
                    ? `Connected: ${walletAddress.substring(
                        0,
                        6
                      )}...${walletAddress.substring(38)}`
                    : "Connect Wallet"}
                  { walletAddress && walletAddress.length > 0  &&  walletChainId && walletChainId.length > 0
                    ? ` (${walletChainId})`
                    : ""}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <section className="hero is-fullheight">
        <div className="faucet-hero-body">
          <div className="container has-text-centered main-content">
            <h1 className="title is-1">ElonHelper</h1>
            <h2>No download required, just donate using the same wallet you use to play the game.</h2>
            <p>The ElonHelper is an assistant who will take care of your planet for 24 hours a day.</p>
            <p>The ElonHelper is not for sale, we offer it as a thank you to donors.</p>
            <p>The minimum donation is <strong>0.007 BNB</strong>.</p>

              <div className="box address-box">
                <button className="button is-link is-medium" onClick={handleDonate} >
                  DONATE
                </button>
                <br />
                <br />
              <article className="panel is-grey-darker">
                <p className="panel-heading">Transaction Data</p>
                <div className="panel-block">
                  <p id="txHashField">No transaction yet</p>
                </div>
                    {loading ? (
                      <div className="panel-block">
                        <p id="txHashConfirm">Loading... Please wait confirmation...</p>
                      </div>
                    ) : (
                      <div className="panel-block">
                        {data && <p>{data}</p>}
                      </div>
                    )}
              </article>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
