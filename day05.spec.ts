// Advent of code 2022 - day 05

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n")
}

function splitCratesAndPlanedSteps(lines: string[]) {
    const cratesLines = []
    const plannedStepsLines = []
    let readingCrates = true
    for (const line of lines) {
        if (readingCrates) {
            if (line.trim().length === 0) readingCrates = false
            else {
                cratesLines.push(line)
            }
        } else {
            const trimmedLine = line.trim()
            if (trimmedLine.length !== 0) plannedStepsLines.push(trimmedLine)
        }
    }
    return [cratesLines, plannedStepsLines]
}

function parseCrates(parseCrates: string[]) {
    const pureCratesLines = parseCrates.filter(l => /\s*\[/.test(l) )

    const result: string[][] = []
    let y2 = 0
    for(let y = pureCratesLines.length-1; y >= 0; y--) {
        const pureCratesLine = pureCratesLines[y]
        const stackLevel :string[] = []
        for (let xPos = 1; xPos < pureCratesLine.length; xPos += 4) {
            stackLevel[Math.round(xPos / 4)] = pureCratesLine[xPos]
        }
        for (let x = 0; x < stackLevel.length; x++) {
            const crate = stackLevel[x]
            if (crate.trim().length > 0) {
                if (y2 === 0)
                    result[x] = [crate]
                else
                    result[x].push(crate)
            }
        }
        y2++
    }
    return result
}

type Move = {
    nrCrates: number,
    from: number,
    to: number
}

function parseStep(stepsLine: string): Move {
    const parts = stepsLine.split(" ")
    if (parts.length !== 6) throw new Error("Can't parse move")
    return { nrCrates: Number.parseInt(parts[1]),
        from: Number.parseInt(parts[3]),
        to: Number.parseInt(parts[5])
    }
}

function parseSteps(stepsLines: string[]): Move[] {
    return stepsLines.map(s => parseStep(s))
}

function parseCratesAndPlanedSteps(lines: string[]): [string[][], Move[]] {
    const [cratesLines, plannedStepsLines] = splitCratesAndPlanedSteps(lines)
    const crates = parseCrates(cratesLines)
    const steps = parseSteps(plannedStepsLines)
    return [crates, steps]
}

function craneMove(move: Move, crates: string[][]) {
    const removedCrates = crates[move.from-1].slice(crates[move.from-1].length-move.nrCrates)
    crates[move.from-1] = crates[move.from-1].slice(0, crates[move.from-1].length-move.nrCrates)
    crates[move.to-1].push(...(removedCrates.reverse()))
}

function craneDoAllMoves(steps: Move[], crates: string[][]) {
    for (const move of steps) craneMove(move, crates)
}

function topCranes(crates: string[][]) {
    return crates.map(stack => stack[stack.length-1]).join("");
}

describe("Day 5 Part One", () => {
    const example =
`    [D]    
[N] [C]    
[Z] [M] [P]
 1   2   3 

move 1 from 2 to 1
move 3 from 1 to 3
move 2 from 2 to 1
move 1 from 1 to 2
`
    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 10 lines", () => {
            expect(lines.length).toBe(10)
        })
        const [cratesLines, plannedStepsLines] = splitCratesAndPlanedSteps(lines)
        it("should have found 4 crates lines", () => {
            expect(cratesLines.length).toBe(4)
        })
        it("should have found 4 planned steps lines", () => {
            expect(plannedStepsLines.length).toBe(4)
        })
        const [crates, steps] = parseCratesAndPlanedSteps(lines)
        it("should have parsed crates", () => {
            expect(crates).toStrictEqual([
                ["Z", "N"],
                ["M", "C", "D"],
                ["P"],
            ])
        })
        it("should have parsed steps", () => {
            expect(steps.length).toBe(4)
            expect(steps[0]).toStrictEqual({
                nrCrates: 1,
                from: 2,
                to: 1
            })
        })
        it("crane should move crates", () => {
            craneMove(steps[0], crates)
            expect(crates).toStrictEqual([
                ["Z", "N", "D"],
                ["M", "C"],
                ["P"],
            ])
            craneMove(steps[1], crates)
            expect(crates).toStrictEqual([
                [],
                ["M", "C"],
                ["P", "D", "N", "Z"],
            ])
            craneMove(steps[2], crates)
            expect(crates).toStrictEqual([
                ["C", "M"],
                [],
                ["P", "D", "N", "Z"],
            ])
            craneMove(steps[3], crates)
            expect(crates).toStrictEqual([
                ["C"],
                ["M"],
                ["P", "D", "N", "Z"],
            ])
        })
        it("crane should do all moves", () => {
            const [crates, steps] = parseCratesAndPlanedSteps(lines) // update crates, because they had been moved in the test before
            expect(crates).toStrictEqual([
                ["Z", "N"],
                ["M", "C", "D"],
                ["P"],
            ])
            craneDoAllMoves(steps, crates)
            expect(crates).toStrictEqual([
                ["C"],
                ["M"],
                ["P", "D", "N", "Z"],
            ])
        })
        it("should combine top cranes", () => {
            expect(topCranes(crates)).toBe("CMZ")
        })

    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay05.txt")
        const lines = parseLines(input)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(514)
        })
        const [crates, steps] = parseCratesAndPlanedSteps(lines)
        it("should have parsed crates and steps", () => {
            expect(crates.length).toBe(9)
            expect(steps.length).toBe(503)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                craneDoAllMoves(steps, crates)
                expect(topCranes(crates)).toBe("FWSHSPJWM")
            })
        })
        /*
        describe("Part 2", () => {
            it("should find solution", () => {
                expect(countOverlapping(sections)).toEqual(854)
            })
        })
         */
    })

})
