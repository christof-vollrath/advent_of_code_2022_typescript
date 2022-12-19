// Advent of code 2022 - day 16

import {readFileSync} from "fs"
import {Dictionary, Set} from "typescript-collections";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

function parseValveWithTunnels(line: string) {
    const valveWithTunnelsRegex = /\s*Valve ([A-Z]+) has flow rate=(\d+); tunnels? leads? to valves? ([A-Z, ]+)/
    const regexResult = valveWithTunnelsRegex.exec(line)
    if (!regexResult || regexResult.length < 4) throw Error(`can't parse ${line} ${regexResult?.length}`)
    const connected = regexResult[3].split(",").map(part => part.trim())
    return new ValveWithTunnels(regexResult[1], Number.parseInt(regexResult[2]), connected)
}

function parseValvesWithTunnels(lines: string[]): ValvesWithTunnels {
    const valvesWithTunnels = lines.map(l => parseValveWithTunnels(l))
    const resultMap = new Map<string, ValveWithTunnels>()
    for (const valveWithTunnels of valvesWithTunnels) resultMap.set(valveWithTunnels.name, valveWithTunnels)
    return new ValvesWithTunnels(resultMap)
}

class ValveWithTunnels {
    name: string
    rate: number
    connected: string[]

    constructor(name: string, rate: number, connected: string[]) {
        this.name = name;
        this.rate = rate;
        this.connected = connected;
    }
}

class ValvesWithTunnels {
    readonly map: Map<string, ValveWithTunnels>
    readonly activeValves: Set<String> = new Set<String>()

    constructor(map: Map<string, ValveWithTunnels>) {
        this.map = map;
        for (const valve of map.values()) {
            if (valve.rate > 0) this.activeValves.add(valve.name)
        }
    }
}

class ValveWithState {
    name: string
    open: boolean

    constructor(name: string, open: boolean) {
        this.name = name;
        this.open = open;
    }

    toString() {
        return `${this.name}-${this.open}`
    }
}

class PathThroughTunnels {
    valvesWithTunnels: ValvesWithTunnels
    minute: number
    pressure: number
    totalPressureMinutes: number
    currentValve: ValveWithState
    path: string[] = []
    openValves: Set<string>

    cloneSet(set: Set<string>) {
        const result = new Set<string>()
        set.forEach(element => result.add(element))
        return result
    }

    constructor(valvesWithTunnels: ValvesWithTunnels, minute?: number, pressure?: number, totalPressureMinutes?: number, currentValve?: ValveWithState, path?: string[], openValves?: Set<string>) {
        this.valvesWithTunnels = valvesWithTunnels
        this.minute = minute ?? 1
        this.pressure = pressure ?? 0
        this.totalPressureMinutes = totalPressureMinutes ?? 0
        this.currentValve = currentValve ?? new ValveWithState("AA", false)
        this.path = path ? [...path] : ["AA"]
        this.openValves = openValves ? this.cloneSet(openValves) :  new Set<string>()
    }

    move(valveName: string, openValve: boolean) {
        const valve = this.valvesWithTunnels.map.get(valveName)
        if (!valve) throw new Error(`Illegal valve ${valveName}`)
        this.currentValve = new ValveWithState(valveName, openValve)
        this.path.push(valve.name)
        this.minute++
        this.totalPressureMinutes += this.pressure
        if (openValve) {
            if (valve.rate > 0 && ! this.openValves.contains(valveName)) {
                // open valve
                this.openValves.add(valveName)
                this.pressure += valve.rate
                this.minute++ // opening valve takes a minute
                this.totalPressureMinutes += this.pressure
            }
        }
    }

    getForecastTotal() { // how would be the totalPressure when nothing changes anymore and 30 mins are completed
        return this.totalPressureMinutes + this.pressure * (30 - this.minute)
    }

    printPath() {
        return this.path.map(name => name + (this.openValves.contains(name) ? "*" : " ")).join(", ") + `(${this.getForecastTotal()} ${this.getOptimisticForecastTotal()})`
    }

