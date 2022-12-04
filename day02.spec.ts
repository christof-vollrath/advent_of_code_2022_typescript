// Advent of code 2022 - day 02

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

type RockPaperScissors = {
    opponent: Choice;
    myself: Choice
}

enum Choice {
    A = "A",
    B = "B",
    C = "C",
    X = "X",
    Y = "Y",
    Z = "Z",
}

enum RoundResult {
    WIN, LOOSE, DRAW
}

function toChoice(str: string): Choice {
    return Choice[str as keyof typeof Choice]
}

function parseRockPaperScissors(input: string): RockPaperScissors[] {
    const lines = input.split('\n')
    return lines.map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
        const parts = line.split(' ')
        return { opponent: toChoice(parts[0]), myself: toChoice(parts[1]) }
    })
}

function playRound(rockPaperScissor: {opponent: Choice; myself: Choice}) {
    switch (rockPaperScissor.opponent) {
        case Choice.A: if (rockPaperScissor.myself == Choice.X) return RoundResult.DRAW
            else  if (rockPaperScissor.myself == Choice.Z) return RoundResult.LOOSE
            break;
        case Choice.B: if (rockPaperScissor.myself == Choice.Y) return RoundResult.DRAW
            else  if (rockPaperScissor.myself == Choice.X) return RoundResult.LOOSE
                break;
        case Choice.C: if (rockPaperScissor.myself == Choice.Z) return RoundResult.DRAW
            else  if (rockPaperScissor.myself == Choice.Y) return RoundResult.LOOSE
                break;
    }
    return RoundResult.WIN
}

function calculateScore(rockPaperScissor: {opponent: Choice; myself: Choice}) {
    let result = 0
    switch (rockPaperScissor.myself) {
        case Choice.X: result += 1; break
        case Choice.Y: result += 2; break
        case Choice.Z: result += 3; break
    }
    const roundResult = playRound(rockPaperScissor)
    switch(roundResult) {
        case RoundResult.DRAW: result += 3; break
        case RoundResult.WIN: result += 6; break
        case RoundResult.LOOSE: result += 0; break
    }
    return result;
}

function calculateScoreSum(rockPaperScissors: RockPaperScissors[]) {
    return calculateSum(rockPaperScissors, calculateScore)

}

function findRightMove(rps: RockPaperScissors) {
    let expectedResult;
    switch(rps.myself) {
        case Choice.X: expectedResult = RoundResult.LOOSE; break
        case Choice.Y: expectedResult = RoundResult.DRAW; break
        case Choice.Z: expectedResult = RoundResult.WIN; break
    }
    for (const move of [Choice.X, Choice.Y, Choice.Z]) {
        if (playRound({ opponent: rps.opponent, myself: move}) === expectedResult) return move
    }
    throw new Error("No move found")
}

function calculateScore2(rps: {opponent: Choice; myself: Choice}) {
    const myMove = findRightMove(rps)
    return calculateScore({ opponent: rps.opponent, myself: myMove} )
}

export function calculateSum<T> (list: T[], f: ((t: T) => number)) {
    let sum = 0;
    for (const v of list) {
        sum += f(v);
    }
    return sum
}

function calculateScoreSum2(rockPaperScissors: RockPaperScissors[]) {
    return calculateSum(rockPaperScissors, calculateScore2)
}


describe("Day 2 Part One", () => {
    const example = `
        A Y
        B X
        C Z
    `
    describe("Example", () => {
        const rockPaperScissors = parseRockPaperScissors(example);
        it("should have parsed rock paper scissors", () => {
            expect(rockPaperScissors.length).toBe(3)
            expect(rockPaperScissors[0]).toStrictEqual({ opponent: Choice.A, myself: Choice.Y })
            expect(rockPaperScissors[2]).toStrictEqual({ opponent: Choice.C, myself: Choice.Z })
        })

        it("should find winner", () => {
            expect(playRound({ opponent: Choice.A, myself: Choice.Y })).toBe(RoundResult.WIN)
            expect(playRound({ opponent: Choice.B, myself: Choice.Y })).toBe(RoundResult.DRAW)
            expect(playRound({ opponent: Choice.C, myself: Choice.Y })).toBe(RoundResult.LOOSE)
        });
        it("should calculate score", () => {
            expect(calculateScore({ opponent: Choice.A, myself: Choice.Y })).toBe(2 + 6)
            expect(calculateScore({ opponent: Choice.B, myself: Choice.Y })).toBe(2 + 3)
            expect(calculateScore({ opponent: Choice.C, myself: Choice.Y })).toBe(2)
        });
        it("should calculate score sum", () => {
            expect(calculateScoreSum(rockPaperScissors)).toBe(15)
        });
        it("should calculate find right move", () => {
            expect(findRightMove({ opponent: Choice.A, myself: Choice.Y })).toBe(Choice.X)
            expect(findRightMove({ opponent: Choice.A, myself: Choice.X })).toBe(Choice.Z)
            expect(findRightMove({ opponent: Choice.A, myself: Choice.Z })).toBe(Choice.Y)
        })
        it("should calculate score", () => {
            expect(calculateScore2({ opponent: Choice.A, myself: Choice.Y })).toBe(1 + 3)
            expect(calculateScore2({ opponent: Choice.B, myself: Choice.Y })).toBe(2 + 3)
            expect(calculateScore2({ opponent: Choice.C, myself: Choice.Y })).toBe(3 + 3)
        });
        it("should calculate score sum 2", () => {
            expect(calculateScoreSum2(rockPaperScissors)).toBe(12)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay02.txt")
        const rockPaperScissors = parseRockPaperScissors(input);
        it("should have parsed rock paper scissors", () => {
            expect(rockPaperScissors.length).toBe(2500)
            expect(rockPaperScissors[0]).toStrictEqual({ opponent: Choice.C, myself: Choice.Y })
            expect(rockPaperScissors[2499]).toStrictEqual({ opponent: Choice.B, myself: Choice.Z })
        })
        describe("Part 1", () => {
            describe("Find solution", () => {
                expect(calculateScoreSum(rockPaperScissors)).toBe(13446)
          })
        })
         describe("Part 2", () => {
            it("should calculate score sum 2", () => {
                expect(calculateScoreSum2(rockPaperScissors)).toBe(13509)
            });
         })
    })
})
