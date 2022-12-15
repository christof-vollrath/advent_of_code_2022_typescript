// Advent of code 2022 - day 14

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseScanLine(line: string) {
    const coordStrings = line.split(" -> ")
    return coordStrings.map(coordStr => {
        const parts = coordStr.split(",").map(s => s.trim())
        return new Coordinates2(Number.parseInt(parts[0]), Number.parseInt(parts[1]))
    })
}

function parseScanLines(lines: string[]) {
    return lines.map(l => parseScanLine(l))
}

function parseCaveMap(caveMap: string) {
    const lines = parseLines(caveMap)
    return lines.map(line => line.split(""))
}

function drawCaveMap(caveMap: CaveMap) {
    return drawCaveMapRaw(caveMap.map)
}

function drawCaveMapRaw(caveMap: string[][]) {
    return caveMap.map(row => row.join("")).join("\n")
}


type CaveMap = {
    minX: number,
    maxX: number,
    maxY: number
    map: string[][]
}
function drawScanLines(scanLines: Coordinates2[][]): CaveMap {
    function initCaveMap(scanLines: Coordinates2[][]): CaveMap {
        const minX = Math.min(...scanLines.map(scanLine => {
            const xCoords = scanLine.map(coord => coord.x)
            return Math.min(...xCoords)
        }))
        const maxX = Math.max(...scanLines.map(scanLine => {
            const xCoords = scanLine.map(coord => coord.x)
            return Math.max(...xCoords)
        }))
        const maxY = Math.max(...scanLines.map(scanLine => {
            const yCoords = scanLine.map(coord => coord.y)
            return Math.max(...yCoords)
        }))
        const result: string[][] = []
        for (let y = 0; y <= maxY; y++) {
            const row: string[] = []
            for (let x = minX; x <= maxX; x++)
                row.push(".")
            result.push(row)
        }
        return { minX: minX, maxX: maxX, maxY: maxY, map: result }
    }

    function drawScanLine(scanLine: Coordinates2[], caveMap: CaveMap) {
        let first = true
        let recentCoord: Coordinates2 | null = null
        for (const coord of scanLine) {
            if (first) {
                recentCoord = coord
                first = false
            } else {
                if (recentCoord!.x === coord.x) {
                    for (let y = Math.min(recentCoord!.y, coord.y); y <= Math.max(recentCoord!.y, coord.y); y++) {
                        caveMap.map[y][coord.x - caveMap.minX] = "#"
                    }
                } else if (recentCoord!.y === coord.y) {
                    for (let x = Math.min(recentCoord!.x, coord.x); x <= Math.max(recentCoord!.x, coord.x); x++) {
                        caveMap.map[coord.y][x  -caveMap.minX] = "#"
                    }
                } else throw new Error("wrong path")
                recentCoord = coord
            }
        }
    }

    const caveMap = initCaveMap(scanLines)
    for (const scanLine of scanLines)
        drawScanLine(scanLine, caveMap)
    return caveMap
}

function dropOneSandUnit(caveMap: CaveMap) {
    function getNextValue(nextPos: Coordinates2, caveMap: CaveMap) {
        const map = caveMap.map
        const row = map[nextPos.y]
        if (row === undefined) return undefined // end reached
        return row[nextPos.x - minX]
    }

    const map = caveMap.map
    const minX = caveMap.minX
    let pos = new Coordinates2(500, 0)
    while(true) {
        let moveToNextPos = false
        // check drop down
        let nextPos  = new Coordinates2(pos.x, pos.y + 1)
        if (getNextValue(nextPos, caveMap) === undefined) return true
        moveToNextPos = getNextValue(nextPos, caveMap) === "."
        if (!moveToNextPos) {
            // check drop down and left
            nextPos = new Coordinates2(pos.x - 1, pos.y + 1)
            if (getNextValue(nextPos, caveMap) === undefined) return true
            moveToNextPos = getNextValue(nextPos, caveMap) === "."
        }
        if (!moveToNextPos) {
            // check drop down and right
            nextPos = new Coordinates2(pos.x + 1, pos.y + 1)
            if (getNextValue(nextPos, caveMap) === undefined) return true
            moveToNextPos = getNextValue(nextPos, caveMap) === "."
        }
        if (moveToNextPos) {
            map[pos.y][pos.x - minX] = "."
            map[nextPos.y][nextPos.x - minX] = "o"
            pos = nextPos
        } else return false
    }
}

