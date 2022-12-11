// Advent of code 2022 - day 10

import {readFileSync} from "fs"

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

enum Command {
    ADDX = "addx",
    NOOP = "noop"
}
class CpuInstruction {
    cmd: Command
    par?: number

    constructor(cmd: Command, par?: number) {
        this.cmd = cmd;
        this.par = par;
    }

    toString() {
        return `cmd=${this.cmd} par=${this.par}`
    }
}

function parseCpuInstruction(l: string) {
    const parts = l.split(" ")
    const cmd = <Command>parts[0]
    if (cmd === Command.ADDX) {
        const par = Number.parseInt(parts[1])
        return new CpuInstruction(cmd, par)
    } else return new CpuInstruction(Command.NOOP)
}

function parseCpuInstructions(lines: string[]) {
    return lines.map(l => parseCpuInstruction(l))
}

function sum(numbers: number[]) {
    return numbers.reduce((sum, current) => sum + current, 0)
}

interface CpuMonitor {
    monitorLog: number[]

    log(cmd: CpuInstruction, clock: number, registerX: number, signalStrength: number): void
}

class SampledSignalStrengthMonitor implements CpuMonitor{
    monitorLog: number[] = []

    shouldLog(clock: number)  {
        return clock === 20 || (clock - 20) % 40 === 0
    }
    log(cmd: CpuInstruction, clock: number, registerX: number, signalStrength: number) {
        if (this.shouldLog(clock)) {
            this.monitorLog.push(signalStrength)
        }
    }
}
class DetailedRegisterXMonitor implements CpuMonitor{
    monitorLog: number[] = []

    log(cmd: CpuInstruction, clock: number, registerX: number, signalStrength: number) {
        this.monitorLog.push(registerX)
    }
}

class Cpu {
    clock = 0
    registerX = 1
    signalStrengthMonitor?: CpuMonitor

    constructor(signalStrengthMonitor?: CpuMonitor) {
        this.signalStrengthMonitor = signalStrengthMonitor;
    }

    getSignalStrength() {
        return this.clock * this.registerX
    }

    logSignalStrength(instruction: CpuInstruction) {
        if (this.signalStrengthMonitor) {
            this.signalStrengthMonitor.log(instruction, this.clock, this.registerX, this.getSignalStrength())
        }
    }
    executeInstruction(instruction: CpuInstruction) {
        if (instruction.cmd === Command.ADDX) {
            this.clock++
            this.logSignalStrength(instruction)
            this.clock++
            this.logSignalStrength(instruction)
            this.registerX += instruction.par!
        } else {
            this.clock++
            this.logSignalStrength(instruction)
        }
    }
    executeInstructions(instructions: CpuInstruction[]) {
        for (const instruction of instructions)
            this.executeInstruction(instruction)
    }
}

function drawCrt(registerXLog: number[]) {
    let crt: string[][] = []
    for (let y = 0; y < 6; y++) {
        const emptyRow: string[] = new Array(40)
        emptyRow.fill(".")
        crt.push(emptyRow)
    }
    for (let i = 0; i < registerXLog.length; i++) {
        const registerX = registerXLog[i]
        const x = i % 40
        const y = Math.floor(i / 40)
        if (registerX-1 <= x && x <= registerX+1) // 3 pixel sprite at position registerX and pixel overlap
            crt[y][x] = '#'
    }
    return crt.map(row => row.join("")).join("\n")
}

