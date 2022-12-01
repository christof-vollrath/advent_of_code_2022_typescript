// Advent of code 2022 - day 01

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

function readFileInputLines(path: string) {
    const inputData = readFileInput(path)
    return inputData.split('\n')
}

function readFileInputNumbers(path: string) {
    const inputLines = readFileInputLines(path)
    return inputLines.map((line) => parseInt(line))
}

describe("Day 01 Part One", () =>{
    describe("Example", () => {
        it("should do something", () => {
        })
    })
    describe("Exercise", () => {
        describe("Read file input", () => {
            it ("Should read input", () => {
                const inputString = readFileInput("inputDay01.txt")
                expect(inputString.length).toBe(9821)
            })
            it ("Should read input lines", () => {
                const inputLines = readFileInputLines("inputDay01.txt")
                expect(inputLines.length).toBe(2000)
            })
            it ("Should read input numbers", () => {
                const inputNumbers = readFileInputNumbers("inputDay01.txt")
                expect(inputNumbers.length).toBe(2000)
                expect(inputNumbers[0]).toBe(103)
            })
        })
        describe("Find solution", () => {
            it ("should have found the solution", () => {
            })
        })
    })
})
