// Advent of code 2022 - day 18

import {readFileSync} from "fs"
import {Set} from "typescript-collections";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}
export class Coordinates3 {
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    add(coord: Coordinates3): Coordinates3 {
        return new Coordinates3(this.x + coord.x, this.y + coord.y, this.z + coord.z)
    }

    isCloseBy(coord: Coordinates3): boolean {
        return Math.abs(this.x - coord.x) <=1 && Math.abs(this.y - coord.y) <= 1 && Math.abs(this.z - coord.z) <= 1
    }

    closeBy(): Coordinates3[] {
        return [
            new Coordinates3(this.x, this.y, this.z + 1), new Coordinates3(this.x, this.y, this.z - 1),
            new Coordinates3(this.x, this.y + 1, this.z), new Coordinates3(this.x, this.y - 1, this.z),
            new Coordinates3(this.x + 1, this.y, this.z), new Coordinates3(this.x - 1, this.y, this.z),
        ]
    }

    toString() { // overwrite toString to have a proper hash function for Set<Coordinates2>
        return `${this.x}-${this.y}-${this.z}`
    }

    manhattanDistance(coord: Coordinates3) {
        return Math.abs(this.x - coord.x) + Math.abs(this.y - coord.y) + Math.abs(this.z - coord.z);
    }
}

function parseCoordinates3(lines: string[]) {
    const result: Coordinates3[] = []
    for (const line of lines) {
        const parts = line.split(",").map(p => p.trim())
        result.push(new Coordinates3(Number.parseInt(parts[0]), Number.parseInt(parts[1]), Number.parseInt(parts[2])))
    }
    return result
}

function createCubeSet(coords: Coordinates3[]) {
    const result = new Set<Coordinates3>()
    for (const coord of coords) result.add(coord)
    return result
}

function countNotConnectedSides(coordSet: Set<Coordinates3>) {
    let result = 0
    for (const coord of coordSet.toArray()) {
        const closeBy = coord.closeBy()
        result += closeBy.filter(closeBy => !coordSet.contains(closeBy)).length
    }
    return result;
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
        it("should have parsed 13 lines", () => {
            expect(lines.length).toBe(13)
        })
        const coords = parseCoordinates3(lines)
        it("should have parsed coords", () => {
            expect(coords.length).toBe(13)
            expect(coords[12]).toStrictEqual(new Coordinates3(2, 3, 5))
        })
        it ("should create a set of cubes", () => {
            const set = createCubeSet(coords)
            expect(set.contains(new Coordinates3(2, 3, 5))).toBeTruthy()
            expect(set.contains(new Coordinates3(123, 456, 789))).toBeFalsy()
        })
        describe ("count not connected sides", () => {
            it("should have count 0 for no cubes", () => {
                expect(countNotConnectedSides(createCubeSet([]))).toBe(0)
            })
            it("should have count 6 for s single cube", () => {
                expect(countNotConnectedSides(createCubeSet([new Coordinates3(0, 0, 0)]))).toBe(6)
            })
            it("should have count 10 for two connected cubes", () => {
                expect(countNotConnectedSides(createCubeSet([
                    new Coordinates3(0, 0, 0),
                    new Coordinates3(0, 0, 1)
                ]))).toBe(10)
            })
        })
        describe("solve example", () => {
            it("should sum number of not connected sides for all cubes in example", () => {
                const cubeSet = createCubeSet(coords)
                expect(countNotConnectedSides(cubeSet)).toBe(64)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay18.txt")
        const lines = parseLines(input)
        const coords = parseCoordinates3(lines)
        it("should have parsed lines and coords", () => {
            expect(lines.length).toBe(2781)
            expect(coords.length).toBe(2781)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const cubeSet = createCubeSet(coords)
                expect(countNotConnectedSides(cubeSet)).toBe(4500)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
