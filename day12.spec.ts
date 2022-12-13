// Advent of code 2022 - day 12

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";
import * as Collections from "typescript-collections"
import {isEqual} from "lodash"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseHeightmap(lines: string[]) {
    const result: number[][] = []
    let start: Coordinates2 | null = null
    let target: Coordinates2 | null = null
    let y = 0
    for (const line of lines)
    {
        const chars = line.split("")
        const row = chars.map(c => {
            if (c === "S") return 1
            else if (c === "E") return 26
            else return c.charCodeAt(0) - "a".charCodeAt(0) + 1
        })
        for (let x = 0; x < chars.length; x++) {
            if (chars[x] === "S") start = new Coordinates2(x, y)
            if (chars[x] === "E") target = new Coordinates2(x, y)
        }
        result.push(row)
        y++
    }
    if (! start) throw new Error("No start found")
    if (! target) throw new Error("No target found")
    return { heightmap: result, start: start, target: target }
}
function heightmapToChars(heightmap: number[][]) {
    return heightmap.map(row => row.map(e => String.fromCharCode("a".charCodeAt(0) - 1 + e)))
}
function joinHeightmapChars(heightmap: string[][]) {
    return heightmap.map(row => row.join("")).join("\n")
}
function heightmapToString(heightmap: number[][]) {
    const charHeightmap = heightmapToChars(heightmap)
    return joinHeightmapChars(charHeightmap)
}

function getNeighbours(coordinates2: Coordinates2, heightmap: number[][]) {
    const result: Coordinates2[] = []
    if (coordinates2.y > 0) result.push(new Coordinates2(coordinates2.x, coordinates2.y - 1))
    if (coordinates2.y < heightmap.length - 1) result.push(new Coordinates2(coordinates2.x, coordinates2.y + 1))
    if (coordinates2.x > 0) result.push(new Coordinates2(coordinates2.x - 1, coordinates2.y))
    if (coordinates2.x < heightmap[coordinates2.y].length - 1) result.push(new Coordinates2(coordinates2.x + 1, coordinates2.y))
    return result
}

function getFilteredNeighbours(coordinates2: Coordinates2, heightmap: number[][], neighboursFilter: NeighboursFilter = neighboursFilter1) {
    const neighbours = getNeighbours(coordinates2, heightmap)
    return neighbours.filter(neighbour => neighboursFilter(neighbour, coordinates2, heightmap));
}

function neighboursFilter1(neighbour: Coordinates2, curr: Coordinates2, heightmap: number[][]) {
    const heightDifference = heightmap[neighbour.y][neighbour.x] - heightmap[curr.y][curr.x]
    return heightDifference <= 1
}

function neighboursFilter2(neighbour: Coordinates2, curr: Coordinates2, heightmap: number[][]) {
    const heightDifference = heightmap[neighbour.y][neighbour.x] - heightmap[curr.y][curr.x]
    return heightDifference >= -1
}


interface TargetChecker {
    checkTarget(curr: Coordinates2, heightmap: number[][]): boolean
}

class TargetChecker1 implements TargetChecker {
    target: Coordinates2

    constructor(target: Coordinates2) {
        this.target = target
    }

    checkTarget(curr: Coordinates2, _: number[][]): boolean {
        return isEqual(curr, this.target)
    }
}

class TargetChecker2 implements TargetChecker {
    checkTarget(curr: Coordinates2, heightmap: number[][]): boolean {
        return heightmap[curr.y][curr.x] === 1
    }
}

type NeighboursFilter = (neighbour: Coordinates2, curr: Coordinates2, heightmap: number[][]) => boolean

function findPath(heightmap: number[][], start: Coordinates2, targetChecker: TargetChecker, neighboursFilter: NeighboursFilter = neighboursFilter1) {
    const debugHeightmap = heightmapToChars(heightmap)
    const foundPaths = new Collections.Dictionary<Coordinates2, Coordinates2[]>()
    foundPaths.setValue(start, [])
    let paths = new Collections.Dictionary<Coordinates2, Coordinates2[]>()
    paths.setValue(start, [])
    while(true) {
        const nextPaths = new Collections.Dictionary<Coordinates2, Coordinates2[]>()
        for (const coord of paths.keys()) {
            const path = paths.getValue(coord)!
            const neighbours = getFilteredNeighbours(coord, heightmap, neighboursFilter)
            for (const neighbour of neighbours) {
                const pathToNeighbour = [...path, neighbour]
                if (targetChecker.checkTarget(neighbour, heightmap)) {
                    return pathToNeighbour;
                } else {
                    const foundPathToNeighbour = foundPaths.getValue(neighbour)
                    if (foundPathToNeighbour === undefined || foundPathToNeighbour.length > pathToNeighbour.length) {
                        debugHeightmap[neighbour.y][neighbour.x] = debugHeightmap[neighbour.y][neighbour.x].toUpperCase()
                        foundPaths.setValue(neighbour, pathToNeighbour)
                        nextPaths.setValue(neighbour, pathToNeighbour)
                    }
                }
            }
        }
        if (nextPaths.size() === 0) {
            console.log(joinHeightmapChars(debugHeightmap))
            throw Error(`No more paths to check after '${JSON.stringify(paths.keys())}`)
        }
        paths = nextPaths
    }
}

