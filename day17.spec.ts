// Advent of code 2022 - day 17

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";
import {Dictionary} from "typescript-collections";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

const shapesString = [
//1
`@@@@`,
// 2
`.@.
@@@
.@.`,
// 3
`..@
..@
@@@`,
// 4
`@
@
@
@`,
// 5
`@@
@@`
    ]

type Shape = string[][]
class ShapeAndPosition {
    shape: Shape
    coord: Coordinates2

    constructor(shape: Shape, coord: Coordinates2) {
        this.shape = shape;
        this.coord = coord;
    }

    getHeightFromBottom(chamber: Chamber) {
        return chamber.height - this.coord.y
    }
}
class Chamber {
    currentShape: ShapeAndPosition | null = null
    recentShape: ShapeAndPosition | null = null
    height: number = 0
    cave: string[][] = []
    readonly width = 7

    getFilledHeight(): number {
        for (let y = 0; y < this.cave.length; y++) {
            for (let x = 0; x < this.cave[y].length; x++)
                if (this.cave[y][x] === "#") return this.cave.length - y
        }
        return 0
    }

    addShape(shape: Shape) {
        const filledHeight = this.getFilledHeight()
        const availableSpace = this.height - filledHeight
        let increase = 3 + shape.length - availableSpace
        if (increase > 0) this.increaseHeight(increase)
        let y = 0
        if (increase < 0) y = -increase // more space
        const startCoord = new Coordinates2(2, y);
        this.currentShape = new ShapeAndPosition(shape, startCoord)
    }

    printPos(x: number, y: number, cave: string[][]) {
        let c = cave[y][x];
        // current shape
        if(this.currentShape) {
            const shape = this.currentShape.shape
            const xOffset = x - this.currentShape.coord.x
            const yOffset = y - this.currentShape.coord.y
            if (0 <= yOffset && yOffset < shape.length && 0 <= xOffset && xOffset < shape[yOffset].length)
                if (this.currentShape.shape[yOffset][xOffset] === "@")
                    c = "@"
        }
        return c
    }

    printRow(y: number, cave: string[][]) {
        const reversedY = cave.length - 1 - y
        let row = cave[reversedY]
        let result = ""
        for (let x = 0; x < row.length; x++) {
            result += this.printPos(x, y, cave)
        }
        return result
    }

    toString(printHeight = false) {
        return this.caveToString(this.cave, printHeight);
    }

    private caveToString(cave: string[][], printHeight: boolean = false) {
        const result: string[] = []
        for (let y = 0; y < cave.length; y++) {
            let line = "|" + this.printRow(y, cave) + "|"
            if (printHeight) line += ` ${cave.length - y}`
            result.push(line)

        }
        result.push("+-------+")
        return result.join("\n")
    }

    private increaseHeight(incr: number) {
        const fillerRow = []
        for (let i = 0; i < this.width; i++) fillerRow.push(".")
        const newCave = []
        for (let i = 0; i < incr; i++)
            newCave.push([...fillerRow])
        for (let y = 0; y < this.cave.length; y++)
            newCave.push(this.cave[y])
        this.cave = newCave
        this.height += incr

    }

    private placeCurrentShapeInCave() {
        if (! this.currentShape) throw new Error("No current shape to drop")
        for (let yOffset = 0; yOffset < this.currentShape.shape.length; yOffset++)
            for (let xOffset = 0; xOffset < this.currentShape.shape[yOffset].length; xOffset++)
                if (this.currentShape.shape[yOffset][xOffset] === "@") {
                    const x = xOffset + this.currentShape.coord.x
                    const y = yOffset + this.currentShape.coord.y
                    this.cave[y][x] = "#"
                }
        this.recentShape = this.currentShape
        this.currentShape = null
    }

    dropCurrentShape1Unit() {
        if (! this.currentShape) throw new Error("No current shape to drop")
        const newCoord = new Coordinates2(this.currentShape.coord.x, this.currentShape.coord.y + 1)
        const nextShape = new ShapeAndPosition(this.currentShape.shape, newCoord)
        const stoppedMoving = this.shapeReachedBottom(nextShape) || this.shapeReachedOtherShape(nextShape);
        if (stoppedMoving) {
            this.placeCurrentShapeInCave()
            return false
        } else {
            this.currentShape = nextShape
            return true
        }
    }

    private shapeReachedBottom(shape: ShapeAndPosition) {
        return shape.coord.y + shape.shape.length > this.cave.length // bottom reached
    }

