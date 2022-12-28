// Advent of code 2022 - day 19

import {readFileSync} from "fs"
import {Dictionary} from "typescript-collections";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

class PartsList {
    partsList: Dictionary<string, number> = new Dictionary<string, number>()
}

class Blueprint {
    constructor(id: number) {
        this.id = id;
    }
    id: number
    partsLists: Dictionary<string, PartsList> = new Dictionary<string, PartsList>()
}

function parseBlueprint(line: string): Blueprint {
    const blueprintRegex = /Blueprint (\d+): Each ore robot costs (\d+) ore. Each clay robot costs (\d+) ore. Each obsidian robot costs (\d+) ore and (\d+) clay. Each geode robot costs (\d+) ore and (\d+) obsidian\./
    const regexResult = blueprintRegex.exec(line)
    if (!regexResult || regexResult.length < 7) throw Error(`can't parse ${line} ${regexResult?.length}`)
    const result = new Blueprint(Number.parseInt(regexResult[1]))
    const oreRobotParts = new PartsList()
    oreRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[2]))
    result.partsLists.setValue("ore", oreRobotParts)
    const clayRobotParts = new PartsList()
    clayRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[3]))
    result.partsLists.setValue("clay", clayRobotParts)
    const obsidianRobotParts = new PartsList()
    obsidianRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[4]))
    obsidianRobotParts.partsList.setValue("clay", Number.parseInt(regexResult[5]))
    result.partsLists.setValue("obsidian", obsidianRobotParts)
    const geodeRobotParts = new PartsList()
    geodeRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[6]))
    geodeRobotParts.partsList.setValue("obsidian", Number.parseInt(regexResult[7]))
    result.partsLists.setValue("geode", geodeRobotParts)
    return result
}

function parseBlueprints(lines: string[]) {
    return lines.map(line => parseBlueprint(line))
}

enum Action {
    doNothing = "nothing",
    buildOreRobot = "ore",
    buildClayRobot = "clay",
    buildObsidianRobot = "obsidian",
    buildGeodeRobot = "geode"
}

type RobotState = {
    nrRobots: { [id: string]: number }
    nrResources: { [id: string]: number }
}

function executeAction(blueprint: Blueprint, state: RobotState, action: Action) {
    // produce material for each robot
    for (const robot of Object.keys(state.nrRobots)) {
        const nrRobot = state.nrRobots[robot]
        if (nrRobot) {
            let nrResources = state.nrResources[robot]
            if (nrResources === undefined) nrResources = nrRobot
            else nrResources += nrRobot
            state.nrResources[robot] = nrResources
        }
    }
    // create new robot
    if (action !== Action.doNothing) {
        // consume resources for building the robot
        const partsNeeded = blueprint.partsLists.getValue(action)
        if (partsNeeded === undefined)  throw new Error(`no parts list to build ${action}`)
        for (const part of partsNeeded.partsList.keys()) {
            let nrNeeded = partsNeeded.partsList.getValue(part)!
            let nrResources = state.nrResources[part]
            if (nrResources === undefined) throw new Error(`no parts to build ${action}`)
            nrResources -= nrNeeded
            state.nrResources[part] = nrResources
        }
        // build robot
        let nrRobot = state.nrRobots[action]
        if (nrRobot === undefined) nrRobot = 1
        else nrRobot++
        state.nrRobots[action] = nrRobot
    }
}

function executeActions(blueprint: Blueprint, actions: Action[]): RobotState {
    const state: RobotState = { nrRobots: {}, nrResources: {}}
    state.nrRobots["ore"] = 1 // start with one ore robot
    for (const action of actions) {
        executeAction(blueprint, state, action);
    }
    return state
}

