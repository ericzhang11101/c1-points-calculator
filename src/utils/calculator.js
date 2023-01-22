import {merchantCodes, merchantCodeArr} from './types'
import {rules} from './rules'

export async function tryCalculation(transactions){
    try{
        const res = calculatePoints(JSON.parse(transactions))
        return res
    } catch (error){
        return {
            success: false,
            error
        }
    }
}

function calculatePoints(transactions){
    const transactionKeys = Object.keys(transactions)
    const totals = {
        [merchantCodes.sportcheck]: 0,
        [merchantCodes.tim_hortons]: 0,
        [merchantCodes.subway]: 0,
        [merchantCodes.other]: 0
    }

    // sum
    for (let key of transactionKeys){
        const transaction = transactions[key]
        
        if (totals[transaction['merchant_code']] !== undefined){
            totals[transaction['merchant_code']] += transaction['amount_cents']
        } else {
            totals['other'] += transaction['amount_cents']
        }
    }

    let maxPoints = 0
    let rulesUsed = []

    console.log('backtracking !')
    backtrack(0, totals, [], null) // calculate max points
    console.log('max points: ' + maxPoints)
    // console.log('rules used: ' + rulesUsed.map(rule => rule.rule)) // excludes 7

    const transactionResult = calculateRulesUsed(rulesUsed, transactionKeys, transactions)
    
    return {
        points: maxPoints,
        transactions: transactionResult,
        success: true
    }

    function backtrack(points, totals, rulesApplied, lastRuleApplied){

        let anyRuleValid = false // if no rules can be applied, do rule 7
        let usePrev = false

        // if rule used in last solution is valid, it is optimal
        if (lastRuleApplied !== null){
            const rule = rules[lastRuleApplied]

            // check if valid again
            let ruleValid = true
            
            for (let merchant of merchantCodeArr){
                if (rule[merchant] > totals[merchant]) {
                    // rule cannot be applied 
                    ruleValid = false
                }
            }

            if (ruleValid){
                let tempTotals = {...totals}
                for (let merchant of merchantCodeArr){
        
                    if (rule[merchant]){
                        tempTotals[merchant] -= rule[merchant]
                    }
                }
        
                usePrev = true

                backtrack(
                    points + rule.points,
                    tempTotals,
                    [...rulesApplied, {...rule}],
                    lastRuleApplied
                )
            }
            
        }

        if (!usePrev){
            for (let [index, rule] of rules.entries()){
                let ruleValid = true
                
                for (let merchant of merchantCodeArr){
                    if (rule[merchant]> totals[merchant]) {
                        // rule cannot be applied 
                        ruleValid = false
                    }
                }
        
                if (ruleValid) { 
                    anyRuleValid = true // some rule valid, wait until later to do rule 7
        
                    let tempTotals = {...totals}
                    for (let merchant of merchantCodeArr){
        
                        if (rule[merchant]){
                            tempTotals[merchant] -= rule[merchant]
                        }
                    }
        
                    backtrack(
                        points + rule.points,
                        tempTotals,
                        [...rulesApplied, {...rule}],
                        index
                    )
                }
                
            }
        }

        if (!anyRuleValid) {
            // get all remaining cents 
            let leftoverCents = 0

            for (let merchant of merchantCodeArr){
                leftoverCents += totals[merchant]
            }

            points += Math.floor(leftoverCents/100) // rule 7, will calculate later

            if (points > maxPoints){
                maxPoints = points
                rulesUsed = rulesApplied
            }
        }
    }
}

function calculateRulesUsed(rulesUsed, transactionKeys, transactions){
    const transactionResult = []

    let ruleDebtArr = []
    let centDebt = 0
    // retroactively apply rules (counts when there is enough, to satisfy the rule, i.e if the rule requires two different stores, the rule is applied when the second one is fulfilled )
    for (let [index, key] of transactionKeys.entries()){
        const transaction = transactions[key]
        let points = 0
        let {amount_cents: cents, merchant_code: merchant} = transaction
        let finishedRules = []

        // check rules that have been applied but not paid off 
        for (let [index, rule] of ruleDebtArr.entries()){
            // reduce transaction 
            if (rule[merchant] > 0){
                if (rule[merchant] >= cents){
                    rule[merchant] -= cents
                    cents = 0
                } else {
                    cents -= rule[merchant]
                    rule[merchant] = 0
                }

                // check if rule done 
                let rulePaidOff = true
                for (let ruleMerchant of merchantCodeArr){
                    if (rule[ruleMerchant] !== 0){
                        rulePaidOff = false
                    }
                }
                if (rulePaidOff){
                    finishedRules.push(index)
                }
            }
        }

        // remove rules back to front 
        for (let i = finishedRules.length - 1; i >= 0; i--){
            ruleDebtArr.splice(finishedRules[i], 1)
        }
        
        // apply new rules 
        for (let i = 0; i < rulesUsed.length && cents > 0; i++){
            const rule = rulesUsed[i]
            if (rule[merchant] > 0){

                if (cents >= rule[merchant]){
                    cents -= rule[merchant]
                    rule[merchant] = 0
                    // check if rule has other unfulfilled requirements 

                    let unfulfilled = false
                    for (let merchantCode of merchantCodeArr) {
                        if (rule[merchantCode] > 0){
                            unfulfilled = true
                        }
                    }

                    if (unfulfilled){
                        rule[merchant] = 0
                        ruleDebtArr.push(rule)
                    }
                } else {
                    rule[merchant] -= cents
                    cents = 0
                    ruleDebtArr.push(rule)
                }

                points += rule.points
                rulesUsed.splice(i, 1) // remove rule
                i -- // fix indexing
            }
        }

        // rule 7
        if (cents > 0){
            if (centDebt > cents){
                cents = 0;
                centDebt -= cents
            } else if (index !== transactionKeys.length) { // cant have debt on last transaction
                cents -= centDebt
                points += Math.ceil(cents/100)
                centDebt = 100 - (cents % 100)
            }
            
        }

        transactionResult.push(key + " points: " + points)
    }
    return transactionResult
}