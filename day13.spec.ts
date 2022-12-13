// Advent of code 2022 - day 13

import {readFileSync} from "fs"
import {isEqual} from "lodash"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim())
}

function parsePackets(s: string) {
    return JSON.parse(s)
}

function parsePacketPairs(lines: string[]) {
    const result: any[][] = []
    let currentPair: any[] = []
    for (const line of lines) {
        if (line.length === 0) {
            result.push(currentPair)
            currentPair = []
        } else {
            try {
                currentPair.push(JSON.parse(line))
            } catch(e) {
                throw new Error(`Error when parsing ${line}`)
            }
        }
    }
    return result
}

function checkPacketsOrder(param: any[][]): boolean | undefined {
    const left = param[0]
    const right = param[1]
    for (let i = 0; i < left.length; i++) {
        if (right[i] === undefined) return false
        if (Array.isArray(left[i]) || Array.isArray(right[i])) {
            let rightPacket = right[i]
            if (! Array.isArray(rightPacket)) rightPacket = [rightPacket]
            let leftPacket = left[i]
            if (! Array.isArray(leftPacket)) leftPacket = [leftPacket]
            const nestedResult = checkPacketsOrder([leftPacket, rightPacket])
            if (nestedResult != undefined) return nestedResult
        } else {
            if (left[i] < right[i]) return true
            if (left[i] > right[i]) return false
        }
    }
    if (right.length > left.length) return true
    return undefined
}

function flattenList(list: any[][]) {
    const result: any[] = []
    for (const e of list) {
        result.push(...e)
    }
    return result
}
function sumPairsInRightOrder(pairs: any[][]) {
    let sum = 0
    for (let i = 1; i <= pairs.length; i++) {
        if (checkPacketsOrder(pairs[i-1])) sum += i
    }
    return sum
}

function comparePacketsOrder(a: any, b: any) {
    const check = checkPacketsOrder([a, b])
    switch(check) {
        case true: return -1
        case false: return 1
        case undefined: return 0
    }
}

function findIndexesList(sortedPackets: any[], searchFor: number[][][]) {
    const result: number[] = []
    for (const search of searchFor) {
        for (let i = 1; i <= sortedPackets.length; i++) {
            if (isEqual(sortedPackets[i-1], search)) {
                result.push(i)
                break
            }
        }
    }
    return result
}