    private shapeReachedOtherShape(shape: ShapeAndPosition) {
        for (let yOffset = 0; yOffset < shape.shape.length; yOffset++)
            for (let xOffset = 0; xOffset < shape.shape[yOffset].length; xOffset++)
                if (shape.shape[yOffset][xOffset] === "@") {
                    const x = xOffset + shape.coord.x
                    const y = yOffset + shape.coord.y
                    if (this.cave[y][x] === "#") return true
                }
        return false;
    }

    moveCurrentShape(nr: number) {
        if (! this.currentShape) throw new Error("No current shape to drop")
        if (0 <= this.currentShape.coord.x + nr && this.currentShape.coord.x + this.currentShape.shape[0].length + nr <= this.width) {
            const newCoord = new Coordinates2(this.currentShape.coord.x + nr, this.currentShape.coord.y)
            const nextShape = new ShapeAndPosition(this.currentShape.shape, newCoord)
            if (! this.shapeReachedOtherShape(nextShape)) // other shapes can also block movement
                this.currentShape.coord = new Coordinates2(this.currentShape.coord.x + nr, this.currentShape.coord.y)
        }
    }

    moveCurrentShapeRight() {
        this.moveCurrentShape(1)
    }

    moveCurrentShapeLeft() {
        this.moveCurrentShape(-1)
    }
}

interface CaveMonitor {
    monitor(rockNumber: number, shapeIndex: any, wind: string, windIndex: any, blocked: boolean, shape: ShapeAndPosition): boolean
}

class CaveSimulator {
    shapes: string[][][]
    chamber: Chamber
    windPattern: string
    shapeIndex = 0
    windIndex = 0
    caveMonitor: CaveMonitor | null

    constructor(shapes: string[][][], chamber: Chamber, windPattern: string, caveMonitor: CaveMonitor | null = null) {
        this.shapes = shapes;
        this.chamber = chamber;
        this.windPattern = windPattern;
        this.caveMonitor = caveMonitor
    }

    runCaveSimulation(number: number) {
        this.shapeIndex = 0
        this.windIndex = 0
        let rockNumber = 0
        do { // handle shapes
            const shape = this.shapes[this.shapeIndex]
            this.chamber.addShape(shape)
            let blocked = false
            while (! blocked) { // drop shape
                const wind = this.windPattern[this.windIndex]
                if (wind === "<") this.chamber.moveCurrentShapeLeft()
                else if (wind === ">") this.chamber.moveCurrentShapeRight()
                else throw new Error(`Illegal wind ${wind} at index ${this.windIndex}`)
                blocked = !this.chamber.dropCurrentShape1Unit()
                if (this.caveMonitor) {
                    let shape
                    if (blocked) shape = this.chamber.recentShape
                    else shape = this.chamber.currentShape
                    if (this.caveMonitor.monitor(rockNumber, this.shapeIndex, wind, this.windIndex, blocked, shape!)) return // break simulation
                }
                this.windIndex++
                if (this.windIndex >= this.windPattern.length) this.windIndex = 0
            }
            this.shapeIndex++
            if (this.shapeIndex >= this.shapes.length) this.shapeIndex = 0
            rockNumber++
        } while (rockNumber < number)
    }
}

