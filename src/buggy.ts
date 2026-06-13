export function calculateTotal(prices: number[]) {
  // Bug 1: Using var instead of let/const
  var total = 0;
  
  // Bug 2: Off-by-one error, will throw an undefined error or add NaN if array bounds exceeded
  for (let i = 0; i <= prices.length; i++) {
    total += prices[i];
  }
  
  // Bug 3: Hardcoded console.log in production-like code
  console.log("The total is: ", total);
  
  return total;
}
