// Advent of code 2022 - day 17

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

const shapesString = [
`@@@@`,
`.@.
@@@
.@.`,
`..@
..@
@@@`,
`@
@
@
@`,
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
}
class Chamber {
    currentShape: ShapeAndPosition | null = null
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

    toString() {
        const result: string[] = []

        for (let y = 0; y < this.cave.length; y++)
            result.push("|" + this.printRow(y, this.cave) + "|")
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
        this.currentShape = null
    }

    dropCurrentShape1Unit() {
        if (! this.currentShape) throw new Error("No current shape to drop")
        const newCoord = new Coordinates2(this.currentShape.coord.x, this.currentShape.coord.y + 1)
        const nextShape = new ShapeAndPosition(this.currentShape.shape, newCoord)
        const stoppedMoving = this.shapeReachedButtom(nextShape) || this.shapeReachedOtherShape(nextShape);
        if (stoppedMoving) {
            this.placeCurrentShapeInCave()
            return false
        } else {
            this.currentShape = nextShape
            return true
        }
    }

    private shapeReachedButtom(shape: ShapeAndPosition) {
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

function runCaveSimulation(shapes: string[][][], chamber: Chamber, number: number, windPattern: string) {
    let shapeIndex = 0
    let windIndex = 0
    let rockNumber = 0
    do { // handle shapes
        const shape = shapes[shapeIndex]
        shapeIndex++
        if (shapeIndex >= shapes.length) shapeIndex = 0
        chamber.addShape(shape)
        //console.log(chamber.toString())
        let blocked = false
        while (! blocked) { // drop shape
            const wind = windPattern[windIndex]
            if (wind === "<") chamber.moveCurrentShapeLeft()
            else if (wind === ">") chamber.moveCurrentShapeRight()
            else throw new Error(`Illegal wind ${wind} at index ${windIndex}`)
            windIndex++
            if (windIndex >= windPattern.length) windIndex = 0
            blocked = !chamber.dropCurrentShape1Unit()
            //console.log(`blocked=${blocked}`)
            //console.log(chamber.toString())
        }
        rockNumber++
    } while (rockNumber < number)
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
            it("should have parsed 1 lineq", () => {
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
                it("should move should not change shape position when moving to the right and border is readched", () => {
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
                runCaveSimulation(shapes, chamber, 1, example)
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
                runCaveSimulation(shapes, chamber, 2, example)
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
                runCaveSimulation(shapes, chamber, 10, example)
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
                runCaveSimulation(shapes, chamber, 2022, example)
                expect(chamber.getFilledHeight()).toBe(3068)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay17.txt").trim()
        describe("Part 1", () => {
            it("should find solution", () => {
                const chamber = new Chamber()
                runCaveSimulation(shapes, chamber, 2022, input)
                expect(chamber.getFilledHeight()).toBeGreaterThan(3068)
                expect(chamber.getFilledHeight()).toBeLessThan(3135)
                expect(chamber.getFilledHeight()).toBe(3119)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