describe("Day 12", () => {

    const example = `
    Sabqponm
    abcryxxl
    accszExk
    acctuvwj
    abdefghi`

    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 5 lines", () => {
            expect(lines.length).toBe(5)
        })
        const { heightmap: heightmap, start, target } = parseHeightmap(lines)
        it("should have parsed height map", () => {
            expect(start).toEqual(new Coordinates2(0, 0))
            expect(target).toEqual(new Coordinates2(5, 2))
            expect(heightmap.length).toBe(5)
            expect(heightmap[0].length).toBe(8)
            expect(heightmap[0][0]).toBe(1)
            expect(heightmap[1][0]).toBe(1)
            expect(heightmap[1][4]).toBe(25)
            expect(heightmap[2][5]).toBe(26)
            expect(heightmap[2][4]).toBe(26)
            expect(heightmap[1][1]).toBe(2)
        })
        it("should print heightmap", () => {
            const testHeightmapString = `SEcde
fghij
vwxyz`
            const { heightmap: heightmap } = parseHeightmap(parseLines(testHeightmapString))
            expect(heightmapToString(heightmap)).toBe(`azcde
fghij
vwxyz`)
        })
        it("should return neighbours", () => {
            expect(getNeighbours(new Coordinates2(0, 0), heightmap)).toStrictEqual([
                new Coordinates2(0, 1),
                new Coordinates2(1, 0),
            ])
            expect(getNeighbours(new Coordinates2(4, 2), heightmap)).toStrictEqual([
                new Coordinates2(4, 1),
                new Coordinates2(4, 3),
                new Coordinates2(3, 2),
                new Coordinates2(5, 2)
            ])
            expect(getNeighbours(new Coordinates2(7, 4), heightmap)).toStrictEqual([
                new Coordinates2(7, 3),
                new Coordinates2(6, 4)
            ])
        })
        it("should filter out steap neighbours", () => {
            expect(getFilteredNeighbours(new Coordinates2(0, 0), heightmap)).toStrictEqual([
                new Coordinates2(0, 1),
                new Coordinates2(1, 0),
            ])
            expect(getFilteredNeighbours(new Coordinates2(4, 2), heightmap)).toStrictEqual([
                new Coordinates2(4, 1), // allow also to go down
                new Coordinates2(4, 3),
                new Coordinates2(3, 2),
                new Coordinates2(5, 2)
            ])
            expect(getFilteredNeighbours(new Coordinates2(1, 1), heightmap)).toStrictEqual([
                new Coordinates2(1, 0),
                new Coordinates2(1, 2),
                new Coordinates2(0, 1),
                new Coordinates2(2, 1)
            ])
        })
        describe("should find path in simple and complicated maps", () => {
            it("shoult find a simple path", () => {
                const example = "SbcdefghijklmnopqrstuvwxyE"
                const lines = parseLines(example)
                const mapWithStartAndTarget = parseHeightmap(lines)
                const path = findPath(mapWithStartAndTarget.heightmap, mapWithStartAndTarget.start, new TargetChecker1(mapWithStartAndTarget.target))
                expect(path.length).toBe(25)
                expect(path[0]).toStrictEqual(new Coordinates2(1, 0))
                expect(path[24]).toStrictEqual(new Coordinates2(25, 0))
            })
            it("shoult find a zick zack path", () => {
                const example = `
                Szefgzklmzqrszwxy
                bcdzhijznopztuvzE
                `
                const lines = parseLines(example)
                const mapWithStartAndTarget = parseHeightmap(lines)
                const path = findPath(mapWithStartAndTarget.heightmap, mapWithStartAndTarget.start, new TargetChecker1(mapWithStartAndTarget.target))
                expect(path.length).toBe(25)
                expect(path[0]).toStrictEqual(new Coordinates2(0, 1))
                expect(path[23]).toStrictEqual(new Coordinates2(16, 0))
                expect(path[24]).toStrictEqual(new Coordinates2(16, 1))
            })
        })
        describe("find path in example", () => {
            const path = findPath(heightmap, start, new TargetChecker1(target))
            expect(path.length).toBe(31)
            expect(path[0]).toStrictEqual(new Coordinates2(0, 1))
            expect(path[29]).toStrictEqual(new Coordinates2(target.x - 1, target.y))
            expect(path[30]).toStrictEqual(target)
        })
        describe("find reverse path in example for part 2", () => {
            const path = findPath(heightmap, target, new TargetChecker2(), neighboursFilter2)
            expect(path.length).toBe(29)
            expect(path[0]).toStrictEqual(new Coordinates2(target.x - 1, target.y))
            expect(path[28]).toStrictEqual(new Coordinates2(0, 4))
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay12.txt")
        const lines = parseLines(input)
        const { heightmap: heightmap, start, target } = parseHeightmap(lines)
        it("should have parsed heightmap", () => {
            expect(heightmap.length).toBe(41)
            expect(heightmap[0].length).toBe(179)
            expect(heightmap[0][0]).toBe(1)
            expect(heightmap[0][1]).toBe(2)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const path = findPath(heightmap, start, new TargetChecker1(target))
                expect(path.length).toBe(484)
                expect(path[483]).toStrictEqual(target)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const path = findPath(heightmap, target, new TargetChecker2(), neighboursFilter2)
                expect(path.length).toBe(478)
            })
        })
    })
})
