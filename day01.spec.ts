// Advent of code 2022 - day 01

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}


function parseNumberLines(input: string) {
    const lines = input.split('\n')
    return lines.map((line) => {
        if (line.trim().length === 0) return null
        else return parseInt(line)
    })
}
function readFileInputNumbers(path: string) {
    const inputLines = readFileInput(path)
    return parseNumberLines(inputLines)
}

function sumCaloriesOfElves(calories: (number | null)[]) {
    const result: number[] = []
    let sum = 0
    for (const cal of calories) {
        if (cal === null) {
            result.push(sum)
            sum = 0
        } else {
            sum += cal
        }
    }
    return result
}

function maxCalories(calories: number[]) {
    return Math.max(...calories)
}

function max3Calories(calories: number[]) {
    const sortedCalories = calories.sort((a, b) => b - a) // descending
    return sortedCalories.splice(0, 3)
}

function sumCalories(calories: number[]) {
    let sum = 0
    for ( const c of calories) {
        sum += c
    }
    return sum
}

describe("Day 01", () => {
    const example =
    `1000
    2000
    3000
    
    4000
    
    5000
    6000
    
    7000
    8000
    9000
    
    10000
    `
    describe("Example", () => {
        const exampleNumbers = parseNumberLines(example);
        it("should have parsed number lines", () => {
            expect(exampleNumbers.length).toBe(15)
            expect(exampleNumbers[0]).toBe(1000)
            expect(exampleNumbers[13]).toBe(10000)
            expect(exampleNumbers[14]).toBe(null)
        })
        it("should have calculated the calories for each elf", () => {
            const sum = sumCaloriesOfElves(exampleNumbers)
            expect(sum).toEqual([6000, 4000, 11000, 24000, 10000])
        });
        it("should find the elf with the most calories", () => {
            const max = maxCalories(sumCaloriesOfElves(exampleNumbers))
            expect(max).toEqual(24000)
        });
        const max3 = max3Calories(sumCaloriesOfElves(exampleNumbers))
        it("should have found the top three elves with the most calories", () => {
            expect(max3).toEqual([24000, 11000, 10000])
        });
        it("should sum the top 3 calories", () => {
            expect(sumCalories(max3)).toEqual(45000)
        });
    })
    describe("Exercise", () => {
        const inputNumbers = readFileInputNumbers("inputDay01.txt")
        describe("Part 1", () => {
            describe("Read file input", () => {
                it ("should have read and parsed input numbers", () => {
                    expect(inputNumbers.length).toBe(2238)
                    expect(inputNumbers[0]).toBe(17998)
                    expect(inputNumbers[2236]).toBe(13688)
                    expect(inputNumbers[2237]).toBe(null)
                })
            })
            describe("Find solution", () => {
                it ("should find the solution", () => {
                    const max = maxCalories(sumCaloriesOfElves(inputNumbers))
                    expect(max).toEqual(67658)
                })
            })
        })
        describe("Part 2", () => {
            const max3 = max3Calories(sumCaloriesOfElves(inputNumbers))
            it ("should find the solution", () => {
                expect(sumCalories(max3)).toEqual(200158)
            });
        })
    })
})
