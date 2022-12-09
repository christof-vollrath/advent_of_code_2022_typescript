// Advent of code 2022 - day 09

import {readFileSync} from "fs"
import {Coordinates2} from "./day08.spec";
import * as Collections from "typescript-collections"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

type Step = {
    dir: Direction,
    nr: number
}

type Rope = {
    head: Coordinates2,
    tail: Coordinates2
}

enum Direction {
    RIGHT = "R",
    LEFT = "L",
    UP = "U",
    DOWN = "D"
}

function parseStep(l: string): Step {
    const parts = l.split(" ");
    const dir = <Direction>parts[0]
    const nr = Number.parseInt(parts[1])
    return {
        dir: dir,
        nr: nr
    }
}

function parseSteps(lines: string[]): Step[] {
    return lines.map(l => parseStep(l))
}

function calculateDelta(dir: Direction) {
    switch (dir) {
        case Direction.RIGHT: return new Coordinates2(1, 0)
        case Direction.LEFT: return new Coordinates2(-1, 0)
        case Direction.DOWN: return new Coordinates2(0, 1)
        case Direction.UP: return new Coordinates2(0, -1)
    }
}

function moveOneStep(dir: Direction, rope: Rope, tailPath?: Coordinates2[]) {
    function calculateDeltaTail(head: Coordinates2, tail: Coordinates2) {
        if (head.x === tail.x && head.y < tail.y) return new Coordinates2(0, -1)
        if (head.x === tail.x && head.y > tail.y) return new Coordinates2(0, 1)
        if (head.x < tail.x && head.y === tail.y) return new Coordinates2(-1, 0)
        if (head.x > tail.x && head.y === tail.y) return new Coordinates2(1, 0)
        if (head.x < tail.x && head.y < tail.y) return new Coordinates2(-1, -1)
        if (head.x < tail.x && head.y > tail.y) return new Coordinates2(-1, 1)
        if (head.x > tail.x && head.y > tail.y) return new Coordinates2(1, 1)
        if (head.x > tail.x && head.y < tail.y) return new Coordinates2(1, -1)
        throw new Error(`No move found for head=${JSON.stringify(head)} tail=${JSON.stringify(tail)}`)
    }

    const deltaHead = calculateDelta(dir)
    rope.head = rope.head.add(deltaHead)
    if (! rope.tail.closeBy(rope.head)) { // have to move tail
        const deltaTail = calculateDeltaTail(rope.head, rope.tail)
        rope.tail = rope.tail.add(deltaTail)
    }
    if (tailPath) tailPath.push(rope.tail)
}

function moveRope(rope: Rope, step: Step, tailPath?: Coordinates2[]) {
    for (let i = 0; i < step.nr; i++) {
        moveOneStep(step.dir, rope, tailPath);
    }
}

function followSteps(rope: Rope, steps: Step[], tailPath?: Coordinates2[]) {
    for (const step of steps) moveRope(rope, step, tailPath)
}

function arrayToSet<T>(a: T[]): Collections.Set<T> {
    const result = new Collections.Set<T>()
    for (const e of a) result.add(e)
    return result
}

