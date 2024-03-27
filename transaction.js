import Web3 from 'web3'

const web3 = new Web3(
  'https://clean-broken-arm.ethereum-goerli.quiknode.pro/65b33baa4c5c0f4cfcac339d44570e37493f607b/'
)
//Оставил ключ для Вас


//список транзакций для тестирования
export async function getTransactions() {
  try {
    const latestBlockNumber = await web3.eth.getBlockNumber()
    const block = await web3.eth.getBlock(latestBlockNumber)    
    const transactions = block.transactions
    console.log({transactions})
    return transactions
  } catch (error) {
    console.error('Error:', error)
  }
}
// getTransactions()
//список транзакций для тестирования


export async function getTransactionInfo(txHash) {
  try {
    const tx = await web3.eth.getTransaction(txHash)
    const block = await web3.eth.getBlock(tx.blockNumber)
    const amountInEther = web3.utils.fromWei(tx.value, 'ether');
    const date = new Date(Number(block.timestamp) * 1000)
    return { date, walletFrom: tx.from, walletTo: tx.to, txid: tx.hash,values:amountInEther }
  } catch (error) {
    console.error('Error:', error)
  }
}