    getOptimisticForecastTotal() {
        // optimistic means, in the next round the biggest valves will be opened as can be opened until 30 minutes
        const valves = [...this.valvesWithTunnels.map.values()]
        const bestValves = valves.filter(v => !this.openValves.contains(v.name))
            .sort((v1, v2) => v2.rate - v1.rate)
        const openableValves = bestValves.slice(0, (30 - this.minute) / 2)
        let sum = 0
        for (let i = 0; i < openableValves.length; i++) {
            sum += bestValves[i].rate * (30 - this.minute - i * 2)
        }
        return sum + this.getForecastTotal()
        /*
        if (this.minute > 30) return 0
        let sum = 0
        for (const valve of this.valvesWithTunnels.map.values()) {
            const rate = valve.rate
            if (! this.openValves.contains(valve.name)) {
                sum += rate
            }
        }
        const pressureOfAllUnopenedValves = sum * (30 - this.minute)
        return pressureOfAllUnopenedValves + this.getForecastTotal()

         */
    }
}

function generateAllPaths(valvesWithTunnels: ValvesWithTunnels, deep: boolean = true) {
    let lowerLimit = 0
    if (deep) { // try to find an upper limit
        const path = generateAllPaths(valvesWithTunnels, false)
        if (path) {
            // @ts-ignore
            lowerLimit = path.getForecastTotal() // Flat search might not give the optimal result but can be used as a lower limit
            console.log(`lowerLimit=${lowerLimit}`)
        }
    }
    let finalPath: PathThroughTunnels | null = null
    const startPath = new PathThroughTunnels(valvesWithTunnels)
    let openPaths: PathThroughTunnels[] = [startPath]
    let bestPaths = new Dictionary<string, PathThroughTunnels>()
    bestPaths.setValue(startPath.currentValve.name, startPath)
    while (openPaths.length > 0) {
        const nextOpenPaths: PathThroughTunnels[] = []
        for (const path of openPaths) {
            const nextValves = valvesWithTunnels.map.get(path.currentValve.name)!.connected
            // it doesn't make sense to stay at the same places until all valves are open
            for (const next of nextValves) {
                let nextPath = new PathThroughTunnels(valvesWithTunnels, path.minute, path.pressure, path.totalPressureMinutes, path.currentValve, path.path, path.openValves)
                const nextValve = valvesWithTunnels.map.get(next)
                let valveWithState
                if (nextValve!.rate > 0) { // can be opened
                    valveWithState = new ValveWithState(next, true)
                    nextPath.move(next, valveWithState.open)
                    if (finalPath === null || finalPath.getForecastTotal() < nextPath.getForecastTotal()) {
                        finalPath = nextPath
                        console.log(`new finalPath=${nextPath.printPath()}`)
                        nextOpenPaths.push(nextPath)
                    } else {
                        if (deep) {
                            if (nextPath.getOptimisticForecastTotal() > lowerLimit && (!finalPath || (nextPath.getOptimisticForecastTotal() > finalPath.getForecastTotal()))) {
                                //console.log(`added to nextOpenPaths=${nextPath.printPath()}`)
                                nextOpenPaths.push(nextPath)
                            }
                        } else {
                            const alreadyFound = bestPaths.getValue(valveWithState.name)
                            if (! alreadyFound || alreadyFound.getForecastTotal() < nextPath.getForecastTotal()) {
                                nextOpenPaths.push(nextPath)
                            }
                        }
                    }
                    if (! deep) {
                        const alreadyFound = bestPaths.getValue(valveWithState.name)
                        if (! alreadyFound || alreadyFound.getForecastTotal() < nextPath.getForecastTotal()) {
                            bestPaths.setValue(valveWithState.name, nextPath)
                        }
                    }
                }
                nextPath = new PathThroughTunnels(valvesWithTunnels, path.minute, path.pressure, path.totalPressureMinutes, path.currentValve, path.path, path.openValves)
                valveWithState = new ValveWithState(next, false)
                nextPath.move(next, valveWithState.open) // Don't have to check for all valves opened because no new one is opened
                if (deep) {
                    if (nextPath.getOptimisticForecastTotal() > lowerLimit && (!finalPath || (nextPath.getOptimisticForecastTotal() > finalPath.getForecastTotal()))) {
                        nextOpenPaths.push(nextPath)
                        //console.log(`added to nextOpenPaths=${nextPath.printPath()}`)
                    }
                } else {
                    const alreadyFound = bestPaths.getValue(valveWithState.name)
                    if (! alreadyFound || alreadyFound.getForecastTotal() < nextPath.getForecastTotal()) {
                        bestPaths.setValue(valveWithState.name, nextPath)
                        nextOpenPaths.push(nextPath)
                    }
                }
            }
        }
        openPaths = nextOpenPaths
        console.log(`nextOpenPaths=${nextOpenPaths.length}`)
        console.log(`nextOpenPaths=${nextOpenPaths.length}\n${nextOpenPaths.map(p => p.printPath()).join("\n")}\n`)
        // @ts-ignore
        console.log(`finalPath:\n${finalPath?.printPath()}\n`)
    }
    return finalPath
}
/**
 * Some findings about the problem:
 * - sometimes it makes sense to open a valve later, because a stronger valve could then open earlier
 * - when all valves are open, one does not have to move anymore
 */
