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

class SignalStrengthMonitor {
    signalStrengthLog: number[] = []

    shouldLog(clock: number)  {
        return clock === 20 || (clock - 20) % 40 === 0
    }
    logSignalStrength(cmd: CpuInstruction, clock: number, registerX: number, signalStrength: number) {
        if (this.shouldLog(clock)) {
            this.signalStrengthLog.push(signalStrength)
        }
    }
}

class Cpu {
    clock = 0
    registerX = 1
    signalStrengthMonitor?: SignalStrengthMonitor

    constructor(signalStrengthMonitor?: SignalStrengthMonitor) {
        this.signalStrengthMonitor = signalStrengthMonitor;
    }

    getSignalStrength() {
        return this.clock * this.registerX
    }

    logSignalStrength(instruction: CpuInstruction) {
        if (this.signalStrengthMonitor) {
            this.signalStrengthMonitor.logSignalStrength(instruction, this.clock, this.registerX, this.getSignalStrength())
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
            const signalStrengthMonitor = new SignalStrengthMonitor()
            const cpu = new Cpu(signalStrengthMonitor)
            cpu.executeInstructions(instructions)
            const s = sum(signalStrengthMonitor.signalStrengthLog)
            expect(s).toBe(13140)
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
                const signalStrengthMonitor = new SignalStrengthMonitor()
                const cpu = new Cpu(signalStrengthMonitor)
                cpu.executeInstructions(instructions)
                const s = sum(signalStrengthMonitor.signalStrengthLog)
                expect(s).toBe(15880)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
