// Advent of code 2022 - day 15

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";
import {Set} from "typescript-collections";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseSensorAndBeacon(line: string): Coordinates2[] {
    const sensorAndBeaconRegex = /\s*Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)/
    const regexResult = sensorAndBeaconRegex.exec(line)
    if (! regexResult || regexResult.length < 4) throw Error(`can't parse ${line}`)
    const sensorCoord = new Coordinates2(Number.parseInt(regexResult[1]), Number.parseInt(regexResult[2]))
    const beaconCoord = new Coordinates2(Number.parseInt(regexResult[3]), Number.parseInt(regexResult[4]))
    return [sensorCoord, beaconCoord]
}

function parseSensorAndBeacons(lines: string[]): Coordinates2[][] {
    return lines.map(l => parseSensorAndBeacon(l))
}

function manhattanYRange(sensorAndBeacon: Coordinates2[], y: number): number[] {
    const dist = sensorAndBeacon[0].manhattanDistance(sensorAndBeacon[1])
    const distY = dist - Math.abs(sensorAndBeacon[0].y - y)
    if (distY < 0) return []
    else return [sensorAndBeacon[0].x - distY, sensorAndBeacon[0].x + distY]
}

function join2Ranges(range1: number[], range2: number[]) {
    if (range1.length === 0 && (range2 === undefined || range2.length === 0)) return []
    if (range1.length === 0) return [range2]
    if (range2 === undefined || range2.length === 0) return [range1]
    if (range1[0] <= range2[0] && range1[1] + 1 >= range2[0]) return [[range1[0], Math.max(range1[1], range2[1])]] // join
    if (range2[0] <= range1[0] && range2[1] + 1 >= range1[0]) return [[range2[0], Math.max(range1[1], range2[1])]] // join
    return [range1, range2] // can't join
}

function joinRanges(ranges: number[][]) {
    const sortedRanges = ranges.filter(r => r.length > 0).sort((r1, r2) => r1[0] - r2[0])
    return joinSortedRanges(sortedRanges);
}

function joinSortedRanges(ranges: number[][]): number[][] {
    const result: number[][] = []
    let recent: number[] | undefined
    for (const range of ranges) {
        if (!recent) {
            recent = range
        } else {
            const joined = join2Ranges(recent, range)
            if (joined.length > 1) {
                result.push(joined[0])
                recent = joined[1]
            } else recent = joined[0]
        }
    }
    if (recent) result.push(recent)
    return result
}

function sumRangesByLength(ranges: number[][]) {
    function rangeLength(range: number[]) {
        return range[1] - range[0] + 1;
    }
    let sum = 0

    for (const range of ranges) {
        sum += rangeLength(range)
    }
    return sum
}

function findBeaconsY(y: number, sensorAndBeacons: Coordinates2[][]) {
    const beacons = sensorAndBeacons.map(sb => sb[1])
    const filteredBeacons =  beacons.filter(b => b.y === y)
    const uniqueBeacons = new Set()
    for (const beacon of filteredBeacons) uniqueBeacons.add(beacon)
    return uniqueBeacons.toArray()
}

function coveredPositions(sensorAndBeacons: Coordinates2[][], row: number) {
    const rawRanges = sensorAndBeacons.map(sb => manhattanYRange(sb, row))
    const ranges = joinRanges(rawRanges)
    const covered = sumRangesByLength(ranges)
    return covered - findBeaconsY(row, sensorAndBeacons).length
}

function findFreePosition(sensorAndBeacons: Coordinates2[][], max: number) {
    for (let row = 0; row <= max; row++) {
        const rawRanges = sensorAndBeacons.map(sb => manhattanYRange(sb, row))
        if (rawRanges.length === 0) continue
        const ranges = joinRanges(rawRanges)
        const nonFullyCoveringRanges = ranges.filter(r => r[0] > 0 || r[1] < max)
        if (nonFullyCoveringRanges.length == 0) continue
        const fittingRanges = nonFullyCoveringRanges.filter(r => r[0] <= max && r[1] >= 0)
        if (fittingRanges.length > 2) {
            throw new Error(`no unique free position found ${JSON.stringify(fittingRanges)}`)
        }
        if (fittingRanges.length > 0) {
            const fittingRange = fittingRanges[0]
            if (fittingRange[0] > 0) throw new Error(`no gap between ranges ${JSON.stringify(fittingRanges)}`)
            return new Coordinates2(fittingRange[1] + 1, row)
        }
    }
    throw new Error(`no unique free position found in rows up to ${max}`)
}

function calculateTuningFrequency(position: Coordinates2) {
    return position.x * 4000000 + position.y
}

