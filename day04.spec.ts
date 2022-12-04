// Advent of code 2022 - day 04

import {readFileSync} from "fs";

type Section = {
    from: number,
    to: number
}

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseSection(s: string): Section {
    const parts = s.split("-")
    return { from: Number.parseInt(parts[0]), to: Number.parseInt(parts[1]) }
}

function parseSections(s: string): Section[] {
    const parts = s.split(",")
    return [ parseSection(parts[0]), parseSection(parts[1])]
}

function parseSectionLines(lines: string[]): Section[][] {
    return lines.map(l => parseSections(l))
}

function fullyContained(section: Section[]) {
    return section[0].from >= section[1].from && section[0].to <= section[1].to ||
        section[1].from >= section[0].from && section[1].to <= section[0].to
}

function countFullyContained(sections: Section[][]) {
    return sections.filter(s => fullyContained(s)).length
}

describe("Day 4 Part One", () => {
    const example = `
    2-4,6-8
    2-3,4-5
    5-7,7-9
    2-8,3-7
    6-6,4-6
    2-6,4-8
    `
    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 6 lines", () => {
            expect(lines.length).toBe(6)
        })
        it("should parse section", () => {
            const section = parseSection("2-8")
            expect(section).toEqual({ from: 2, to: 8 })
        })
        it("should parse sections", () => {
            const sections = parseSections("2-8,3-7")
            expect(sections).toEqual([{ from: 2, to: 8 }, { from: 3, to: 7 }])
        })
        const sections = parseSectionLines(lines)
        it("should parse all sections", () => {
            expect(sections.length).toEqual(6)
            expect(sections[0]).toEqual([{ from: 2, to: 4}, { from: 6, to: 8 }])
        })
        it("should find fully contained pairs", () => {
            expect(fullyContained([{ from: 2, to: 8}, { from: 6, to: 8 }])).toEqual(true)
            expect(fullyContained([{ from: 6, to: 8 }, { from: 2, to: 8}])).toEqual(true)
            expect(fullyContained([{ from: 2, to: 4 }, { from: 5, to: 7 }])).toEqual(false)
        })
        it("should count fully contained", () => {
            expect(countFullyContained(sections)).toEqual(2)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay04.txt")
        const sections = parseSectionLines(parseLines(input));
        it("should have parsed sections", () => {
            expect(sections.length).toBe(1000)
        })
        describe("Part 1", () => {
            describe("Find solution", () => {
                expect(countFullyContained(sections)).toEqual(532)
          })
        })
    })

})
