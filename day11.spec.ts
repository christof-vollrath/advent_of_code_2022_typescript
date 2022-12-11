// Advent of code 2022 - day 11

import {readFileSync} from "fs"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim())
}

class MonkeyPlusOperation {
    constructor(par: number) {
        this.par = par;
    }
    readonly par: number
}
class MonkeyMultOperation {
    constructor(par: number) {
        this.par = par;
    }
    readonly par: number
}
class MonkeySquareOperation {
}

type MonkeyOperation = MonkeyMultOperation | MonkeyPlusOperation | MonkeySquareOperation

class Monkey {
    declare nr: number;
    declare items: number[]
    declare divisibleBy: number
    declare trueMonkey: number
    declare falseMonkey: number
    declare operation: MonkeyOperation
    activeCount = 0

    executeOneRound(monkeys: Monkey[], divideBy3: boolean = true) {
        function applyOperation(operation: MonkeyOperation, item: number) {
            if (operation instanceof MonkeyPlusOperation)
                return item + operation.par
            else if  (operation instanceof MonkeyMultOperation)
                return item * operation.par
            else return item * item
        }

        console.log(JSON.stringify(this.items))
        const workingItems = [... this.items]
        this.items = [] // all items will be consumed in one round
        for (const item of workingItems) {
            this.activeCount++
            const nextLevel = applyOperation(this.operation, item)
            const reliefNextLevel = divideBy3 ? Math.floor(nextLevel / 3) : nextLevel
            if (reliefNextLevel % this.divisibleBy === 0) monkeys[this.trueMonkey].items.push(reliefNextLevel)
            else  monkeys[this.falseMonkey].items.push(reliefNextLevel)
        }
    }
}

function parseMonkey(lines: string[]) {
    function parseNumber(regex: RegExp, line: string) {
        let nrResult = regex.exec(line)
        if (nrResult && nrResult.length >= 1) {
            return Number.parseInt(nrResult[1])
        }
        return null
    }
    const monkey = new Monkey()
    for (const line of lines) {
        let nrResult = parseNumber(/Monkey (.*):/, line)
        if (nrResult !== null) monkey.nr = nrResult
        const itemsRegex = /\s*Starting items: (.*)/
        let itemsResult = itemsRegex.exec(line)
        if (itemsResult && itemsResult.length >= 1) {
            monkey.items = itemsResult[1].split(",")
                .map(s => Number.parseInt(s.trim()))
        }
        let divisibleByResult = parseNumber(/\s*Test: divisible by (.*)/, line)
        if (divisibleByResult !== null) monkey.divisibleBy = divisibleByResult
        let trueMonkeyResult = parseNumber(/\s*If true: throw to monkey (.*)/, line)
        if (trueMonkeyResult !== null) monkey.trueMonkey = trueMonkeyResult
        let falseMonkeyResult = parseNumber(/\s*If false: throw to monkey (.*)/, line)
        if (falseMonkeyResult !== null) monkey.falseMonkey = falseMonkeyResult
        let plusOperationResult = parseNumber(/\s*Operation: new = old \+ (\d+)/, line)
        if (plusOperationResult !== null) monkey.operation = new MonkeyPlusOperation(plusOperationResult)
        let minusOperationResult = parseNumber(/\s*Operation: new = old \* (\d+)/, line)
        if (minusOperationResult !== null) monkey.operation = new MonkeyMultOperation(minusOperationResult)
        const squareOperationRegex = /\s*Operation: new = old \* old/
        let squareOperationResult = squareOperationRegex.exec(line)
        if (squareOperationResult && squareOperationResult.length >= 0) {
            monkey.operation = new MonkeySquareOperation()
        }
    }
    return monkey;
}

function parseMonkeys(lines: string[]) {
    const result: Monkey[] = []
    let currMonkeyLines: string[] = []
    for (let l of lines) {
        if (l.trim().length === 0) {
            const monkey = parseMonkey(currMonkeyLines)
            result.push(monkey)
            currMonkeyLines = []
        } else currMonkeyLines.push(l)
    }
    if (currMonkeyLines.length > 0) {
        const monkey = parseMonkey(currMonkeyLines)
        result.push(monkey)
    }
    return result
}

function executeRounds(monkeys: Monkey[], rounds: number = 1, divideBy3: boolean = true) {
    for (let i = 0; i < rounds; i++) {
        for (const monkey of monkeys)
            monkey.executeOneRound(monkeys, divideBy3)
    }
}