describe("Day 9", () => {
    const example = `
        R 4
        U 4
        L 3
        D 1
        R 4
        D 1
        L 5
        R 2`

    describe("close by of coordinates", () => {
        it("should be close by", () => {
            expect(new Coordinates2(1, 1).closeBy(new Coordinates2(1, 1))).toBeTruthy()
            expect(new Coordinates2(0, 1).closeBy(new Coordinates2(1, 0))).toBeTruthy()
            expect(new Coordinates2(0, 1).closeBy(new Coordinates2(-1, 1))).toBeTruthy()
        })
        it("should not be close by", () => {
            expect(new Coordinates2(1, 2).closeBy(new Coordinates2(1, 0))).toBeFalsy()
            expect(new Coordinates2(0, 0).closeBy(new Coordinates2(2, 2))).toBeFalsy()
            expect(new Coordinates2(1, -1).closeBy(new Coordinates2(-1, 1))).toBeFalsy()
        })
    })
    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 8 lines", () => {
            expect(lines.length).toBe(8)
        })
        const steps = parseSteps(lines)
        it("should have parsed steps", () => {
            expect(steps.length).toBe(8)
            expect(steps[0]).toStrictEqual({dir: Direction.RIGHT, nr: 4})
            expect(steps[6]).toStrictEqual({dir: Direction.LEFT, nr: 5})
        })
        describe("horizontal or vertical moves with H and L side by side", () => {
            let rope = { head: new Coordinates2(2, 1), tail: new Coordinates2(1, 1) }
            moveRope(rope, { dir: Direction.RIGHT, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(3, 1), tail: new Coordinates2(2, 1) })
            rope = { head: new Coordinates2(1, 2), tail: new Coordinates2(1, 1) }
            moveRope(rope, { dir: Direction.DOWN, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 3), tail: new Coordinates2(1, 2) })
            rope = { head: new Coordinates2(1, 2), tail: new Coordinates2(1, 3) }
            moveRope(rope, { dir: Direction.UP, nr: 2})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 0), tail: new Coordinates2(1, 1) })
            rope = { head: new Coordinates2(5, 1), tail: new Coordinates2(6, 1) }
            moveRope(rope, { dir: Direction.LEFT, nr: 4})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 1), tail: new Coordinates2(2, 1) })
        })
        describe("horizontal or vertical moves with H and L overlapping", () => {
            let rope = { head: new Coordinates2(1, 1), tail: new Coordinates2(1, 1) }
            moveRope(rope, { dir: Direction.RIGHT, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(2, 1), tail: new Coordinates2(1, 1) })
            rope = { head: new Coordinates2(1, 1), tail: new Coordinates2(1, 1) }
            moveRope(rope, { dir: Direction.DOWN, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 2), tail: new Coordinates2(1, 1) })
            rope = { head: new Coordinates2(1, 2), tail: new Coordinates2(1, 2) }
            moveRope(rope, { dir: Direction.UP, nr: 2})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 0), tail: new Coordinates2(1, 1) })
            rope = { head: new Coordinates2(5, 1), tail: new Coordinates2(5, 1) }
            moveRope(rope, { dir: Direction.LEFT, nr: 4})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 1), tail: new Coordinates2(2, 1) })
        })
        describe("diagonal moves", () => {
            let rope = { head: new Coordinates2(2, 4), tail: new Coordinates2(1, 3) }
            moveRope(rope, { dir: Direction.RIGHT, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(3, 4), tail: new Coordinates2(2, 4) })
            rope = { head: new Coordinates2(2, 2), tail: new Coordinates2(1, 1) }
            moveRope(rope, { dir: Direction.DOWN, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(2, 3), tail: new Coordinates2(2, 2) })
            rope = { head: new Coordinates2(2, 2), tail: new Coordinates2(1, 3) }
            moveRope(rope, { dir: Direction.UP, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(2, 1), tail: new Coordinates2(2, 2) })
            rope = { head: new Coordinates2(2, 2), tail: new Coordinates2(3, 3) }
            moveRope(rope, { dir: Direction.LEFT, nr: 1})
            expect(rope).toStrictEqual({ head: new Coordinates2(1, 2), tail: new Coordinates2(2, 2) })
        })
        describe("follow tail path", () => {
            const rope = { head: new Coordinates2(0, 4), tail: new Coordinates2(0, 4) }
            const tailPath: Coordinates2[] = []
            followSteps(rope, steps, tailPath)
            const tailPathSet = arrayToSet(tailPath)
            expect(tailPathSet.size()).toBe(13)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay09.txt")
        const lines = parseLines(input)
        const steps = parseSteps(lines)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(2000)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const rope = { head: new Coordinates2(0, 0), tail: new Coordinates2(0, 0) }
                const tailPath: Coordinates2[] = []
                followSteps(rope, steps, tailPath)
                const tailPathSet = arrayToSet(tailPath)
                expect(tailPathSet.size()).toBe(6044)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
