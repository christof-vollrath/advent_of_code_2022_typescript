// Advent of code 2022 - day 03

import {readFileSync} from "fs";
import {calculateSum} from "./day02.spec";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseRucksacks(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}


function string2array(str: string) {
    return str.split("");
}

function splitIntoHalves(strings: string[]) {
    const half = strings.length / 2
    return [strings.slice(0,half), strings.slice(half)]
}

function intersectionOfTwoArrays<T>(arrays: T[][]) {
    const set = new Set(arrays[1])
    return arrays[0].filter(x => set.has(x));
}

function letterValue(str: string) {
    if ("a" <= str && str <= "z") return str.charCodeAt(0) - "a".charCodeAt(0) + 1
    if ("A" <= str && str <= "Z") return str.charCodeAt(0) - "A".charCodeAt(0) + 27
}

function calculateRucksackPriority(string: string[]): number {
    return letterValue(string[0])!;
}

function calculateRucksackPriorities(rucksacks: string[]) {
    return rucksacks.map(r => calculateRucksackPriority(intersectionOfTwoArrays(splitIntoHalves(string2array(r)))));
}

export function calculateSumNumbers (list: number[]) {
    return calculateSum(list, x => x)
}

function groupBy3(strings: string[]) {
    const result: string[][] = []
    let puf: string[] = []
    for(const str of strings) {
        if (puf.length == 3) {
            result.push(puf)
            puf = []
        }
        puf.push(str)
    }
    result.push(puf)
    return result
}

function intersectionOfStrings(strings: string[]) {
    let result: string[] | null = null
    for (const str of strings) {
        if (result === null) {
            result = string2array(str)
        } else {
            result = intersectionOfTwoArrays([result, string2array(str)])
        }
    }
    return result!
}

function calculateGroupPriorities(input: string[]) {
    const groups = groupBy3(input)
    return groups.map(group => {
        const groupIntersection = intersectionOfStrings(group)
        return calculateRucksackPriority(groupIntersection)
    })
}

describe("Day 3", () => {
    const example = `
    vJrwpWtwJgWrhcsFMMfFFhFp
    jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL
    PmmdzqPrVvPwwTWBwg
    wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn
    ttgJtRGJQctTZtZT
    CrZsJsPPZsGzwwsLwLmpwMDw
    `
    describe("helpful functions", () => {
        it("should convert a string to an array", () => {
           expect(string2array("abc")).toStrictEqual(["a", "b", "c"])
        });
        it("should split array in halves", () => {
            expect(splitIntoHalves(string2array("abcd"))).toStrictEqual([["a", "b"], ["c", "d"]])
        });
        it("should find intersection", () => {
            expect(intersectionOfTwoArrays(splitIntoHalves(string2array("abcdcb")))).toStrictEqual(["b", "c"])
        });
        it("should find priority", () => {
            expect(letterValue("a")).toStrictEqual(1)
            expect(letterValue("B")).toStrictEqual(28)
        });
        it ("should group by 3", () => {
            const simpleRucksacks = ["1", "2", "3", "4", "5", "6"]
            expect(groupBy3(simpleRucksacks)).toStrictEqual([["1", "2", "3"], ["4", "5", "6"]])
        })
        it("should find intersection of three arrays", () => {
            expect(intersectionOfStrings(["abcd", "dcb", "acd"])).toStrictEqual(["c", "d"])
        });
    })

    describe("Example", () => {
        const rucksacks = parseRucksacks(example);
        it("should have parsed rucksacks", () => {
            expect(rucksacks.length).toBe(6)
        })
        it("should calculate priority of rucksack", () => {
            expect(calculateRucksackPriority(intersectionOfTwoArrays(splitIntoHalves(string2array(rucksacks[0]))))).toBe(16)
        })
        it("should calculate priorities of all rucksacks", () => {
            expect(calculateRucksackPriorities(rucksacks)).toStrictEqual([16, 38, 42, 22, 20, 19])
        })
        it("should calculate sum of priorities of all rucksacks", () => {
            expect(calculateSumNumbers(calculateRucksackPriorities(rucksacks))).toStrictEqual(157)
        })
        it("should calculate priorities of all groups", () => {
            expect(calculateGroupPriorities(rucksacks)).toStrictEqual([18, 52])
        })
        it("should calculate sum of priorities of all groups", () => {
            expect(calculateSumNumbers(calculateGroupPriorities(rucksacks))).toStrictEqual(70)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay03.txt")
        const rucksacks = parseRucksacks(input);
        it("should have parsed rucksacks", () => {
            expect(rucksacks.length).toBe(300)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                expect(calculateSumNumbers(calculateRucksackPriorities(rucksacks))).toBe(7872)
          })
        })
        describe("Part 2", () => {
            it("should calculate sum of groups", () => {
                expect(calculateSumNumbers(calculateGroupPriorities(rucksacks))).toBe(2497)
            });
        })
    })
})
