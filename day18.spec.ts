// Advent of code 2022 - day 18

import {readFileSync} from "fs"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

describe("Day 18", () => {

    const example = `
2,2,2
1,2,2
3,2,2
2,1,2
2,3,2
2,2,1
2,2,3
2,2,4
2,2,6
1,2,5
3,2,5
2,1,5
2,3,5
        `
    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 10 lines", () => {
            expect(lines.length).toBe(13)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay18.txt")
        const lines = parseLines(input)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(2781)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