describe("Day 16", () => {

    const example = `
        Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
        Valve BB has flow rate=13; tunnels lead to valves CC, AA
        Valve CC has flow rate=2; tunnels lead to valves DD, BB
        Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE
        Valve EE has flow rate=3; tunnels lead to valves FF, DD
        Valve FF has flow rate=0; tunnels lead to valves EE, GG
        Valve GG has flow rate=0; tunnels lead to valves FF, HH
        Valve HH has flow rate=22; tunnel leads to valve GG
        Valve II has flow rate=0; tunnels lead to valves AA, JJ
        Valve JJ has flow rate=21; tunnel leads to valve II
        `
    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 10 lines", () => {
            expect(lines.length).toBe(10)
        })
        it("should parse one line with valve and tunnels", () => {
            const valveWithTunnels = parseValveWithTunnels("Valve AA has flow rate=0; tunnels lead to valves DD, II, BB")
            expect(valveWithTunnels).toStrictEqual(new ValveWithTunnels("AA", 0, ["DD", "II", "BB"]))
        })
        const valvesWithTunnels = parseValvesWithTunnels(lines)
        it("should parse valve and tunnels lines", () => {
            expect(valvesWithTunnels.map.size).toBe(10)
            expect(valvesWithTunnels.map.get("BB")).toStrictEqual(new ValveWithTunnels("BB", 13, ["CC", "AA"]))
            expect(valvesWithTunnels.map.get("HH")).toStrictEqual(new ValveWithTunnels("HH", 22, ["GG"]))
            expect(valvesWithTunnels.activeValves.toArray()).toStrictEqual(["BB", "CC", "DD", "EE", "HH", "JJ", ])

        })
        it("follow path through tunnels", () => {
            const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
            expect(pathThroughTunnels.openValves.size()).toEqual(0)
            expect(pathThroughTunnels.minute).toEqual(1)
            expect(pathThroughTunnels.pressure).toEqual(0)
            expect(pathThroughTunnels.getForecastTotal()).toEqual(0)
            expect(pathThroughTunnels.currentValve!.name).toEqual("AA")
            pathThroughTunnels.move("DD", true)
            expect(pathThroughTunnels.minute).toEqual(3)
            expect(pathThroughTunnels.pressure).toEqual(20)
            expect(pathThroughTunnels.currentValve!.name).toEqual("DD")
            expect(pathThroughTunnels.openValves.size()).toEqual(1)
            expect(pathThroughTunnels.openValves.contains("DD")).toBeTruthy()
            pathThroughTunnels.move("CC", false)
            expect(pathThroughTunnels.minute).toEqual(4)
            expect(pathThroughTunnels.pressure).toEqual(20)
            pathThroughTunnels.move("BB", true)
            expect(pathThroughTunnels.minute).toEqual(6)
            expect(pathThroughTunnels.pressure).toEqual(33)
            expect(pathThroughTunnels.currentValve!.name).toEqual("BB")
            expect(pathThroughTunnels.openValves.size()).toEqual(2)
            expect(pathThroughTunnels.openValves.contains("BB")).toBeTruthy()
            pathThroughTunnels.move("AA", false)
            pathThroughTunnels.move("II", false)
            pathThroughTunnels.move("JJ", true)
            expect(pathThroughTunnels.minute).toEqual(10)
            expect(pathThroughTunnels.pressure).toEqual(54)
            expect(pathThroughTunnels.openValves.size()).toEqual(3)
            pathThroughTunnels.move("II", false)
            pathThroughTunnels.move("AA", false)
            pathThroughTunnels.move("DD", false)
            pathThroughTunnels.move("EE", false)
            pathThroughTunnels.move("FF", false)
            pathThroughTunnels.move("GG", false)
            pathThroughTunnels.move("HH", true)
            expect(pathThroughTunnels.minute).toEqual(18)
            expect(pathThroughTunnels.pressure).toEqual(76)
            expect(pathThroughTunnels.openValves.size()).toEqual(4)
            pathThroughTunnels.move("GG", false)
            pathThroughTunnels.move("FF", false)
            pathThroughTunnels.move("EE", true)
            expect(pathThroughTunnels.minute).toEqual(22)
            expect(pathThroughTunnels.pressure).toEqual(79)
            expect(pathThroughTunnels.openValves.size()).toEqual(5)
            pathThroughTunnels.move("DD", false)
            pathThroughTunnels.move("CC", true)
            expect(pathThroughTunnels.minute).toEqual(25)
            expect(pathThroughTunnels.pressure).toEqual(81)
            expect(pathThroughTunnels.openValves.size()).toEqual(6)
            expect(pathThroughTunnels.getForecastTotal()).toEqual(1651)
            pathThroughTunnels.move("CC", false)
            pathThroughTunnels.move("CC", false)
            pathThroughTunnels.move("CC", false)
            pathThroughTunnels.move("CC", false)
            pathThroughTunnels.move("CC", false)
            expect(pathThroughTunnels.getForecastTotal()).toEqual(1651)
            expect(pathThroughTunnels.minute).toEqual(30)
            expect(pathThroughTunnels.pressure).toEqual(81)
            expect(pathThroughTunnels.totalPressureMinutes).toEqual(1651)
        })
        it("follow path through tunnels and try to always open valve", () => {
            const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
            pathThroughTunnels.move("DD", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("BB", true)
            pathThroughTunnels.move("AA", true)
            pathThroughTunnels.move("II", true)
            pathThroughTunnels.move("JJ", true)
            pathThroughTunnels.move("II", true)
            pathThroughTunnels.move("AA", true)
            pathThroughTunnels.move("DD", true)
            pathThroughTunnels.move("EE", true)
            pathThroughTunnels.move("FF", true)
            pathThroughTunnels.move("GG", true)
            pathThroughTunnels.move("HH", true)
            pathThroughTunnels.move("GG", true)
            pathThroughTunnels.move("FF", true)
            pathThroughTunnels.move("EE", true)
            pathThroughTunnels.move("DD", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("CC", true)
            pathThroughTunnels.move("CC", true)
            expect(pathThroughTunnels.minute).toEqual(30)
            expect(pathThroughTunnels.pressure).toEqual(81)
            expect(pathThroughTunnels.totalPressureMinutes).toBeLessThan(1651) // it's not good to open valve as early as possible
        })
        describe("generate all paths from AA and find the best for very simple example", () => {
            const verySimpleExample = `
                    Valve AA has flow rate=0; tunnels lead to valves DD
                    Valve DD has flow rate=20; tunnels lead to valves AA
                    `
            const lines = parseLines(verySimpleExample)
            it("should calculate the forecast for the solution path", () => {
                // verify best path
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
                expect(pathThroughTunnels.getForecastTotal()).toEqual(0)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(580)
                pathThroughTunnels.move("DD", true)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD"])
                expect(pathThroughTunnels.getForecastTotal()).toEqual(560)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(560)
            })
            it("should solve most simplest case with only one connected valve", () => {
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const bestPath = generateAllPaths(valvesWithTunnels)
                // @ts-ignore
                expect(bestPath?.path).toEqual(["AA", "DD"])
                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(560)
            })
        })
        describe("generate all paths from AA and find the best case with three linearly connected valves", () => {
            const simpleExample = `
                    Valve AA has flow rate=0; tunnels lead to valves DD
                    Valve DD has flow rate=1; tunnels lead to valves AA, EE
                    Valve EE has flow rate=2; tunnels lead to valves DD
                    `
            const lines = parseLines(simpleExample)
            it("should calculate the forecast for the solution path", () => {
                // verify best path
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
                expect(pathThroughTunnels.getForecastTotal()).toEqual(0)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(85)
                pathThroughTunnels.move("DD", true)
                expect(pathThroughTunnels.minute).toEqual(3)
                expect(pathThroughTunnels.totalPressureMinutes).toEqual(1)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD"])
                expect(pathThroughTunnels.getForecastTotal()).toEqual(28)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(82)
                pathThroughTunnels.move("EE", true)
                expect(pathThroughTunnels.minute).toEqual(5)
                expect(pathThroughTunnels.totalPressureMinutes).toEqual(5)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD", "EE"])
                expect(pathThroughTunnels.getForecastTotal()).toEqual(80)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(80)
            })
            it("should solve simple case with linearly connected valves", () => {
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const bestPath = generateAllPaths(valvesWithTunnels)
                // @ts-ignore
                expect(bestPath?.path).toEqual(["AA", "DD", "EE"])
                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(80)
            })
        })
        describe("generate all paths from AA and find the best case with four linearly connected valves", () => {
            const simpleExample = `
                    Valve AA has flow rate=0; tunnels lead to valves DD
                    Valve DD has flow rate=1; tunnels lead to valves AA, EE
                    Valve EE has flow rate=2; tunnels lead to valves FF, DD
                    Valve FF has flow rate=3; tunnels lead to valves EE
                    `
            const lines = parseLines(simpleExample)
            it("should calculate the forecast for the solution path", () => {
                // verify best path
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(166)
                pathThroughTunnels.move("DD", true)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD"])
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(159)
                pathThroughTunnels.move("EE", true)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD", "EE"])
                pathThroughTunnels.move("FF", true)
                expect(pathThroughTunnels.openValves.toArray()).toEqual(["DD", "EE", "FF"])
                expect(pathThroughTunnels.getForecastTotal()).toEqual(152)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(152)
            })
            it("should solve simple case with linearly connected valves", () => {
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const bestPath = generateAllPaths(valvesWithTunnels)
                // @ts-ignore
                expect(bestPath?.path).toEqual(["AA", "DD", "EE", "FF"])
                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(152)
            })
        })
        describe("generate all paths from AA and find the best case where it is best to open one valve later", () => {
            const simpleExample = `
                    Valve AA has flow rate=0; tunnels lead to valves DD
                    Valve DD has flow rate=1; tunnels lead to valves AA, EE
                    Valve EE has flow rate=20; tunnels lead to valves DD
                    `
            const lines = parseLines(simpleExample)
            it("should calculate the forecast for the not optimal path", () => {
                // verify best path
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(607)
                pathThroughTunnels.move("DD", true)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(568)
                pathThroughTunnels.move("EE", true)
                expect(pathThroughTunnels.getForecastTotal()).toEqual(548)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(548)
            })
            it("should calculate the forecast for the optimal path", () => {
                // verify best path
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const pathThroughTunnels = new PathThroughTunnels(valvesWithTunnels)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(607)
                pathThroughTunnels.move("DD", false)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(586)
                pathThroughTunnels.move("EE", true)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(566)
                pathThroughTunnels.move("DD", true) // it's better to open DD later, so that we have the pressure of EE earlier
                expect(pathThroughTunnels.getForecastTotal()).toEqual(565)
                expect(pathThroughTunnels.getOptimisticForecastTotal()).toEqual(565)
            })
            it("should solve case where it is best to open one valve later", () => {
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const bestPath = generateAllPaths(valvesWithTunnels)
                // @ts-ignore
                expect(bestPath?.path).toEqual(["AA", "DD", "EE", "DD"])

                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(565)
            })
            it("should not look deep", () => {
                const valvesWithTunnels = parseValvesWithTunnels(lines)
                const bestPath = generateAllPaths(valvesWithTunnels, false)
                // @ts-ignore
                expect(bestPath?.path).toEqual(["AA", "DD", "EE"])

                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(548)
            })
        })
        it("should generate all paths from AA and find the best", () => {
            const bestPath = generateAllPaths(valvesWithTunnels)
            // @ts-ignore
            expect(bestPath!.getForecastTotal()).toEqual(1651)
        })
        it("should generate all paths from AA but can not find the best solution when not looking deep", () => {
            const bestPath = generateAllPaths(valvesWithTunnels, false)
            // @ts-ignore
            expect(bestPath!.getForecastTotal()).toBeLessThan(1651)
            // @ts-ignore
            expect(bestPath!.getForecastTotal()).toEqual(1647)
        })
    })
    describe("Exercise", () => {
        const input = readFileInput("inputDay16.txt")
        const lines = parseLines(input)
        const valvesWithTunnels = parseValvesWithTunnels(lines)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(51)
            expect(valvesWithTunnels.map.size).toBe(51)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                /* Takes very long (> 30 min)
                const bestPath = generateAllPaths(valvesWithTunnels, false)
                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(1775)
                const bestPath2 = generateAllPaths(valvesWithTunnels)
                // @ts-ignore
                expect(bestPath2!.getForecastTotal()).toEqual(1775)
                // Strangely enough a deep search where valves might be opened later has the same score than opening every valve when passing
                 */
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const bestPath = generateAllPaths(valvesWithTunnels, false)
                // @ts-ignore
                expect(bestPath!.getForecastTotal()).toEqual(1775)
            })
        })
    })
})
