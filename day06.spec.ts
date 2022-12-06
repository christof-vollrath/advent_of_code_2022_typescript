// Advent of code 2022 - day 06

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

function allDifferent(s: string) {
    const foundChars = new Set<string>()
    for (const c of s) {
        if (foundChars.has(c)) return false
        foundChars.add(c)
    }
    return true
}

function findMarker(s: string, length: number = 4) {
    for (let i = 0; i <= s.length-length; i++) {
        const slice = s.slice(i, i+length)
        if (allDifferent(slice)) return i+length
    }
    return NaN
}

describe("Day 6 Part One", () => {
    const example = "mjqjpqmgbljsphdztnvjfqwrcgsmlb"

    describe("Example", () => {
        describe("check all different", () => {
            it("should confirm that all are different", () => {
                expect(allDifferent("abcd")).toBeTruthy();
            })
            it("should confirm that chars are not different", () => {
                expect(allDifferent("abca")).toBeFalsy();
            })
        })
        describe("find marker", () => {
            it("should find marker at 7 for example", () => {
                expect(findMarker(example)).toBe(7)
            })
            it("should not find a marker", () => {
                expect(findMarker("abababababab")).toBe(NaN)
            })
            it("should find a marker at the end", () => {
                expect(findMarker("ababababababcd")).toBe(14)
            })
            it.each`
                datastream | pos
                ${"bvwbjplbgvbhsrlpgdmjqwftvncz"} ${5}
                ${"nppdvjthqldpwncqszvftbrmjlhg"} ${6}
                ${"nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg"} ${10} 
                ${"zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw"} ${11}
            `('$datastream has marker at $pos', ({ datastream, pos }) => {
                expect(findMarker(datastream)).toBe(pos);
            });
        })
        describe("find marker of length 14", () => {
            it.each`
                datastream | pos
                ${"mjqjpqmgbljsphdztnvjfqwrcgsmlb"} ${19}
                ${"bvwbjplbgvbhsrlpgdmjqwftvncz"} ${23}
                ${"nppdvjthqldpwncqszvftbrmjlhg"} ${23}
                ${"nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg"} ${29} 
                ${"zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw"} ${26}
            `('$datastream has marker at $pos', ({ datastream, pos }) => {
                expect(findMarker(datastream, 14)).toBe(pos);
            });
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay06.txt")
        describe("Part 1", () => {
            it("should find solution", () => {
                expect(findMarker(input)).toBe(1760);
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                expect(findMarker(input, 14)).toBe(2974);
            })
        })
    })

})
