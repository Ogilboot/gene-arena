export const STARTING_COINS = 1000;
export const BREED_COST = 100;
export const MARKET_FEE_RATE = 0.1;
export const BATTLE_WIN_COINS = 50;
export const BATTLE_LOSS_COINS = 10;
export const GYM_REWARD = 200;

export function sellerPayout(price: number): number {
  return Math.floor(price * (1 - MARKET_FEE_RATE));
}

export function feeAmount(price: number): number {
  return price - sellerPayout(price);
}