function findLoop(shapes: string[][][], input: string) {
    let chamber = new Chamber()
    class WindIndexAndX {
        windIndex: number
        x: number
        constructor(windIndex: number, x: number) {
            this.windIndex = windIndex;
            this.x = x;
        }
        toString() { return `${this.windIndex}-${this.x}`}
    }
    class RockNumberAndHeight {
        constructor(rockNumber: number, height: number) {
            this.rockNumber = rockNumber;
            this.height = height;
        }
        rockNumber: number
        height: number
    }
    const occurrenceDictionary = new Dictionary<WindIndexAndX, RockNumberAndHeight>()
    let first: RockNumberAndHeight | undefined
    let repeated: RockNumberAndHeight | undefined
    class FindRepeatMonitor implements CaveMonitor {
        constructor(occurrenceDictionary: Dictionary<WindIndexAndX, RockNumberAndHeight>) {
            this.occurrenceDictionary = occurrenceDictionary;
        }
        occurrenceDictionary: Dictionary<WindIndexAndX, RockNumberAndHeight>
        monitor(rockNumber: number, shapeIndex: any, wind: string, windIndex: any, blocked: boolean, shape: ShapeAndPosition): boolean {
            //if (shapeIndex === 0 && blocked) console.log(`rockNumber=${rockNumber} height=${chamber.getFilledHeight()} shapeIndex=${shapeIndex} windIndex=${windIndex} blocked=${blocked} shape=${JSON.stringify(shape)}`)
            if (blocked && shapeIndex === 0 && chamber.getFilledHeight() === shape.getHeightFromBottom(chamber)) {
                // Find loops which start when shape 0 reached the end and no other shape is higher (which would complicate calculation)
                const found = occurrenceDictionary.getValue(new WindIndexAndX(windIndex, shape.coord.x))
                first = found
                repeated = new RockNumberAndHeight(rockNumber, chamber.getFilledHeight())
                if (found) {
                    //console.log(`Found again first:${found} now: ${rockNumber} shapeIndex=${shapeIndex} windIndex=${windIndex} wind=${wind} x=${shape.coord.x} `)
                    return true
                }
                else {
                    occurrenceDictionary.setValue(new WindIndexAndX(windIndex, shape.coord.x), new RockNumberAndHeight(rockNumber, chamber.getFilledHeight()))
                }
            }
            return false
        }
    }
    const findRepeatMonitor = new FindRepeatMonitor(occurrenceDictionary)
    let caveSimulator = new CaveSimulator(shapes, chamber, input, findRepeatMonitor)
    caveSimulator.runCaveSimulation(100_000)
    if (! first) throw new Error("No loop found")
    //console.log(`firstOccurrence=${first?.rockNumber} firstHeight=${first?.height} repeatedOccurrence=${repeated?.rockNumber} repeatedHeight=${repeated?.height}}`)
    return {
        loopLength: repeated!.rockNumber - first!.rockNumber,
        loopHeight: repeated!.height - first!.height,
        loopStart: first!.rockNumber

    }
}
function loopOptimizedSimulation(shapes: string[][][], input: string, rocks: number) {
    const { loopLength, loopHeight, loopStart } = findLoop(shapes, input)
    let heightOfAllLoops = 0
    let remaining = rocks - loopStart
    if (loopStart + loopLength < rocks) { // optimize calculation by using loops
        const nrLoops = Math.floor((rocks - loopStart) / loopLength)
        remaining = (rocks - loopStart) % loopLength
        heightOfAllLoops = nrLoops * loopHeight
    }
    // find out additional rocks and there heights
    const chamber = new Chamber()
    const caveSimulator = new CaveSimulator(shapes, chamber, input)
    caveSimulator.runCaveSimulation(loopStart + remaining)
    const additionalHeight = chamber.getFilledHeight()
    return heightOfAllLoops + additionalHeight
}

