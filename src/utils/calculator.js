import { rules } from "./rules";
import { merchantCodeArr, merchantCodes } from "./types";

// Helper function for calling from react
export async function tryCalculation(transactions) {
  try {
    const res = calculatePoints(JSON.parse(transactions));
    return res;
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

function calculatePoints(transactions) {
  const merchantTotalSpending = {};
  for (const merchant of Object.values(merchantCodes)) {
    merchantTotalSpending[merchant] = 0;
  }

  // Calculate total spent for each merchant
  for (const transaction of Object.values(transactions)) {
    if (merchantTotalSpending[transaction["merchant_code"]] !== undefined) {
      merchantTotalSpending[transaction["merchant_code"]] +=
        transaction["amount_cents"];
    } else {
      merchantTotalSpending["other"] += transaction["amount_cents"];
    }
  }

  let maxPoints = 0;
  let rulesUsed = [];

  backtrack(0, merchantTotalSpending, [], null);
  console.log("max points: " + maxPoints);

  const transactionResult = calculateRulesUsed(rulesUsed, transactions);

  return {
    points: maxPoints,
    transactions: transactionResult,
    success: true,
  };

  function backtrack(points, totals, rulesApplied, lastRuleApplied) {
    let anyRuleValid = false; // if no rules can be applied, do rule 7
    let usePrev = false;

    // Use the previously used rule if applicable (helps pruning )
    if (lastRuleApplied) {
      const rule = rules[lastRuleApplied];

      // Check if we can continue to use the rule
      let ruleValid = true;

      for (let merchant of merchantCodeArr) {
        if (rule[merchant] > totals[merchant]) {
          // rule cannot be applied
          ruleValid = false;
        }
      }

      if (ruleValid) {
        let tempTotals = { ...totals };
        for (let merchant of merchantCodeArr) {
          if (rule[merchant]) {
            tempTotals[merchant] -= rule[merchant];
          }
        }

        usePrev = true;

        backtrack(
          points + rule.points,
          tempTotals,
          [...rulesApplied, { ...rule }],
          lastRuleApplied
        );
      }
    }

    // Try other rules
    if (!usePrev) {
      for (let [index, rule] of rules.entries()) {
        // Check if rule can be applied
        let ruleValid = true;
        for (let merchant of merchantCodeArr) {
          if (rule[merchant] > totals[merchant]) {
            ruleValid = false;
          }
        }

        if (ruleValid) {
          // Use any rule other than 7 first
          anyRuleValid = true;
          let tempTotals = { ...totals };
          for (let merchant of merchantCodeArr) {
            if (rule[merchant]) {
              tempTotals[merchant] -= rule[merchant];
            }
          }

          backtrack(
            points + rule.points,
            tempTotals,
            [...rulesApplied, { ...rule }],
            index
          );
        }
      }
    }

    if (!anyRuleValid) {
      // get all remaining cents, apply rule 7 as much as we can
      let leftoverCents = 0;

      for (let merchant of merchantCodeArr) {
        leftoverCents += totals[merchant];
      }

      points += Math.floor(leftoverCents / 100);

      if (points > maxPoints) {
        maxPoints = points;
        rulesUsed = rulesApplied;
      }
    }
  }
}

// Retroactively apply rules since the actual transaction amounts don't matter for optimal solution
function calculateRulesUsed(rulesUsed, transactions) {
  const transactionResult = [];
  const numTransactions = Object.keys(transactions).length;

  let ruleDebtArr = [];
  let centDebt = 0;

  for (let [index, transactionId] of Object.keys(transactions).entries()) {
    const transaction = transactions[transactionId];
    let points = 0;
    let { amount_cents: cents, merchant_code: merchant } = transaction;
    let finishedRules = [];

    // First check rules that have been applied but not paid off
    for (let [index, rule] of ruleDebtArr.entries()) {
      // Pay off rule as much as we can
      if (rule[merchant] > 0) {
        if (rule[merchant] >= cents) {
          rule[merchant] -= cents;
          cents = 0;
        } else {
          cents -= rule[merchant];
          rule[merchant] = 0;
        }

        // Check if rule has been fully paid off
        let rulePaidOff = true;
        for (let ruleMerchant of merchantCodeArr) {
          if (rule[ruleMerchant] !== 0) {
            rulePaidOff = false;
          }
        }

        if (rulePaidOff) {
          finishedRules.push(index);
        }
      }
    }

    // remove rules back to front
    for (let i = finishedRules.length - 1; i >= 0; i--) {
      ruleDebtArr.splice(finishedRules[i], 1);
    }

    // apply new rules
    for (let i = 0; i < rulesUsed.length && cents > 0; i++) {
      const rule = rulesUsed[i];
      if (rule[merchant] > 0) {
        if (cents >= rule[merchant]) {
          cents -= rule[merchant];
          rule[merchant] = 0;
          // check if rule has other unfulfilled requirements
          let ruleNotPaidOff = false;
          for (let merchantCode of merchantCodeArr) {
            if (rule[merchantCode] > 0) {
              ruleNotPaidOff = true;
            }
          }
          if (ruleNotPaidOff) {
            rule[merchant] = 0;
            ruleDebtArr.push(rule);
          }
        } else {
          rule[merchant] -= cents;
          cents = 0;
          ruleDebtArr.push(rule);
        }

        points += rule.points;
        rulesUsed.splice(i, 1); // remove rule
        i--; // fix indexing
      }
    }

    // Apply rule 7 to the remaining cents
    if (cents > 0) {
      if (centDebt > cents) {
        cents = 0;
        centDebt -= cents;
      } else if (index !== numTransactions - 1) {
        cents -= centDebt;
        points += Math.ceil(cents / 100);
        centDebt = 100 - (cents % 100);
      } else {
        // Can't incurr debt on last transaction
        cents -= centDebt;
        points += Math.floor(cents / 100);
      }
    }

    transactionResult.push(transactionId + " points: " + points);
  }
  return transactionResult;
}
