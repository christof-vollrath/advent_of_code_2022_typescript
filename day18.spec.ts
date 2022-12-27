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

function findCorners(coordinates3: Set<Coordinates3>) {
    let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, minZ = Number.MAX_VALUE;
    let maxX = 0, maxY = 0, maxZ = 0;
    for (const coord of coordinates3.toArray()) {
        if (coord.x < minX) minX = coord.x
        if (coord.y < minY) minY = coord.y
        if (coord.z < minZ) minZ = coord.z
        if (coord.x > maxX) maxX = coord.x
        if (coord.y > maxY) maxY = coord.y
        if (coord.z > maxZ) maxZ = coord.z
    }
    return { upperCorner: new Coordinates3(minX, minY, minZ), lowerCorner: new Coordinates3(maxX, maxY, maxZ) }
}

function surroundingCube(coordinates3: Set<Coordinates3>) {
    const { upperCorner, lowerCorner } = findCorners(coordinates3)
    return  {
        upperCorner: new Coordinates3(upperCorner.x - 1, upperCorner.y - 1, upperCorner.z - 1),
        lowerCorner: new Coordinates3(lowerCorner.x + 1, lowerCorner.y + 1, lowerCorner.z + 1)
    }

}

function findOutSideCubes(upperCorner: Coordinates3, lowerCorner: Coordinates3, vulcanCubes: Set<Coordinates3>) {
    let resultSet = new Set<Coordinates3>()
    resultSet.add(upperCorner)
    let currentSet = new Set<Coordinates3>()
    currentSet.add(upperCorner) // starting from upper corner
    while (currentSet.size() > 0) {
        let nextSet = new Set<Coordinates3>()
        for (const current of currentSet.toArray()) {
            const closeBy = current.closeBy()
            for (const next of closeBy) {
                if (next.x >= upperCorner.x && next.y >= upperCorner.y && next.z >= upperCorner.z
                    && next.x <= lowerCorner.x && next.y <= lowerCorner.y && next.z <= lowerCorner.z) {
                    if (!resultSet.contains(next) && !vulcanCubes.contains(next)) {
                        nextSet.add(next)
                        resultSet.add(next)
                    }
                }
            }
        }
        currentSet = nextSet
    }
    return resultSet
}

function countExternalSides(coordSet: Set<Coordinates3>) {
    const { upperCorner , lowerCorner }  = surroundingCube(coordSet)
    const outsideCubes = findOutSideCubes(upperCorner, lowerCorner, coordSet)

    let result = 0
    for (const coord of coordSet.toArray()) {
        const closeBy = coord.closeBy()
        result += closeBy.filter(closeBy => outsideCubes.contains(closeBy)).length
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
        const cubeCoords = parseCoordinates3(lines)
        it("should have parsed coords", () => {
            expect(cubeCoords.length).toBe(13)
            expect(cubeCoords[12]).toStrictEqual(new Coordinates3(2, 3, 5))
        })
        it ("should create a set of cubes", () => {
            const set = createCubeSet(cubeCoords)
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
        describe("solve example part 1", () => {
            it("should sum number of not connected sides for all cubes in example", () => {
                const cubeSet = createCubeSet(cubeCoords)
                expect(countNotConnectedSides(cubeSet)).toBe(64)
            })
        })
        describe("find corners and surrounding cube", () => {
            it("should find corners of example cube", () => {
                const { upperCorner, lowerCorner } = findCorners(createCubeSet(cubeCoords))
                expect(upperCorner).toStrictEqual(new Coordinates3(1, 1, 1))
                expect(lowerCorner).toStrictEqual(new Coordinates3(3, 3, 6))
            })
            it("should create surrounding cube", () => {
                const { upperCorner, lowerCorner } = surroundingCube(createCubeSet(cubeCoords))
                expect(upperCorner).toStrictEqual(new Coordinates3(0, 0, 0))
                expect(lowerCorner).toStrictEqual(new Coordinates3(4, 4, 7))
            })
        })
        describe("outside cubes, e.g. cubes which are connected to the outside", () => {
            it ("should find all 8 outside cubes when no lava cube is given", () => {
                const upperCorner = new Coordinates3(0, 0, 0), lowerCorner = new Coordinates3(1, 1, 1)
                const outsideCubes = findOutSideCubes(upperCorner, lowerCorner, createCubeSet([]))
                expect(outsideCubes.size()).toBe(8)
            })
            it ("should find all 26 outside cubes when one lava cube is given", () => {
                const cubeSet = createCubeSet([new Coordinates3(1, 1, 1)])
                const { upperCorner , lowerCorner }  = surroundingCube(cubeSet)
                const outsideCubes = findOutSideCubes(upperCorner, lowerCorner, cubeSet)
                expect(outsideCubes.size()).toBe(26)
            })
            it ("when applied for the example, the trapped cube should not be part but all others should", () => {
                const cubeSet = createCubeSet(cubeCoords)
                const { upperCorner , lowerCorner }  = surroundingCube(cubeSet)
                const outsideCubes = findOutSideCubes(upperCorner, lowerCorner, cubeSet)
                for(const outsideCube of outsideCubes.toArray()) expect(cubeSet.contains(outsideCube)).toBeFalsy()
                for(const cube of cubeCoords) expect(outsideCubes.contains(cube)).toBeFalsy()
                expect(outsideCubes.contains(new Coordinates3(2, 2, 5))).toBeFalsy() // trapped cube
                const nrOfAllCubes = (lowerCorner.x - upperCorner.x + 1) * (lowerCorner.y - upperCorner.y + 1) * (lowerCorner.z - upperCorner.z + 1)
                const nrRemainingCubes = nrOfAllCubes - outsideCubes.size() - cubeSet.size()
                expect(nrRemainingCubes).toBe(1) // the only trapped cube
            })
        })
        describe("external surface area", () => {
            it("should calculate external surface for example", () => {
                const externalSurfaceArea = countExternalSides(createCubeSet(cubeCoords))
                expect(externalSurfaceArea).toBe(58)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay18.txt")
        const lines = parseLines(input)
        const cubeCoords = parseCoordinates3(lines)
        it("should have parsed lines and coords", () => {
            expect(lines.length).toBe(2781)
            expect(cubeCoords.length).toBe(2781)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const cubeSet = createCubeSet(cubeCoords)
                expect(countNotConnectedSides(cubeSet)).toBe(4500)
            })
        })
        describe("Part 2", () => {
            describe("how big is the outside of the cubes", () => {
                it("should create surrounding cube", () => {
                    const { upperCorner, lowerCorner } = surroundingCube(createCubeSet(cubeCoords))
                    expect(upperCorner).toStrictEqual(new Coordinates3(0, -1, -1))
                    expect(lowerCorner).toStrictEqual(new Coordinates3(22, 22, 22))
                })

            })
            it("should find solution", () => {
                const externalSurfaceArea = countExternalSides(createCubeSet(cubeCoords))
                expect(externalSurfaceArea).toBe(2558)
            })
        })
    })
})