function enoughResources(blueprint: Blueprint, state: RobotState, action: string) {
    const resourcesNeeded = blueprint.partsLists.getValue(action)?.partsList
    if (!resourcesNeeded) throw new Error(`no blueprint for action=${action}`)
    for (const resourceName of resourcesNeeded.keys()) {
        const resourceNeeded = resourcesNeeded.getValue(resourceName)!
        if (state.nrResources[resourceName] === undefined || state.nrResources[resourceName] < resourceNeeded) return false
    }
    return true
}

function findPossibleActions(blueprint: Blueprint, state: RobotState) {
    let result: Action[] = []
    for (const action of Object.values(Action)) {
        if (action === Action.doNothing || enoughResources(blueprint, state, action)) result.push(action)
    }
    return result
}

function findBestPlan(blueprint: Blueprint, nrMinutes: number, resourceName: string) {
    type ActionsAndState = { finalState: RobotState, actions: Action[] }
    function findBestActions(actionsAndStates: ActionsAndState[], resourceName: string) {
        let best = actionsAndStates[0]
        for (let i = 1; i < actionsAndStates.length; i++) {
            const bestResourceNr = best.finalState.nrResources[resourceName] ?? 0
            const currResourceNr = actionsAndStates[i].finalState.nrResources[resourceName] ?? 0
            if (currResourceNr > bestResourceNr)
                best = actionsAndStates[i]
        }
        return best
    }
    let actionsAndStates: ActionsAndState[] = []
    const initialState = executeActions(blueprint, [])
    actionsAndStates.push({ finalState: initialState, actions: []})
    for (let i = 1; i <= nrMinutes; i++) {
        let nextActionsAndStates = []
        console.log(`findBestPlan minute=${i} paths=${actionsAndStates.length}`)
        for (const actionsAndState of actionsAndStates) {
            const possibleActions = findPossibleActions(blueprint, actionsAndState.finalState)
            for (const nextAction of possibleActions) {
                const nextState = JSON.parse(JSON.stringify(actionsAndState.finalState))
                executeAction(blueprint, nextState, nextAction)
                const nextActions = [...actionsAndState.actions]
                nextActions.push(nextAction)
                const nextActionsAndState = { actions: nextActions, finalState: nextState }
                nextActionsAndStates.push(nextActionsAndState)
            }
        }
        actionsAndStates = nextActionsAndStates
    }
    return findBestActions(actionsAndStates, resourceName)
}