describe("Day 15", () => {

    const example = `
        Sensor at x=2, y=18: closest beacon is at x=-2, y=15
        Sensor at x=9, y=16: closest beacon is at x=10, y=16
        Sensor at x=13, y=2: closest beacon is at x=15, y=3
        Sensor at x=12, y=14: closest beacon is at x=10, y=16
        Sensor at x=10, y=20: closest beacon is at x=10, y=16
        Sensor at x=14, y=17: closest beacon is at x=10, y=16
        Sensor at x=8, y=7: closest beacon is at x=2, y=10
        Sensor at x=2, y=0: closest beacon is at x=2, y=10
        Sensor at x=0, y=11: closest beacon is at x=2, y=10
        Sensor at x=20, y=14: closest beacon is at x=25, y=17
        Sensor at x=17, y=20: closest beacon is at x=21, y=22
        Sensor at x=16, y=7: closest beacon is at x=15, y=3
        Sensor at x=14, y=3: closest beacon is at x=15, y=3
        Sensor at x=20, y=1: closest beacon is at x=15, y=3
        `
    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 14 lines", () => {
            expect(lines.length).toBe(14)
        })
        it("should parse one line with sensor and beacon", () => {
            const sensorAndBeacon = parseSensorAndBeacon("Sensor at x=2, y=18: closest beacon is at x=-2, y=15")
            expect(sensorAndBeacon).toStrictEqual([ new Coordinates2(2, 18), new Coordinates2(-2, 15)])
        })
        const sensorAndBeacons = parseSensorAndBeacons(lines)
        it("should parse senor and beacon lines", () => {
            expect(sensorAndBeacons.length).toBe(14)
            expect(sensorAndBeacons[13]).toStrictEqual([
                new Coordinates2(20, 1),
                new Coordinates2(15, 3),
            ])
        })
        it("should calculate manhattan distance", () => {
            expect(new Coordinates2(0,0).manhattanDistance(new Coordinates2(0,0))).toBe(0)
            expect(new Coordinates2(0,0).manhattanDistance(new Coordinates2(0,2))).toBe(2)
            expect(new Coordinates2(1,0).manhattanDistance(new Coordinates2(-1, 10))).toBe(12)
        })
        it("should check which range sensor covers coord", () => {
            const sensorAndBeacon = [
                new Coordinates2(8, 7),
                new Coordinates2(2, 10),
            ]
            const covered = manhattanYRange(sensorAndBeacon, 10)
            expect(covered).toStrictEqual([2, 14])
            expect(manhattanYRange(sensorAndBeacon, 16)).toStrictEqual([8, 8])
            expect(manhattanYRange(sensorAndBeacon, 17)).toStrictEqual([])
        })
        it("should join two ranges", () => {
            expect(join2Ranges([1, 2], [4, 5])).toStrictEqual([[1, 2], [4, 5]])
            expect(join2Ranges([1, 4], [4, 5])).toStrictEqual([[1, 5]])
            expect(join2Ranges([1, 3], [4, 5])).toStrictEqual([[1, 5]])
            expect(join2Ranges([4, 5], [1, 2])).toStrictEqual([[4, 5], [1, 2]])
            expect(join2Ranges([4, 5], [1, 4])).toStrictEqual([[1, 5]])
            expect(join2Ranges([4, 5], [1, 3])).toStrictEqual([[1, 5]])
            expect(join2Ranges([4, 5], [-1, 3])).toStrictEqual([[-1, 5]])
            expect(join2Ranges([-2, 12], [2, 2])).toStrictEqual([[-2, 12]])
        })
        it("should join ranges", () => {
            expect(joinRanges([])).toStrictEqual([])
            expect(joinRanges([[1, 2]])).toStrictEqual([[1, 2]])
            expect(joinRanges([[1, 2], [4, 5], [7, 10]])).toStrictEqual([[1, 2], [4, 5], [7, 10]])
            expect(joinRanges([[1, 4], [4, 5], [6, 10]])).toStrictEqual([[1, 10]])
            expect(joinRanges([[1, 4], [4, 5], [7, 10], [11, 12]])).toStrictEqual([[1, 5], [7, 12]])
            expect(joinRanges([[1, 4], [7, 8], [5, 6]])).toStrictEqual([[1, 8]])
        })
        it("should some ranges by length", () => {
            expect(sumRangesByLength([[1, 2], [4, 4], [11, 20]])).toBe(13)
        })
        it("should count covered positions", () => {
            const coveredWithoutBeacons = coveredPositions(sensorAndBeacons, 10);
            expect(coveredWithoutBeacons).toBe(26)
        })
        it("should find the only free position", () => {
            const freePosition = findFreePosition(sensorAndBeacons, 20)
            expect(freePosition).toStrictEqual(new Coordinates2(14, 11))
            const tuningFrequency = calculateTuningFrequency(freePosition)
            expect(tuningFrequency).toBe(56000011)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay15.txt")
        const lines = parseLines(input)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(32)
        })
        const sensorAndBeacons = parseSensorAndBeacons(lines)
        describe("Part 1", () => {
            it("should find solution", () => {
                const coveredWithoutBeacons = coveredPositions(sensorAndBeacons, 2000000);
                expect(coveredWithoutBeacons).toBeLessThan(5658320)
                expect(coveredWithoutBeacons).toBe(5127797)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const freePosition = findFreePosition(sensorAndBeacons, 4000000)
                const tuningFrequency = calculateTuningFrequency(freePosition)
                expect(tuningFrequency).toBe(12518502636475)
            })
        })
    })
})
