import { merchantCodes } from './types'


export const rules = [
    {
        ruleId: 1,
        [merchantCodes.sportcheck]: 7500,
        [merchantCodes.tim_hortons]: 2500,
        [merchantCodes.subway ]: 2500,
        points: 500
    },
    {
        ruleId: 2,
        [merchantCodes.tim_hortons]: 7500,
        [merchantCodes.sportcheck]: 2500,
        [merchantCodes.subway]: 0,
        points: 500
    },
    {
        ruleId: 3,
        [merchantCodes.sportcheck]: 7500,
        [merchantCodes.tim_hortons]: 0,
        [merchantCodes.subway]: 0,
        points: 200
    },
    {
        ruleId: 4,
        [merchantCodes.sportcheck]: 2500,
        [merchantCodes.tim_hortons]: 1000,
        [merchantCodes.subway]: 1000,
        points: 150
    },
    {
        ruleId: 5,
        [merchantCodes.sportcheck]: 2500,
        [merchantCodes.tim_hortons]: 1000,
        [merchantCodes.subway]: 0,
        points: 75
    },
    {
        ruleId: 6,
        [merchantCodes.sportcheck]: 2000,
        [merchantCodes.tim_hortons]: 0,
        [merchantCodes.subway]: 0,
        points: 75
    }
    // no rule 7, doesnt matter in finding optimal
]
