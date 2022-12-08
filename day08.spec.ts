// Advent of code 2022 - day 08

import {readFileSync} from "fs"
import * as Collections from "typescript-collections"


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseForrest(lines: string[]): number[][] {
    return lines.map(l => {
        const chars = l.split("")
        return chars.map(c => Number.parseInt(c))
    })
}

class Coordinates2 {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

class Tree {
    height: number
    coord: Coordinates2

    constructor(x: number, y: number, height: number) {
        this.coord = new Coordinates2(x, y)
        this.height = height;
    }

    toString() {
        return `${this.coord.x}-${this.coord.y}-${this.height}`
    }
}
function findVisibleTrees(forrest: number[][]): Collections.Set<Tree> {
    function handleTree(x: number, y: number, maxHeight: number) {
        const height = forrest[y][x]
        if (height > maxHeight) {
            result.add(new Tree(x, y, height))
            return height
        } else return maxHeight
    }
    const result: Collections.Set<Tree> = new Collections.Set()
    for (let y = 0; y < forrest.length; y++) {
        const row = forrest[y]
        let maxHeight = -1
        for (let x = 0; x < row.length; x++) {
            maxHeight = handleTree(x, y, maxHeight)
        }
        maxHeight = -1
        for (let x = row.length-1; x >= 0; x--) {
            maxHeight = handleTree(x, y, maxHeight)
        }
    }
    for (let x = forrest.length-1; x >= 0; x--) {
        const column = forrest[x]
        let maxHeight = -1
        for (let y = 0; y < column.length; y++) {
            maxHeight = handleTree(x, y, maxHeight)
        }
        maxHeight = -1
        for (let y = column.length-1; y >= 0; y--) {
            maxHeight = handleTree(x, y, maxHeight)
        }
    }
    return result
}

function findView(forrest: number[][], coordinates2: Coordinates2) {
    function handleTree(x: number, y: number): boolean {
        const currHeight = forrest[coordinates2.y][coordinates2.x]
        const height = forrest[y][x]
        return height >= currHeight
    }
    const result: number[] = []
    const xLength = forrest[0].length
    const yLength = forrest.length
    if (coordinates2.y > 0) {
        let count = 0
        for (let y = coordinates2.y-1; y >= 0; y--) {
            count++
            if (handleTree(coordinates2.x, y)) break
        }
        result.push(count)
    }
    if (coordinates2.x > 0) {
        let count = 0
        for (let x = coordinates2.x-1; x >= 0; x--) {
            count++
            if (handleTree(x, coordinates2.y)) break
        }
        result.push(count)
    }
    if (coordinates2.y < yLength) {
        let count = 0
        for (let y = coordinates2.y+1; y < yLength; y++) {
            count++
            if (handleTree(coordinates2.x, y)) break
        }
        result.push(count)
    }
    if (coordinates2.x < xLength) {
        let count = 0
        for (let x = coordinates2.x+1; x < xLength; x++) {
            count++
            if (handleTree(x, coordinates2.y)) break
        }
        result.push(count)
    }
    return result
}

function calculateScenicScore(forrest: number[][], coordinates2: Coordinates2) {
    const [v1, v2, v3, v4] = findView(forrest, coordinates2);
    return v1 * v2 * v3 * v4
}

function calculateBestScenicScore(forrest: number[][]) {
    let bestScore = 0
    for (let y = 0; y < forrest.length; y++) {
        const col = forrest[y]
        for (let x = 0; x < col.length; x++) {
            const score = calculateScenicScore(forrest, new Coordinates2(x, y))
            if (bestScore < score) bestScore = score
        }
    }
    return bestScore
}

describe("Day 8", () => {
    const example = `
    30373
    25512
    65332
    33549
    35390`

    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 5 lines", () => {
            expect(lines.length).toBe(5)
        })
        const forrest = parseForrest(lines)
        it("should have parsed forrest", () => {
            expect(forrest.length).toBe(5)
            for (const row of forrest) {
                expect(row.length).toBe(5)
            }
        })
        it("should find visible trees", () => {
           const visibleTrees = findVisibleTrees(forrest);
           expect(visibleTrees.size()).toBe(21)
        });
        it("should find views", () => {
            expect(findView(forrest, new Coordinates2(2, 1))).toStrictEqual([1, 1, 2, 2])
            expect(findView(forrest, new Coordinates2(2, 3))).toStrictEqual([2, 2, 1, 2])
        });
        it("should calculate scenic score", () => {
            expect(calculateScenicScore(forrest, new Coordinates2(2, 1))).toBe(4)
            expect(calculateScenicScore(forrest, new Coordinates2(2, 3))).toBe(8)
        });
        it("should find best scenic score", () => {
            expect(calculateBestScenicScore(forrest)).toBe(8)
        });
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay08.txt")
        const lines = parseLines(input)
        const forrest = parseForrest(lines)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(99)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const visibleTrees = findVisibleTrees(forrest);
                expect(visibleTrees.size()).toBe(1647)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                expect(calculateBestScenicScore(forrest)).toBe(392080)
            })
        })
    })

})