describe("Day 17", () => {
    const shapes = shapesString.map(
        lines => lines.split("\n")
            .map(line => line.split(""))
        )

    const example = ">>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>"

    describe("Example", () => {
        describe("Initialising shapes", () => {
            const lines = parseLines(example)
            it("should have parsed 1 line", () => {
                expect(lines.length).toBe(1)
            })
            it("should have parsed shapes", () => {
                expect(shapes[0][0].length).toBe(4)
                expect(shapes[0][0][0].length).toBe(1)
                expect(shapes[4]).toStrictEqual([
                    ["@", "@"],
                    ["@", "@"]
                ])
            })
        })
        describe("dealing with chamber", () => {
            describe("should place one shape and move it to left and right", () => {
                const chamber = new Chamber()
                it("should print an empty chamber", () => {
                    expect(chamber.toString()).toBe("+-------+")
                })
                it("should add a shape and print a bar", () => {
                    chamber.addShape(shapes[0])
                    expect(chamber.toString()).toBe(
                        `|..@@@@.|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
                it("should move the shape to the right", () => {
                    chamber.moveCurrentShapeRight()
                    expect(chamber.toString()).toBe(
                        `|...@@@@|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
                it("should move should not change shape position when moving to the right and border is reached", () => {
                    chamber.moveCurrentShapeRight()
                    expect(chamber.toString()).toBe(
                        `|...@@@@|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
                it("should move the shape to the left", () => {
                    chamber.moveCurrentShapeLeft()
                    expect(chamber.toString()).toBe(
                        `|..@@@@.|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
                it("should move the shape to the left but not over the border", () => {
                    chamber.moveCurrentShapeLeft()
                    chamber.moveCurrentShapeLeft()
                    chamber.moveCurrentShapeLeft()
                    expect(chamber.toString()).toBe(
                        `|@@@@...|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
            })
            describe("should place a bigger shape, let in drop and add another shape", () => {
                const chamber = new Chamber()
                it("should place the shape and print it", () => {
                    chamber.addShape(shapes[2])
                    expect(chamber.toString()).toBe(
                        `|....@..|
|....@..|
|..@@@..|
|.......|
|.......|
|.......|
+-------+`
                    )
                })
                it("should drop the shape one block", () => {
                    const dropResult = chamber.dropCurrentShape1Unit()
                    expect(dropResult).toBeTruthy()
                    expect(chamber.toString()).toBe(
                        `|.......|
|....@..|
|....@..|
|..@@@..|
|.......|
|.......|
+-------+`
                    )
                })
                it("should return false after dropping 3 times", () => {
                    expect(chamber.dropCurrentShape1Unit()).toBeTruthy()
                    expect(chamber.dropCurrentShape1Unit()).toBeTruthy()
                    const dropResult = chamber.dropCurrentShape1Unit()
                    expect(chamber.toString()).toBe(
                        `|.......|
|.......|
|.......|
|....#..|
|....#..|
|..###..|
+-------+`
                    )
                    expect(dropResult).toBeFalsy()
                    expect(chamber.getFilledHeight()).toBe(3)
                })
                it("should place another shape and print it", () => {
                    chamber.addShape(shapes[4])
                    expect(chamber.toString()).toBe(
                        `|..@@...|
|..@@...|
|.......|
|.......|
|.......|
|....#..|
|....#..|
|..###..|
+-------+`
                    )
                })
                it("should return false after dropping 6 times", () => {
                    for (let i = 0; i < 5; i++)
                        expect(chamber.dropCurrentShape1Unit()).toBeTruthy()
                    const dropResult = chamber.dropCurrentShape1Unit()
                    expect(chamber.toString()).toBe(
                        `|.......|
|.......|
|.......|
|.......|
|.......|
|..###..|
|..###..|
|..###..|
+-------+`
                    )
                    expect(dropResult).toBeFalsy()
                    expect(chamber.getFilledHeight()).toBe(3)
                })
            })
        })
        describe("run some rounds", () => {
            it ("should run one rounds", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(1)
                expect(chamber.getFilledHeight()).toBe(1)
                expect(chamber.toString()).toBe(
                    `|.......|
|.......|
|.......|
|..####.|
+-------+`)

            })
            it ("should run two rounds", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(2)
                expect(chamber.getFilledHeight()).toBe(4)
                expect(chamber.toString()).toBe(
`|.......|
|.......|
|.......|
|...#...|
|..###..|
|...#...|
|..####.|
+-------+`)

            })
            it ("should run ten rounds", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(10)
                expect(chamber.toString()).toBe(
`|.......|
|.......|
|.......|
|.......|
|.......|
|....#..|
|....#..|
|....##.|
|##..##.|
|######.|
|.###...|
|..#....|
|.####..|
|....##.|
|....##.|
|....#..|
|..#.#..|
|..#.#..|
|#####..|
|..###..|
|...#...|
|..####.|
+-------+`)
                expect(chamber.getFilledHeight()).toBe(17)
            })
        })
        describe("run example", () => {
            it ("should run 2022 rocks", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(2022)
                expect(chamber.getFilledHeight()).toBe(3068)
            })
        })
        describe("run short examples and compare with a loop detection optimization", () => {
            it ("should run 10 rocks", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(10)
                expect(chamber.getFilledHeight()).toBe(17)
                const height = loopOptimizedSimulation(shapes, example, 10)
                expect(height).toBe(17)
            })
            it ("should run 100 rocks", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, example)
                caveSimulator.runCaveSimulation(100)
                expect(chamber.getFilledHeight()).toBe(157)
                const height = loopOptimizedSimulation(shapes, example, 100)
                expect(height).toBe(157)
            })
            describe("run example with loop detection optimization", () => {
                it ("should run 2022 rocks", () => {
                    const height = loopOptimizedSimulation(shapes, example, 2022)
                    expect(height).toBe(3068)
                })
            })
            describe("run long example with loop detection optimization", () => {
                it ("should run 1000_000_000_000 rocks", () => {
                    const height = loopOptimizedSimulation(shapes, example, 1000_000_000_000)
                    expect(height).toBe(1_514_285_714_288)
                })
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay17.txt").trim()
        describe("Part 1", () => {
            it("should find solution", () => {
                const chamber = new Chamber()
                const caveSimulator = new CaveSimulator(shapes, chamber, input)
                caveSimulator.runCaveSimulation(2022)
                expect(chamber.getFilledHeight()).toBeGreaterThan(3068)
                expect(chamber.getFilledHeight()).toBeLessThan(3135)
                expect(chamber.getFilledHeight()).toBe(3119)
            })
            it ("should find solution also with loop optimization", () => {
                const height = loopOptimizedSimulation(shapes, input, 2022)
                expect(height).toBe(3119)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const height = loopOptimizedSimulation(shapes, input, 1000_000_000_000)
                expect(height).toBeLessThan(1537175792522)
                expect(height).toBeLessThan(1537175792515)
                expect(height).toBe(1536994219669)
            })
        })
    })
})