describe("Day 10", () => {

    const example = `
        addx 15
        addx -11
        addx 6
        addx -3
        addx 5
        addx -1
        addx -8
        addx 13
        addx 4
        noop
        addx -1
        addx 5
        addx -1
        addx 5
        addx -1
        addx 5
        addx -1
        addx 5
        addx -1
        addx -35
        addx 1
        addx 24
        addx -19
        addx 1
        addx 16
        addx -11
        noop
        noop
        addx 21
        addx -15
        noop
        noop
        addx -3
        addx 9
        addx 1
        addx -3
        addx 8
        addx 1
        addx 5
        noop
        noop
        noop
        noop
        noop
        addx -36
        noop
        addx 1
        addx 7
        noop
        noop
        noop
        addx 2
        addx 6
        noop
        noop
        noop
        noop
        noop
        addx 1
        noop
        noop
        addx 7
        addx 1
        noop
        addx -13
        addx 13
        addx 7
        noop
        addx 1
        addx -33
        noop
        noop
        noop
        addx 2
        noop
        noop
        noop
        addx 8
        noop
        addx -1
        addx 2
        addx 1
        noop
        addx 17
        addx -9
        addx 1
        addx 1
        addx -3
        addx 11
        noop
        noop
        addx 1
        noop
        addx 1
        noop
        noop
        addx -13
        addx -19
        addx 1
        addx 3
        addx 26
        addx -30
        addx 12
        addx -1
        addx 3
        addx 1
        noop
        noop
        noop
        addx -9
        addx 18
        addx 1
        addx 2
        noop
        noop
        addx 9
        noop
        noop
        noop
        addx -1
        addx 2
        addx -37
        addx 1
        addx 3
        noop
        addx 15
        addx -21
        addx 22
        addx -6
        addx 1
        noop
        addx 2
        addx 1
        noop
        addx -10
        noop
        noop
        addx 20
        addx 1
        addx 2
        addx 2
        addx -6
        addx -11
        noop
        noop
        noop`

    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 146 lines", () => {
            expect(lines.length).toBe(146)
        })
        const instructions = parseCpuInstructions(lines)
        it("should have parsed steps", () => {
            expect(instructions.length).toBe(146)
            expect(instructions[0]).toStrictEqual(new CpuInstruction(Command.ADDX, 15))
            expect(instructions[9]).toStrictEqual(new CpuInstruction(Command.NOOP))
        })
        it("should execute small program", () => {
            const smallProgram = `
            noop
            addx 3
            addx -5`
            const instructions = parseCpuInstructions(parseLines(smallProgram))
            const cpu = new Cpu()
            cpu.executeInstructions(instructions)
            expect(cpu.registerX).toBe(-1)
        })
        it("should execute example", () => {
            const signalStrengthMonitor = new SampledSignalStrengthMonitor()
            const cpu = new Cpu(signalStrengthMonitor)
            cpu.executeInstructions(instructions)
            const s = sum(signalStrengthMonitor.monitorLog)
            expect(s).toBe(13140)
        })
        describe("should log every cycle", () => {
            const registerXMonitor = new DetailedRegisterXMonitor()
            const cpu = new Cpu(registerXMonitor)
            cpu.executeInstructions(instructions)
            it("should have logged every cycle", () => {
                expect(registerXMonitor.monitorLog.length).toBe(240)
            })
            it("should draw to CRT", () => {
                const screen = drawCrt(registerXMonitor.monitorLog)
                expect(screen).toBe(
`##..##..##..##..##..##..##..##..##..##..
###...###...###...###...###...###...###.
####....####....####....####....####....
#####.....#####.....#####.....#####.....
######......######......######......####
#######.......#######.......#######.....`)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay10.txt")
        const lines = parseLines(input)
        const instructions = parseCpuInstructions(lines)
        it("should have parsed instructions", () => {
            expect(instructions.length).toBe(142)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const signalStrengthMonitor = new SampledSignalStrengthMonitor()
                const cpu = new Cpu(signalStrengthMonitor)
                cpu.executeInstructions(instructions)
                const s = sum(signalStrengthMonitor.monitorLog)
                expect(s).toBe(15880)
            })
        })
        describe("Part 2", () => {
            const registerXMonitor = new DetailedRegisterXMonitor()
            const cpu = new Cpu(registerXMonitor)
            cpu.executeInstructions(instructions)
            it("should find solution", () => {
                const screen = drawCrt(registerXMonitor.monitorLog)
                const expected = `
                    ###..#.....##..####.#..#..##..####..##..
                    #..#.#....#..#.#....#.#..#..#....#.#..#.
                    #..#.#....#....###..##...#..#...#..#....
                    ###..#....#.##.#....#.#..####..#...#.##.
                    #....#....#..#.#....#.#..#..#.#....#..#.
                    #....####..###.#....#..#.#..#.####..###.`
                    .split("\n").map(l => l.trim()).filter(l => l.length > 0).join("\n")
                expect(screen).toBe(expected)
            })
        })
    })
})