describe("Day 19", () => {

    const allActions = [
        Action.doNothing, // Minute 1
        Action.doNothing, // Minute 2
        Action.buildClayRobot, // Minute 3
        Action.doNothing, // Minute 4
        Action.buildClayRobot, // Minute 5
        Action.doNothing, // Minute 6
        Action.buildClayRobot, // Minute 7
        Action.doNothing, // Minute 8
        Action.doNothing, // Minute 9
        Action.doNothing, // Minute 10
        Action.buildObsidianRobot, // Minute 11
        Action.buildClayRobot, // Minute 12
        Action.doNothing, // Minute 13
        Action.doNothing, // Minute 14
        Action.buildObsidianRobot, // Minute 15
        Action.doNothing, // Minute 16
        Action.doNothing, // Minute 17
        Action.buildGeodeRobot, // Minute 18
        Action.doNothing, // Minute 19
        Action.doNothing, // Minute 20
        Action.buildGeodeRobot, // Minute 21
        Action.doNothing, // Minute 22
        Action.doNothing, // Minute 23
        Action.doNothing // Minute 24
    ]
    const example = `
Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.
Blueprint 2: Each ore robot costs 2 ore. Each clay robot costs 3 ore. Each obsidian robot costs 3 ore and 8 clay. Each geode robot costs 3 ore and 12 obsidian.
        `
    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 2 lines", () => {
            expect(lines.length).toBe(2)
        })
        const blueprints = parseBlueprints(lines)
        it("should have parsed blueprints", () => {
            expect(blueprints.length).toBe(2)
            expect(blueprints[1].id).toBe(2)
            expect(blueprints[1].partsLists.getValue("obsidian")?.partsList.getValue("ore")).toBe(3)
            expect(blueprints[1].partsLists.getValue("geode")?.partsList.getValue("obsidian")).toBe(12)
        })
        describe("execute actions", () => {
            const state = executeActions(blueprints[0], [])
            it("should have constructed robots", () => {
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: {} })
            })
            it("should execute actions", () => {
                executeAction(blueprints[0], state, Action.doNothing) // minute 1
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: { ore: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 2
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: { ore: 2 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 3
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 1}, nrResources: { ore: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 4
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 1}, nrResources: { ore: 2, clay: 1 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 5
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 2}, nrResources: { ore: 1, clay: 2 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 6
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 2}, nrResources: { ore: 2, clay: 4 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 7
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 1, clay: 6 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 8
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 2, clay: 9 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 9
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 3, clay: 12 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 10
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 4, clay: 15 } })
                executeAction(blueprints[0], state, Action.buildObsidianRobot) // minute 11
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3, obsidian: 1}, nrResources: { ore: 2, clay: 4 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 12
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 1}, nrResources: { ore: 1, clay: 7, obsidian: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 13
                executeAction(blueprints[0], state, Action.doNothing) // minute 14
                executeAction(blueprints[0], state, Action.buildObsidianRobot) // minute 15
                executeAction(blueprints[0], state, Action.doNothing) // minute 16
                executeAction(blueprints[0], state, Action.doNothing) // minute 17
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2}, nrResources: { ore: 3, clay: 13, obsidian: 8 } })
                executeAction(blueprints[0], state, Action.buildGeodeRobot) // minute 18
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 1}, nrResources: { ore: 2, clay: 17, obsidian: 3 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 19
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 1}, nrResources: { ore: 3, clay: 21, obsidian: 5, geode: 1 } })
            })
            it("should execute all actions for the first blueprint", () => {
                const state = executeActions(blueprints[0], allActions)
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 2}, nrResources: { ore: 6, clay: 41, obsidian: 8, geode: 9 } })
            })
        })
        describe("find actions", () => {
            it("should find only nothing action when no ore is there", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: {} }
                const possibleActions = findPossibleActions(blueprints[0], state)
                expect(possibleActions).toStrictEqual([Action.doNothing])
            })
            it("should find buildClay action when there are two pieces of ore", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 2} }
                const possibleActions = findPossibleActions(blueprints[0], state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildClayRobot])
            })
            it("should find buildClay, buildOreAction action when there are four pieces of ore", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4} }
                const possibleActions = findPossibleActions(blueprints[0], state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildOreRobot, Action.buildClayRobot])
            })
            it("should find buildClay, buildOreAction, buildGeode action when there are four pieces of ore and twelve of obsidian", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4, obsidian: 12} }
                const possibleActions = findPossibleActions(blueprints[0], state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildOreRobot, Action.buildClayRobot, Action.buildGeodeRobot])
            })
        })
        describe("find solution for some goals", () => {
            it("should need to do nothing for a time span of 1 minute, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 1, "ore")
                expect(actions).toStrictEqual([Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(1)
            })
            it("should need to do nothing for a time span of 2 minutes, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 2, "ore")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(2)
            })
            it("should need to do nothing for a time span of 4 minutes, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 4, "ore")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing, Action.doNothing, Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(4)
            })
            it("should need to build clay robot for a time span of 4 minutes, searching for clay", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 4, "clay")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing, Action.buildClayRobot, Action.doNothing])
                expect(finalState.nrRobots["ore"]).toBe(1)
                expect(finalState.nrRobots["clay"]).toBe(1)
                expect(finalState.nrResources["ore"]).toBe(2)
            })
            it("should find the best plan, searching for geode", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 24, "geode")
                expect(finalState.nrResources["geode"]).toBe(12)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay18.txt")
        const lines = parseLines(input)
        it("should have parsed lines and coords", () => {
            expect(lines.length).toBe(2781)
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
