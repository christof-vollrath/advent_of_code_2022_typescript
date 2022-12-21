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
`####`,
`.#.
###
.#.`,
`..#
..#
###`,
`#
#
#
#`,
`##
##`
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

    addShape(shape: Shape) {
        this.currentShape = new ShapeAndPosition(shape, this.getStartCoordinates(shape))
        this.increaseHeight(3 + this.currentShape.shape.length)
    }

    printPos(x: number, y: number, cave: string[][]) {
        let c = cave[y][x];
        // current shape
        if(this.currentShape) {
            const shape = this.currentShape.shape
            const xOffset = x - this.currentShape.coord.x
            if (y < shape.length &&  0 <= xOffset && xOffset< shape[y].length)
                if (this.currentShape.shape[y][xOffset] === "#")
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
        for (let i = 0; i < incr; i++)
            this.cave.push([ ".", ".", ".", ".", ".", ".", "."])
        this.height += incr
    }

    private getStartCoordinates(shape: Shape) {
        return new Coordinates2(2, 0);
    }
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
                    ["#", "#"],
                    ["#", "#"]
                ])
            })
        })
        describe("dealing with chamber", () => {
            describe("should place one shape", () => {
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
            })
            describe("should place a bigger shape", () => {
                it("should place the shape and print a bar", () => {
                    const chamber = new Chamber()
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
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay17.txt")
        const lines = parseLines(input)
        it("should have parsed one line", () => {
            expect(lines.length).toBe(1)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
