// eslint-disable
// this is an auto generated file. This will be overwritten

export const getCoin = `query GetCoin($id: ID!) {
  getCoin(id: $id) {
    id
    clientId
    name
    symbol
    price
  }
}
`;
export const listCoins = `query ListCoins(
  $filter: ModelCoinFilterInput
  $limit: Int
  $nextToken: String
) {
  listCoins(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      clientId
      name
      symbol
      price
    }
    nextToken
  }
}
`;