function dropSandUnitsUntilFull(caveMap: CaveMap) {
    let i = 0
    while(! dropOneSandUnit(caveMap)) i++
    return i
}

describe("Day 14", () => {

    const example = `
        498,4 -> 498,6 -> 496,6
        503,4 -> 502,4 -> 502,9 -> 494,9
        `
    const exampleCaveMap =
`..........
..........
..........
..........
....#...##
....#...#.
..###...#.
........#.
........#.
#########.`

    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 2 lines", () => {
            expect(lines.length).toBe(2)
        })
        const scanLines = parseScanLines(lines)
        it("should have parsed scan lines", () => {
            expect(scanLines).toStrictEqual([
                [new Coordinates2(498, 4), new Coordinates2(498, 6), new Coordinates2(496, 6)],
                [new Coordinates2(503, 4), new Coordinates2(502, 4), new Coordinates2(502, 9), new Coordinates2(494, 9)],
            ])
        })
        it("should parse and print cave map", () => {
            const caveMap = parseCaveMap(exampleCaveMap)
            const caveMapString = drawCaveMapRaw(caveMap)
            expect(caveMapString).toEqual(exampleCaveMap)
        })
        it("should draw scan lines", () => {
            const caveMap = drawScanLines(scanLines)
            expect(caveMap.minX).toBe(494)
            expect(caveMap.maxX).toBe(503)
            expect(caveMap.maxY).toBe(9)
            expect(caveMap.map.length).toBe(10)
            for (const row of caveMap.map)
                expect(row.length).toBe(10)
            const caveMapString = drawCaveMap(caveMap)
            expect(caveMapString).toBe(exampleCaveMap)
        })
        describe("should drop sand units", () => {
            const caveMap = drawScanLines(scanLines)
            it("should drop one sand unit", () => {
                dropOneSandUnit(caveMap)
                const caveMapOneSandUnit =
`..........
..........
..........
..........
....#...##
....#...#.
..###...#.
........#.
......o.#.
#########.`
                expect(drawCaveMap(caveMap)).toBe(caveMapOneSandUnit)
            })
            it("should drop second sand unit", () => {
                dropOneSandUnit(caveMap)
                const caveMapTwoSandUnit =
`..........
..........
..........
..........
....#...##
....#...#.
..###...#.
........#.
.....oo.#.
#########.`
                expect(drawCaveMap(caveMap)).toBe(caveMapTwoSandUnit)
            })
            it("should drop third sand unit", () => {
                dropOneSandUnit(caveMap)
                const caveMapThreeSandUnit =
`..........
..........
..........
..........
....#...##
....#...#.
..###...#.
........#.
.....ooo#.
#########.`
                expect(drawCaveMap(caveMap)).toBe(caveMapThreeSandUnit)
            })
        })
        describe("drop sand units until full", () => {
            const caveMap = drawScanLines(scanLines)
            it("should drop sand units", () => {
                const result = dropSandUnitsUntilFull(caveMap)
                const drawnResult = drawCaveMap(caveMap)
                const caveMapFull =
`..........
..........
......o...
.....ooo..
....#ooo##
...o#ooo#.
..###ooo#.
....oooo#.
oo.ooooo#.
#########.`
                expect(drawnResult).toBe(caveMapFull)
                expect(result).toBe(24)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay14.txt")
        const lines = parseLines(input)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(167)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const scanLines = parseScanLines(lines)
                const caveMap = drawScanLines(scanLines)
                const result = dropSandUnitsUntilFull(caveMap)
                expect(result).toBe(1133)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