function calculateMonkeyLevel(monkeys: Monkey[]) {
    const activeCounts = monkeys.map(m => m.activeCount).sort((a, b) => b - a)
    return activeCounts[0] * activeCounts[1]
}

describe("Day 11", () => {

    const example =
`Monkey 0:
  Starting items: 79, 98
  Operation: new = old * 19
  Test: divisible by 23
    If true: throw to monkey 2
    If false: throw to monkey 3

Monkey 1:
  Starting items: 54, 65, 75, 74
  Operation: new = old + 6
  Test: divisible by 19
    If true: throw to monkey 2
    If false: throw to monkey 0

Monkey 2:
  Starting items: 79, 60, 97
  Operation: new = old * old
  Test: divisible by 13
    If true: throw to monkey 1
    If false: throw to monkey 3

Monkey 3:
  Starting items: 74
  Operation: new = old + 3
  Test: divisible by 17
    If true: throw to monkey 0
    If false: throw to monkey 1`

    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 27 lines", () => {
            expect(lines.length).toBe(27)
        })
        const monkeys = parseMonkeys(lines)
        it("should have parsed monkeys", () => {
            expect(monkeys.length).toBe(4)
            expect(monkeys[0]).toEqual({
                nr: 0,
                items: [79, 98],
                divisibleBy: 23,
                trueMonkey: 2,
                falseMonkey: 3,
                operation: new MonkeyMultOperation(19),
                activeCount: 0
            })
            expect(monkeys[2]).toEqual({
                nr: 2,
                items: [79, 60, 97],
                divisibleBy: 13,
                trueMonkey: 1,
                falseMonkey: 3,
                operation: new MonkeySquareOperation(),
                activeCount: 0
            })
            expect(monkeys[3]).toEqual({
                nr: 3,
                items: [74],
                divisibleBy: 17,
                trueMonkey: 0,
                falseMonkey: 1,
                operation: new MonkeyPlusOperation(3),
                activeCount: 0
            })
        })
        describe("Execute round by round", () => {
            const monkeys = parseMonkeys(lines)
            it("should execute round for monkey 0", () => {
                monkeys[0].executeOneRound(monkeys)
                expect(monkeys[3].items).toEqual([74, 500, 620])
                monkeys[1].executeOneRound(monkeys)
                expect(monkeys[0].items).toEqual([20, 23, 27, 26])

            })
        })
        describe("Execute one round for all monkeys", () => {
            const monkeys = parseMonkeys(lines)
            it("should execute one round for all monkeys", () => {
                executeRounds(monkeys)
                const monkeysItems = monkeys.map(m => m.items)
                expect(monkeysItems).toEqual([
                    [20, 23, 27, 26],
                    [2080, 25, 167, 207, 401, 1046],
                    [],
                    [],
                ])
            })
            it("should execute another round for all monkeys", () => {
                executeRounds(monkeys)
                const monkeysItems = monkeys.map(m => m.items)
                expect(monkeysItems).toEqual([
                    [695, 10, 71, 135, 350],
                    [43, 49, 58, 55, 362],
                    [],
                    [],
                ])
            })
        })
        describe("Execute 20 rounds for all monkeys", () => {
            const monkeys = parseMonkeys(lines)
            it("should execute 20 rounds for all monkeys", () => {
                executeRounds(monkeys, 20)
                const monkeysItems = monkeys.map(m => m.items)
                expect(monkeysItems).toEqual([
                    [10, 12, 14, 26, 34],
                    [245, 93, 53, 199, 115],
                    [],
                    [],
                ])
                expect(monkeys.map(m => m.activeCount)).toEqual([101, 95, 7, 105])
                expect(calculateMonkeyLevel(monkeys)).toBe(10605)
            })
        })
        describe("Execute rounds for all monkeys without divide by 3", () => {
            const monkeys = parseMonkeys(lines)
            it("should execute up to 1000 rounds for all monkeys", () => {
                executeRounds(monkeys, 1, false)
                expect(monkeys.map(m => m.activeCount)).toEqual([2, 4, 3, 6])
                executeRounds(monkeys, 19, false)
                expect(monkeys.map(m => m.activeCount)).toEqual([99, 97, 8, 103])
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay11.txt")
        const lines = parseLines(input)
        const monkeys = parseMonkeys(lines)
        it("should have parsed monkeys", () => {
            expect(monkeys.length).toBe(8)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                executeRounds(monkeys, 20)
                expect(calculateMonkeyLevel(monkeys)).toBe(55930)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
