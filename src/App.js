import React, { useEffect, useReducer } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import { listCoins } from './graphql/queries'
import { createCoin as CreateCoin } from './graphql/mutations'
import { onCreateCoin, onDeleteCoin } from './graphql/subscriptions'
import './App.css';
import { Storage } from 'aws-amplify'

// import uuid to create a unique client ID
import uuid from 'uuid/v4'
const CLIENT_ID = uuid()

// create initial state
const initialState = {
  name: '', price: '', symbol: '', coins: [], loading: true
}

// create reducer to update state
function reducer(state, action) {
  switch(action.type) {
    case 'SETCOINS':
      return { ...state, coins: action.coins, loading: false }
    case 'SETINPUT':
      return { ...state, [action.key]: action.value }
    case 'CLEARINPUT':
        return { ...state, name: '', price: '', symbol: '' }
    case 'ADDCOIN':
      return { ...state, coins: [...state.coins, action.coin] }
    case 'REMOVECOIN':
      return { ...state, coins: [...state.coins.filter(c=>c.id !== action.coin.id)] }
    default:
      return state
  }
}

async function addToStorage() {
  await Storage.put('javascript/MyReactComponent.js', `
    import React from 'react'
    const App = () => (
      <p>Hello World</p>
    )
    export default App
  `)
  console.log('data stored in S3!')
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    getDataGraphQL()
    subscribeToOnCreateCoin()
    subscribeToOnDeleteCoin()
  }, [])

  async function getDataGraphQL() {
    try {
      const coinData = await API.graphql(graphqlOperation(listCoins))
      console.log('data from API: ', coinData)
      dispatch({ type: 'SETCOINS', coins: coinData.data.listCoins.items })
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  async function getDataREST() {
    try {
      // const data = await API.get('cryptoapi', '/coins')
      const data = await API.get('cryptoapi', '/coins?limit=3&start=0')
      console.log('data from Lambda REST API: ', data)
      dispatch({ type: 'SETCOINS', coins: data.coins })
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  async function createCoin() {
    const { name, price, symbol } = state
    if (name === '' || price === '' || symbol === '') return
    const coin = {
      name, price: parseFloat(price), symbol, clientId: CLIENT_ID
    }
    
    try {
      const newCoin = await API.graphql(graphqlOperation(CreateCoin, { input: coin }))
      console.log('item created!')
      const coins = [...state.coins, newCoin.data.createCoin]
      dispatch({ type: 'SETCOINS', coins })

      dispatch({ type: 'CLEARINPUT' }) //clear input
    } catch (err) {
      console.log('error creating coin...', err)
    }
  }

  async function subscribeToOnCreateCoin(handleSubscriptionFunction) {
    const subscription = await API.graphql(graphqlOperation(onCreateCoin))
    .subscribe({
      next: (data) => {
        const coin = data.value.data.onCreateCoin
        if (coin.clientId === CLIENT_ID) return
        dispatch({ type: 'ADDCOIN', coin })
      }
    })
    return () => subscription.unsubscribe()
  }

  async function subscribeToOnDeleteCoin(handleSubscriptionFunction) {
    const subscription = await API.graphql(graphqlOperation(onDeleteCoin))
    .subscribe({
      next: (data) => {
        const coin = data.value.data.onDeleteCoin
        //if (coin.clientId === CLIENT_ID) return
        dispatch({ type: 'REMOVECOIN', coin })
      }
    })
    return () => subscription.unsubscribe()
  }

  // change state then user types into input
  function onChange(e) {
    dispatch({ type: 'SETINPUT', key: e.target.name, value: e.target.value })
  }

  // add UI with event handlers to manage user input
  return (
    <div><form autoComplete='off'>
      <input
        name='name'
        placeholder='name'
        onChange={onChange}
        value={state.name}
        autoComplete='off'
      />
      <input
        name='price'
        placeholder='price'
        onChange={onChange}
        value={state.price}
        autoComplete='off'
      />
      <input
        name='symbol'
        placeholder='symbol'
        onChange={onChange}
        value={state.symbol}
        autoComplete='off'
      />
      <button type="button" onClick={createCoin}>Create Coin</button>
      </form>
      { state.loading && (<div>Loading...</div>)}
      {
        state.coins.map((c, i) => (
          <div key={i}>
            <h2>{c.name}</h2>
            <h4>{c.symbol}</h4>
            <p>{c.price}</p>
          </div>
        ))
      }
      { false && (<div><button onClick={addToStorage}>Add To Storage</button></div>)}
    </div>
  )
}

export default withAuthenticator(App, { includeGreetings: true })