describe("Day 13", () => {

    const example =
        `[1,1,3,1,1]
        [1,1,5,1,1]
        
        [[1],[2,3,4]]
        [[1],4]
        
        [9]
        [[8,7,6]]
        
        [[4,4],4,4]
        [[4,4],4,4,4]
        
        [7,7,7,7]
        [7,7,7]
        
        []
        [3]
        
        [[[]]]
        [[]]
        
        [1,[2,[3,[4,[5,6,7]]]],8,9]
        [1,[2,[3,[4,[5,6,0]]]],8,9]
        `

    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 23 lines", () => {
            expect(lines.length).toBe(24)
        })
        it("should parse packets", () => {
            const packets = parsePackets("[[1],[2,3,4]]")
            expect(packets).toStrictEqual([[1],[2,3,4]])
        })
        const packetPairs = parsePacketPairs(lines)
        it("should have parsed packet pairs", () => {
            expect(packetPairs.length).toBe(8)
            expect(packetPairs[0][0]).toStrictEqual([1,1,3,1,1])
            expect(packetPairs[0][1]).toStrictEqual([1,1,5,1,1])
            expect(packetPairs[7][0]).toStrictEqual([1,[2,[3,[4,[5,6,7]]]],8,9])
            expect(packetPairs[7][1]).toStrictEqual([1,[2,[3,[4,[5,6,0]]]],8,9])
        })
        describe("check packets order in simple lists", () => {
            it ("should check right order", () => {
                expect(checkPacketsOrder([[1], [2]])).toBeTruthy()
                expect(checkPacketsOrder([[1], [2, 3]])).toBeTruthy()
                expect(checkPacketsOrder([[1, 2, 3, 4], [1, 2, 4, 4]])).toBeTruthy()
                expect(checkPacketsOrder([[1, 2, [3], 4], [1, 2, [4, 1], 4]])).toBeTruthy()
            })
            it ("should check wrong order", () => {
                expect(checkPacketsOrder([[1], []])).toBeFalsy()
                expect(checkPacketsOrder([[1], [1]])).toBeFalsy()
                expect(checkPacketsOrder([[1, 2, 4, 4], [1, 2, 3, 4]])).toBeFalsy()
            })
        })
        describe("check packets order in nested lists", () => {
            it ("should check right order", () => {
                expect(checkPacketsOrder([[[1]], [[2]]])).toBeTruthy()
                expect(checkPacketsOrder([[[1]], [2]])).toBeTruthy()
                expect(checkPacketsOrder([[[1, 2], 3], [2]])).toBeTruthy()
            })
            it ("should check wrong order", () => {
                expect(checkPacketsOrder([[[2]], [1]])).toBeFalsy()
                expect(checkPacketsOrder([[[1, 2], 3], [[1, 2], 2]])).toBeFalsy()
                expect(checkPacketsOrder([[[1, 2], 3], [1]])).toBeFalsy()
            })
        })
        describe("check pairs from example", () => {
            expect(checkPacketsOrder(packetPairs[0])).toBeTruthy()
            expect(checkPacketsOrder(packetPairs[1])).toBeTruthy()
            expect(checkPacketsOrder(packetPairs[2])).toBeFalsy()
            expect(checkPacketsOrder(packetPairs[3])).toBeTruthy()
            expect(checkPacketsOrder(packetPairs[4])).toBeFalsy()
            expect(checkPacketsOrder(packetPairs[5])).toBeTruthy()
            expect(checkPacketsOrder(packetPairs[6])).toBeFalsy()
            expect(checkPacketsOrder(packetPairs[7])).toBeFalsy()
        })
        describe("sum right pairs", () => {
           it("should sum the right pairs", () => {
               expect(sumPairsInRightOrder(packetPairs)).toBe(13)
           })
        });

        describe("flatten", () => {
            it("should flatten some list", () => {
                expect(flattenList([[[1, 2], [2, 3]], [[1, [2]], [[2, [3], [4]]] ]])).toStrictEqual([ [1, 2], [2, 3], [1, [2]], [[2, [3], [4]]] ])
            })
            it("should flatten example", () => {
                expect(flattenList(packetPairs)).toStrictEqual([
                    [1,1,3,1,1],
                    [1,1,5,1,1],
                    [[1],[2,3,4]],
                    [[1],4],
                    [9],
                    [[8,7,6]],
                    [[4,4],4,4],
                    [[4,4],4,4,4],
                    [7,7,7,7],
                    [7,7,7],
                    [],
                    [3],
                    [[[]]],
                    [[]],
                    [1,[2,[3,[4,[5,6,7]]]],8,9],
                    [1,[2,[3,[4,[5,6,0]]]],8,9]
                ])
            })
        })
        describe("sort example with dividers", () => {
            const packetsWithDividers = flattenList(packetPairs)
            packetsWithDividers.push([[2]], [[6]])
            const sortedPackets = packetsWithDividers.sort((a, b) => comparePacketsOrder(a, b))
            expect(sortedPackets).toStrictEqual([
                [],
                [[]],
                [[[]]],
                [1,1,3,1,1],
                [1,1,5,1,1],
                [[1],[2,3,4]],
                [1,[2,[3,[4,[5,6,0]]]],8,9],
                [1,[2,[3,[4,[5,6,7]]]],8,9],
                [[1],4],
                [[2]],
                [3],
                [[4,4],4,4],
                [[4,4],4,4,4],
                [[6]],
                [7,7,7],
                [7,7,7,7],
                [[8,7,6]],
                [9]
            ])
            const [d1, d2] = findIndexesList(sortedPackets, [ [[2]], [[6]]] )
            expect([d1, d2]).toStrictEqual([10, 14])
            expect(d1 * d2).toBe(140)
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay13.txt")
        const lines = parseLines(input)
        const packetPairs = parsePacketPairs(lines)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(450)
            expect(packetPairs.length).toBe(150)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const result = sumPairsInRightOrder(packetPairs)
                expect(result).toBeLessThan(6990) // first try was too high
                expect(result).toBe(5198)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const packetsWithDividers = flattenList(packetPairs)
                packetsWithDividers.push([[2]], [[6]])
                const sortedPackets = packetsWithDividers.sort((a, b) => comparePacketsOrder(a, b))
                const [d1, d2] = findIndexesList(sortedPackets, [ [[2]], [[6]]] )
                expect(d1 * d2).toBe(22344)
            })
        })
    })
})
